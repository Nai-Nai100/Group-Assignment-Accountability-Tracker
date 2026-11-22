const mongoose = require('mongoose');
const request = require('supertest');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { MongoMemoryServer } = require('mongodb-memory-server');
const { createApp } = require('../src/app');
const attempts = require('../src/attempts');
const User = require('../src/models/User');
const Project = require('../src/models/Project');
const Membership = require('../src/models/Membership');

jest.setTimeout(60000);

const SECRET = 'test-only-jwt-secret';
const PASSWORD = 'Correct-Horse-42';
const app = createApp({ jwtSecret: SECRET });
const BCRYPT = /^\$2[aby]\$\d{2}\$/;

let mongod;
let priya; // on no project
let omar; // leads A and B
let projA;
let projB;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
  await Promise.all([User.syncIndexes(), Project.syncIndexes(), Membership.syncIndexes()]);
});

beforeEach(async () => {
  attempts.reset();
  const passwordHash = await bcrypt.hash(PASSWORD, 4);
  priya = await User.create({ name: 'Priya', email: 'priya@university.edu', passwordHash });
  omar = await User.create({ name: 'Omar', email: 'omar@university.edu', passwordHash });
  projA = await Project.create({ name: 'A', createdBy: omar._id, joinCode: '111111' });
  projB = await Project.create({ name: 'B', createdBy: omar._id, joinCode: '222222' });
  await Membership.create({ userId: omar._id, projectId: projA._id, role: 'lead' });
  await Membership.create({ userId: omar._id, projectId: projB._id, role: 'lead' });
});

afterEach(async () => {
  jest.restoreAllMocks();
  await Promise.all([User.deleteMany({}), Project.deleteMany({}), Membership.deleteMany({})]);
});

afterAll(async () => {
  await mongoose.disconnect();
  if (mongod) await mongod.stop();
});

const bearer = (user) => `Bearer ${jwt.sign({ sub: user.id }, SECRET, { algorithm: 'HS256', expiresIn: '1h' })}`;
const join = (body, auth) => {
  const req = request(app).post('/api/projects/join').send(body);
  return auth ? req.set('Authorization', auth) : req;
};
const joinSignedOut = (body) => request(app).post('/api/auth/join').send(body);
const list = (auth) => request(app).get('/api/projects').set('Authorization', auth);
const membership = (user, project) => Membership.findOne({ userId: user._id, projectId: project._id }).lean();
const NEW = { name: 'Lena', email: 'lena@university.edu', password: 'New-Password-1' };

describe('POST /api/projects/join (signed in)', () => {
  test('a correct code adds a member membership and the project lists with role member', async () => {
    const res = await join({ code: '111111' }, bearer(priya));
    expect(res.status).toBe(201);
    expect(res.body).toEqual({ project: { id: projA.id, name: 'A', role: 'member' } });
    expect((await membership(priya, projA)).role).toBe('member');
    expect((await list(bearer(priya))).body.projects).toEqual([{ id: projA.id, name: 'A', role: 'member', lead: { name: 'Omar' }, memberCount: 2 }]);
  });

  test('a wrong code returns 400 and creates no membership', async () => {
    const res = await join({ code: '999999' }, bearer(priya));
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/doesn't match a project/);
    expect(await Membership.countDocuments({ userId: priya._id })).toBe(0);
  });

  test.each([['5 digits', '11111'], ['letters', 'abcdef'], ['number', 111111], ['object', { $ne: null }], ['missing', undefined]])(
    'a malformed code (%s) returns 400',
    async (_label, code) => {
      const res = await join({ code }, bearer(priya));
      expect(res.status).toBe(400);
      expect(res.body).toEqual({ error: 'Enter the 6-digit join code.' });
      expect(await Membership.countDocuments({ userId: priya._id })).toBe(0);
    },
  );

  test('joining A gives no access to B', async () => {
    await join({ code: '111111' }, bearer(priya));
    const res = await request(app).get(`/api/projects/${projB.id}/join-code`).set('Authorization', bearer(priya));
    expect(res.status).toBe(404);
    expect(res.text).not.toMatch(/222222|joinCode/);
    expect((await list(bearer(priya))).body.projects.map((p) => p.name)).toEqual(['A']);
  });

  test('role:lead in the body is ignored, and the joiner cannot read the join code (403)', async () => {
    const res = await join({ code: '111111', role: 'lead' }, bearer(priya));
    expect(res.status).toBe(201);
    expect(res.body.project.role).toBe('member');
    expect((await membership(priya, projA)).role).toBe('member');
    const code = await request(app).get(`/api/projects/${projA.id}/join-code`).set('Authorization', bearer(priya));
    expect(code.status).toBe(403);
    expect(code.text).not.toMatch(/111111/);
  });

  test('joining twice returns 409', async () => {
    await join({ code: '111111' }, bearer(priya));
    const res = await join({ code: '111111' }, bearer(priya));
    expect(res.status).toBe(409);
    expect(await Membership.countDocuments({ userId: priya._id })).toBe(1);
  });

  test('the lead using their own code gets 409 and stays lead', async () => {
    const res = await join({ code: '111111' }, bearer(omar));
    expect(res.status).toBe(409);
    expect((await membership(omar, projA)).role).toBe('lead');
    expect(await Membership.countDocuments({ userId: omar._id, projectId: projA._id })).toBe(1);
  });

  test('no token returns 401 and creates nothing', async () => {
    const res = await join({ code: '111111' });
    expect(res.status).toBe(401);
    expect(await Membership.countDocuments()).toBe(2);
  });
});

describe('wrong-guess limit', () => {
  const wrong = async (auth, n = attempts.LIMIT) => {
    for (let i = 0; i < n; i += 1) expect((await join({ code: '999999' }, auth)).status).toBe(400);
  };

  test('after 5 wrong codes the 6th request is 429, even with a correct code, and adds nothing', async () => {
    await wrong(bearer(priya));
    const res = await join({ code: '111111' }, bearer(priya));
    expect(res.status).toBe(429);
    expect(await Membership.countDocuments({ userId: priya._id })).toBe(0);
  });

  test('4 wrong codes do not block', async () => {
    await wrong(bearer(priya), attempts.LIMIT - 1);
    expect((await join({ code: '111111' }, bearer(priya))).status).toBe(201);
  });

  test('malformed codes do not count', async () => {
    for (let i = 0; i < 6; i += 1) await join({ code: 'abc' }, bearer(priya));
    expect((await join({ code: '111111' }, bearer(priya))).status).toBe(201);
  });

  test('failures are counted per user and per IP', async () => {
    await wrong(bearer(priya));
    expect(attempts.blocked([`user:${priya.id}`])).toBe(true);
    expect(attempts.blocked([`user:${omar.id}`])).toBe(false);
    // Every supertest request shares one socket address, so the IP key blocks another user too.
    expect((await join({ code: '111111' }, bearer(omar))).status).toBe(429);
    // ...and the signed-out join from the same IP.
    expect((await joinSignedOut({ ...NEW, code: '111111' })).status).toBe(429);
    expect(await User.countDocuments({ email: NEW.email })).toBe(0);
  });

  test('the limit resets after 15 minutes', async () => {
    const start = Date.now();
    jest.spyOn(Date, 'now').mockReturnValue(start);
    await wrong(bearer(priya));
    expect((await join({ code: '111111' }, bearer(priya))).status).toBe(429);
    Date.now.mockReturnValue(start + 15 * 60 * 1000 - 1);
    expect((await join({ code: '111111' }, bearer(priya))).status).toBe(429);
    Date.now.mockReturnValue(start + 15 * 60 * 1000);
    expect((await join({ code: '111111' }, bearer(priya))).status).toBe(201);
  });
});

describe('POST /api/auth/join (signed out)', () => {
  test('a new email creates a hashed account, a member membership, and a working token', async () => {
    const res = await joinSignedOut({ ...NEW, code: '111111' });
    expect(res.status).toBe(201);
    expect(res.body.project).toEqual({ id: projA.id, name: 'A', role: 'member' });
    expect(res.body.user).toMatchObject({ name: 'Lena', email: 'lena@university.edu' });
    expect(res.text).not.toMatch(/passwordHash|\$2[aby]\$|New-Password-1/);

    const user = await User.findOne({ email: NEW.email }).lean();
    expect(user.passwordHash).toMatch(BCRYPT);
    expect(user.passwordHash).not.toBe(NEW.password);
    expect(await bcrypt.compare(NEW.password, user.passwordHash)).toBe(true);
    expect((await membership(user, projA)).role).toBe('member');

    const projects = await list(`Bearer ${res.body.token}`);
    expect(projects.body.projects).toEqual([{ id: projA.id, name: 'A', role: 'member', lead: { name: 'Omar' }, memberCount: 2 }]);
  });

  test('the new account can then sign in', async () => {
    await joinSignedOut({ ...NEW, code: '111111' });
    const res = await request(app).post('/api/auth/signin').send({ email: NEW.email, password: NEW.password });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeTruthy();
  });

  test('role:lead in the body is ignored', async () => {
    const res = await joinSignedOut({ ...NEW, code: '111111', role: 'lead' });
    expect(res.body.project.role).toBe('member');
    const user = await User.findOne({ email: NEW.email });
    expect((await membership(user, projA)).role).toBe('member');
  });

  test('an existing email with the right password joins that account, with no duplicate and the name unchanged', async () => {
    const res = await joinSignedOut({ code: '111111', name: 'Someone Else', email: 'Priya@University.edu', password: PASSWORD });
    expect(res.status).toBe(201);
    expect(res.body.user.id).toBe(priya.id);
    expect(await User.countDocuments({ email: 'priya@university.edu' })).toBe(1);
    expect((await User.findById(priya._id)).name).toBe('Priya');
    expect((await membership(priya, projA)).role).toBe('member');
  });

  test('an existing email with the wrong password returns 401, adds nothing, and counts toward the limit', async () => {
    const body = { code: '111111', name: 'Priya', email: 'priya@university.edu', password: 'wrong-password' };
    const res = await joinSignedOut(body);
    expect(res.status).toBe(401);
    expect(res.body).toEqual({ error: 'Email or password is incorrect.' });
    expect(await Membership.countDocuments({ userId: priya._id })).toBe(0);

    for (let i = 1; i < attempts.LIMIT; i += 1) await joinSignedOut(body);
    expect((await joinSignedOut({ ...body, password: PASSWORD })).status).toBe(429);
    expect(await Membership.countDocuments({ userId: priya._id })).toBe(0);
  });

  test('a short password for a new email returns 400 and creates no user', async () => {
    const res = await joinSignedOut({ ...NEW, code: '111111', password: 'short7!' });
    expect(res.status).toBe(400);
    expect(await User.countDocuments({ email: NEW.email })).toBe(0);
  });

  test('a password over 72 bytes returns 400 and creates no user', async () => {
    const res = await joinSignedOut({ ...NEW, code: '111111', password: 'x'.repeat(73) });
    expect(res.status).toBe(400);
    expect(await User.countDocuments({ email: NEW.email })).toBe(0);
  });

  test('a wrong code returns 400 and creates no user', async () => {
    const res = await joinSignedOut({ ...NEW, code: '999999' });
    expect(res.status).toBe(400);
    expect(await User.countDocuments({ email: NEW.email })).toBe(0);
  });

  test.each([
    ['missing name', { name: undefined }],
    ['blank name', { name: '  ' }],
    ['101-character name', { name: 'x'.repeat(101) }],
    ['missing email', { email: undefined }],
    ['invalid email', { email: 'not-an-email' }],
    ['object email', { email: { $ne: null } }],
    ['missing password', { password: undefined }],
  ])('%s returns 400 and creates no user', async (_label, change) => {
    const before = await User.countDocuments();
    const res = await joinSignedOut({ ...NEW, code: '111111', ...change });
    expect(res.status).toBe(400);
    expect(await User.countDocuments()).toBe(before);
  });

  test('already a member returns 409', async () => {
    const res = await joinSignedOut({ code: '111111', name: 'Omar', email: 'omar@university.edu', password: PASSWORD });
    expect(res.status).toBe(409);
    expect((await membership(omar, projA)).role).toBe('lead');
  });

  test('there is no other sign-up route', async () => {
    const res = await request(app).post('/api/auth/signup').send({ ...NEW });
    expect(res.status).toBe(404);
    expect(await User.countDocuments({ email: NEW.email })).toBe(0);
  });
});

describe('policy-review fixes (#14)', () => {
  test('a burst of wrong codes sent at the same time gets at most 5 guesses', async () => {
    const results = await Promise.all(
      Array.from({ length: 12 }, () => join({ code: '999999' }, bearer(priya))),
    );
    const statuses = results.map((r) => r.status);
    expect(statuses.filter((s) => s === 400)).toHaveLength(attempts.LIMIT);
    expect(statuses.filter((s) => s === 429)).toHaveLength(12 - attempts.LIMIT);
  });

  test('a burst of wrong passwords for an existing email gets at most 5 guesses', async () => {
    const body = { code: '111111', name: 'Priya', email: 'priya@university.edu', password: 'wrong-password' };
    const results = await Promise.all(Array.from({ length: 8 }, () => joinSignedOut(body)));
    expect(results.filter((r) => r.status === 401)).toHaveLength(attempts.LIMIT);
    expect(results.filter((r) => r.status === 429)).toHaveLength(8 - attempts.LIMIT);
  });

  test('successful joins do not use up the limit', async () => {
    for (const code of ['111111', '222222']) expect((await join({ code }, bearer(priya))).status).toBe(201);
    await Project.create({ name: 'C', createdBy: omar._id, joinCode: '333333' });
    for (let i = 0; i < attempts.LIMIT - 1; i += 1) await join({ code: '999999' }, bearer(priya));
    expect((await join({ code: '333333' }, bearer(priya))).status).toBe(201);
  });

  test('a short password gets the same 400 for a known and an unknown email, before any lookup', async () => {
    const known = await joinSignedOut({ code: '111111', name: 'Priya', email: 'priya@university.edu', password: 'short7!' });
    const unknown = await joinSignedOut({ ...NEW, code: '111111', password: 'short7!' });
    expect(known.status).toBe(400);
    expect(unknown.status).toBe(400);
    expect(known.body).toEqual(unknown.body);
    expect(await Membership.countDocuments({ userId: priya._id })).toBe(0);
  });
});
