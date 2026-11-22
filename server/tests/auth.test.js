const mongoose = require('mongoose');
const request = require('supertest');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { MongoMemoryServer } = require('mongodb-memory-server');
const { createApp } = require('../src/app');
const User = require('../src/models/User');
const Project = require('../src/models/Project');
const Membership = require('../src/models/Membership');

jest.setTimeout(60000);

const SECRET = 'test-only-jwt-secret';
const PASSWORD = 'Correct-Horse-42';
const app = createApp({ jwtSecret: SECRET });

let mongod;
let priya;
let other;
let projA;
let projB;
let projC;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
  await Promise.all([User.syncIndexes(), Project.syncIndexes(), Membership.syncIndexes()]);
});

beforeEach(async () => {
  const passwordHash = await bcrypt.hash(PASSWORD, 4);
  priya = await User.create({ name: 'Priya', email: 'priya@university.edu', passwordHash });
  other = await User.create({ name: 'Omar', email: 'omar@university.edu', passwordHash });
  projA = await Project.create({ name: 'A', createdBy: priya._id, joinCode: 'CODEA1' });
  projB = await Project.create({ name: 'B', createdBy: other._id, joinCode: 'CODEB1' });
  projC = await Project.create({ name: 'C', createdBy: other._id, joinCode: 'CODEC1' });
  await Membership.create({ userId: priya._id, projectId: projA._id, role: 'lead' });
  await Membership.create({ userId: priya._id, projectId: projB._id, role: 'member' });
  await Membership.create({ userId: other._id, projectId: projB._id, role: 'lead' });
  await Membership.create({ userId: other._id, projectId: projC._id, role: 'lead' });
});

afterEach(async () => {
  jest.restoreAllMocks();
  await Promise.all([User.deleteMany({}), Project.deleteMany({}), Membership.deleteMany({})]);
});

afterAll(async () => {
  await mongoose.disconnect();
  if (mongod) await mongod.stop();
});

const signIn = (body) => request(app).post('/api/auth/signin').send(body);
const projects = (auth) => {
  const req = request(app).get('/api/projects');
  return auth === undefined ? req : req.set('Authorization', auth);
};
const b64 = (obj) => Buffer.from(JSON.stringify(obj)).toString('base64url');

describe('POST /api/auth/signin', () => {
  test('valid credentials return token and user without passwordHash; projects show roles', async () => {
    const res = await signIn({ email: 'Priya@University.EDU', password: PASSWORD });
    expect(res.status).toBe(200);
    expect(typeof res.body.token).toBe('string');
    expect(res.body.user).toEqual({ id: priya.id, name: 'Priya', email: 'priya@university.edu' });
    expect(JSON.stringify(res.body)).not.toMatch(/passwordHash/);

    const list = await projects(`Bearer ${res.body.token}`);
    expect(list.status).toBe(200);
    const byName = Object.fromEntries(list.body.projects.map((p) => [p.name, p.role]));
    expect(byName).toEqual({ A: 'lead', B: 'member' });
  });

  test('wrong password and unknown email both return 401 with identical bodies', async () => {
    const wrong = await signIn({ email: 'priya@university.edu', password: 'nope-nope' });
    const unknown = await signIn({ email: 'nobody@university.edu', password: PASSWORD });
    expect(wrong.status).toBe(401);
    expect(unknown.status).toBe(401);
    expect(wrong.body).toEqual({ error: 'Email or password is incorrect.' });
    expect(unknown.body).toEqual(wrong.body);
  });

  test.each([
    ['missing email', { password: PASSWORD }],
    ['missing password', { email: 'priya@university.edu' }],
    ['empty body', {}],
    ['non-string email', { email: ['priya@university.edu'], password: PASSWORD }],
    ['non-string password', { email: 'priya@university.edu', password: { $ne: null } }],
  ])('%s returns 400', async (_label, body) => {
    const res = await signIn(body);
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'Email and password are required.' });
  });

  test('malformed JSON returns 400 and does not echo the body', async () => {
    const raw = `{"email":"priya@university.edu","password":"${PASSWORD}"`;
    const res = await request(app).post('/api/auth/signin').set('Content-Type', 'application/json').send(raw);
    expect(res.status).toBe(400);
    expect(res.text).not.toContain(PASSWORD);
    expect(res.text).not.toContain('priya@university.edu');
  });

  test('plaintext password is never logged or returned', async () => {
    const spies = ['log', 'info', 'warn', 'error'].map((m) => jest.spyOn(console, m).mockImplementation(() => {}));
    const ok = await signIn({ email: 'priya@university.edu', password: PASSWORD });
    const bad = await signIn({ email: 'priya@university.edu', password: `${PASSWORD}-wrong` });
    expect(ok.status).toBe(200);
    expect(bad.status).toBe(401);
    expect(ok.text).not.toContain(PASSWORD);
    expect(bad.text).not.toContain(PASSWORD);
    for (const spy of spies) {
      for (const args of spy.mock.calls) {
        expect(args.map((a) => (typeof a === 'string' ? a : JSON.stringify(a))).join(' ')).not.toContain(PASSWORD);
      }
    }
  });
});

describe('no public sign-up', () => {
  test.each(['/api/auth/signup', '/api/auth/register', '/api/signup', '/api/users'])('POST %s returns 404', async (path) => {
    const res = await request(app).post(path).send({ name: 'X', email: 'x@university.edu', password: PASSWORD });
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'Not found.' });
  });
});

describe('GET /api/projects auth', () => {
  const unauthorized = { error: 'Sign in required.' };

  test('no token returns 401', async () => {
    const res = await projects();
    expect(res.status).toBe(401);
    expect(res.body).toEqual(unauthorized);
  });

  test.each(['Bearer', 'Bearer ', 'Basic x', 'garbage'])('malformed header "%s" returns 401', async (header) => {
    const res = await projects(header);
    expect(res.status).toBe(401);
    expect(res.body).toEqual(unauthorized);
  });

  test('expired token returns 401', async () => {
    const token = jwt.sign({ sub: priya.id }, SECRET, { algorithm: 'HS256', expiresIn: -10 });
    const res = await projects(`Bearer ${token}`);
    expect(res.status).toBe(401);
  });

  test('token signed with a different secret returns 401', async () => {
    const token = jwt.sign({ sub: priya.id }, 'some-other-secret', { algorithm: 'HS256', expiresIn: '1h' });
    const res = await projects(`Bearer ${token}`);
    expect(res.status).toBe(401);
  });

  test('token with tampered payload returns 401', async () => {
    const [h, , s] = jwt.sign({ sub: priya.id }, SECRET, { algorithm: 'HS256', expiresIn: '1h' }).split('.');
    const forged = `${h}.${b64({ sub: other.id, exp: Math.floor(Date.now() / 1000) + 3600 })}.${s}`;
    const res = await projects(`Bearer ${forged}`);
    expect(res.status).toBe(401);
  });

  test('token with alg "none" returns 401', async () => {
    const token = `${b64({ alg: 'none', typ: 'JWT' })}.${b64({ sub: priya.id, exp: Math.floor(Date.now() / 1000) + 3600 })}.`;
    const res = await projects(`Bearer ${token}`);
    expect(res.status).toBe(401);
  });
});

describe('GET /api/projects scope', () => {
  test("returns only the caller's projects and never joinCode", async () => {
    const token = jwt.sign({ sub: priya.id }, SECRET, { algorithm: 'HS256', expiresIn: '1h' });
    const res = await projects(`Bearer ${token}`);
    expect(res.status).toBe(200);
    const ids = res.body.projects.map((p) => String(p.id)).sort();
    expect(ids).toEqual([projA.id, projB.id].sort());
    expect(ids).not.toContain(projC.id);
    expect(JSON.stringify(res.body)).not.toMatch(/joinCode|CODE[ABC]1/);
    for (const p of res.body.projects) expect(Object.keys(p).sort()).toEqual(['id', 'lead', 'memberCount', 'name', 'role']);
  });
});
