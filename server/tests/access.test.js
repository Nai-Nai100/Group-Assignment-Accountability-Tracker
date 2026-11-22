const express = require('express');
const mongoose = require('mongoose');
const request = require('supertest');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { MongoMemoryServer } = require('mongodb-memory-server');
const { requireAuth } = require('../src/auth');
const { requireMember, requireLead } = require('../src/access');
const User = require('../src/models/User');
const Project = require('../src/models/Project');
const Membership = require('../src/models/Membership');

jest.setTimeout(60000);

const SECRET = 'test-only-jwt-secret';

// Fixture app: test-only routes that exercise the middleware chain.
const app = express();
app.use(express.json());
app.get('/p/:projectId', requireAuth(SECRET), requireMember, async (req, res) => {
  const project = await Project.findById(req.projectId).lean();
  res.json({ name: project.name, role: req.role });
});
app.post('/p/:projectId/lead', requireAuth(SECRET), requireMember, requireLead, (req, res) => {
  res.json({ ok: true });
});

let mongod;
let priya;
let omar;
let projA;
let projB;
let projC;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
  await Promise.all([User.syncIndexes(), Project.syncIndexes(), Membership.syncIndexes()]);
});

beforeEach(async () => {
  const passwordHash = await bcrypt.hash('Correct-Horse-42', 4);
  priya = await User.create({ name: 'Priya', email: 'priya@university.edu', passwordHash });
  omar = await User.create({ name: 'Omar', email: 'omar@university.edu', passwordHash });
  projA = await Project.create({ name: 'A', createdBy: priya._id, joinCode: 'CODEA1' });
  projB = await Project.create({ name: 'B', createdBy: omar._id, joinCode: 'CODEB1' });
  projC = await Project.create({ name: 'C', createdBy: omar._id, joinCode: 'CODEC1' });
  // Priya: lead on A, member on B, not in C.
  await Membership.create({ userId: priya._id, projectId: projA._id, role: 'lead' });
  await Membership.create({ userId: priya._id, projectId: projB._id, role: 'member' });
  await Membership.create({ userId: omar._id, projectId: projB._id, role: 'lead' });
  await Membership.create({ userId: omar._id, projectId: projC._id, role: 'lead' });
});

afterEach(async () => {
  await Promise.all([User.deleteMany({}), Project.deleteMany({}), Membership.deleteMany({})]);
});

afterAll(async () => {
  await mongoose.disconnect();
  if (mongod) await mongod.stop();
});

const tokenFor = (user, extra = {}) =>
  jwt.sign({ sub: user.id, ...extra }, SECRET, { algorithm: 'HS256', expiresIn: '1h' });
const bearer = (user, extra) => `Bearer ${tokenFor(user, extra)}`;
const getProject = (id, auth) => {
  const req = request(app).get(`/p/${id}`);
  return auth ? req.set('Authorization', auth) : req;
};
const leadAction = (id, auth, body = {}) => {
  const req = request(app).post(`/p/${id}/lead`).send(body);
  return auth ? req.set('Authorization', auth) : req;
};

describe('requireMember', () => {
  test('member of a project gets its data and their role from Membership', async () => {
    const a = await getProject(projA.id, bearer(priya));
    expect(a.status).toBe(200);
    expect(a.body).toEqual({ name: 'A', role: 'lead' });

    const b = await getProject(projB.id, bearer(priya));
    expect(b.status).toBe(200);
    expect(b.body).toEqual({ name: 'B', role: 'member' });
  });

  test('non-member requesting another project gets 404 with no project data', async () => {
    const res = await getProject(projC.id, bearer(priya));
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'Not found.' });
    expect(res.text).not.toMatch(/"C"|CODEC1|lead/);
  });

  test('non-member and nonexistent project return identical 404s', async () => {
    const missing = await getProject(new mongoose.Types.ObjectId().toString(), bearer(priya));
    const notMine = await getProject(projC.id, bearer(priya));
    expect(missing.status).toBe(404);
    expect(notMine.body).toEqual(missing.body);
  });

  test.each(['not-an-id', '123', '%24ne'])('malformed projectId "%s" returns 404', async (id) => {
    const res = await getProject(id, bearer(priya));
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'Not found.' });
  });
});

describe('requireLead', () => {
  test('lead calling a lead-only route gets 200', async () => {
    const res = await leadAction(projA.id, bearer(priya));
    expect(res.status).toBe(200);
  });

  test('team member calling a lead-only route gets 403', async () => {
    const res = await leadAction(projB.id, bearer(priya));
    expect(res.status).toBe(403);
    expect(res.body).toEqual({ error: 'Only the team lead can do this.' });
  });

  test('being lead on A does not make you lead on B', async () => {
    expect((await leadAction(projA.id, bearer(priya))).status).toBe(200);
    expect((await leadAction(projB.id, bearer(priya))).status).toBe(403);
  });

  test('non-member calling a lead-only route gets 404, not 403', async () => {
    const res = await leadAction(projC.id, bearer(priya));
    expect(res.status).toBe(404);
  });
});

describe('role comes from Membership only', () => {
  test('role: "lead" in the request body is ignored', async () => {
    const res = await leadAction(projB.id, bearer(priya), { role: 'lead', projectId: projA.id });
    expect(res.status).toBe(403);
  });

  test('forged role/projectId claims in a validly signed JWT are ignored', async () => {
    const auth = bearer(priya, { role: 'lead', projectId: projB.id });
    expect((await leadAction(projB.id, auth)).status).toBe(403);
    expect((await getProject(projB.id, auth)).body.role).toBe('member');
  });
});

describe('authentication', () => {
  test.each([
    ['GET', (id, auth) => getProject(id, auth)],
    ['POST lead', (id, auth) => leadAction(id, auth)],
  ])('%s with no token returns 401', async (_label, call) => {
    const res = await call(projA.id);
    expect(res.status).toBe(401);
    expect(res.body).toEqual({ error: 'Sign in required.' });
  });

  test('invalid token returns 401', async () => {
    const wrongSecret = jwt.sign({ sub: priya.id }, 'some-other-secret', { algorithm: 'HS256', expiresIn: '1h' });
    expect((await getProject(projA.id, 'Bearer garbage')).status).toBe(401);
    expect((await getProject(projA.id, `Bearer ${wrongSecret}`)).status).toBe(401);
    expect((await leadAction(projA.id, `Bearer ${wrongSecret}`)).status).toBe(401);
  });

  test('requireMember without requireAuth (no req.userId) returns 401', async () => {
    const bare = express();
    bare.get('/p/:projectId', requireMember, (req, res) => res.json({ ok: true }));
    const res = await request(bare).get(`/p/${projA.id}`);
    expect(res.status).toBe(401);
  });
});
