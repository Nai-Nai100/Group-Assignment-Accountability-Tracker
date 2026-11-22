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
const app = createApp({ jwtSecret: SECRET });

let mongod;
let priya; // leads A, member on B
let omar; // leads B
let lena; // member on A
let dana; // leads C only
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
  const user = (name) => User.create({ name, email: `${name.toLowerCase()}@university.edu`, passwordHash });
  [priya, omar, lena, dana] = await Promise.all(['Priya', 'Omar', 'Lena', 'Dana'].map(user));
  projA = await Project.create({ name: 'Transit study', course: 'ENV 215', createdBy: priya._id, joinCode: '111111' });
  projB = await Project.create({ name: 'Bridge report', createdBy: omar._id, joinCode: '222222' });
  projC = await Project.create({ name: 'Secret plan', createdBy: dana._id, joinCode: '333333' });
  await Membership.create([
    { userId: priya._id, projectId: projA._id, role: 'lead' },
    { userId: lena._id, projectId: projA._id, role: 'member' },
    { userId: omar._id, projectId: projB._id, role: 'lead' },
    { userId: priya._id, projectId: projB._id, role: 'member' },
    { userId: dana._id, projectId: projC._id, role: 'lead' },
  ]);
});

afterEach(async () => {
  await Promise.all([User.deleteMany({}), Project.deleteMany({}), Membership.deleteMany({})]);
});

afterAll(async () => {
  await mongoose.disconnect();
  if (mongod) await mongod.stop();
});

const bearer = (u) => `Bearer ${jwt.sign({ sub: u.id }, SECRET, { algorithm: 'HS256', expiresIn: '1h' })}`;
const get = (path, u) => {
  const req = request(app).get(path);
  return u ? req.set('Authorization', bearer(u)) : req;
};
const details = (project, u) => get(`/api/projects/${project.id}`, u);

describe('GET /api/projects (D4)', () => {
  test('a lead on A and member on B sees both with the correct roles', async () => {
    const res = await get('/api/projects', priya);
    expect(res.status).toBe(200);
    expect(res.body.projects).toHaveLength(2);
    expect(res.body.projects).toEqual(
      expect.arrayContaining([
        { id: projA.id, name: 'Transit study', course: 'ENV 215', role: 'lead' },
        { id: projB.id, name: 'Bridge report', role: 'member' },
      ]),
    );
  });
});

describe('GET /api/projects/:projectId', () => {
  test('lead on A gets role lead, their lead name and the full team, lead first', async () => {
    const res = await details(projA, priya);
    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      project: {
        id: projA.id,
        name: 'Transit study',
        course: 'ENV 215',
        role: 'lead',
        lead: { name: 'Priya' },
        members: [
          { id: priya.id, name: 'Priya', role: 'lead' },
          { id: lena.id, name: 'Lena', role: 'member' },
        ],
      },
    });
  });

  test('the same user on B gets role member, the B lead name and the full team', async () => {
    const res = await details(projB, priya);
    expect(res.status).toBe(200);
    expect(res.body.project).toMatchObject({
      id: projB.id,
      name: 'Bridge report',
      role: 'member',
      lead: { name: 'Omar' },
      members: [
        { id: omar.id, name: 'Omar', role: 'lead' },
        { id: priya.id, name: 'Priya', role: 'member' },
      ],
    });
  });

  test('the response has no emails, password hashes or join code', async () => {
    for (const [p, u] of [[projA, priya], [projA, lena], [projB, priya]]) {
      const res = await details(p, u);
      expect(res.status).toBe(200);
      expect(res.text).not.toMatch(/@|email|passwordHash|joinCode|111111|222222/i);
      res.body.project.members.forEach((m) => expect(Object.keys(m).sort()).toEqual(['id', 'name', 'role']));
    }
  });

  test('each project returns only its own members (no cross-project leakage)', async () => {
    const a = await details(projA, priya);
    const b = await details(projB, priya);
    expect(a.body.project.members.map((m) => m.name)).toEqual(['Priya', 'Lena']);
    expect(b.body.project.members.map((m) => m.name)).toEqual(['Omar', 'Priya']);
    expect(a.text).not.toMatch(/Omar|Dana|Bridge report|Secret plan/);
    expect(b.text).not.toMatch(/Lena|Dana|Transit study|Secret plan/);
  });

  test('a user not on the project gets 404 with no project data', async () => {
    const res = await details(projC, priya);
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'Not found.' });
    expect(res.text).not.toMatch(/Secret plan|Dana|333333/);
  });

  test('a malformed id returns 404', async () => {
    const res = await get('/api/projects/not-an-id', priya);
    expect(res.status).toBe(404);
  });

  test('no token returns 401 with no project data', async () => {
    const res = await details(projA);
    expect(res.status).toBe(401);
    expect(res.text).not.toMatch(/Transit study|Priya|Lena/);
  });
});

describe('lead-only refusal on the server (D6, RC-02)', () => {
  test('a team member calling the join-code endpoint gets 403 and no code', async () => {
    const res = await get(`/api/projects/${projB.id}/join-code`, priya);
    expect(res.status).toBe(403);
    expect(res.body).toEqual({ error: 'Only the team lead can do this.' });
    expect(res.text).not.toMatch(/222222/);
  });

  test('the same user gets the code on the project they lead', async () => {
    const res = await get(`/api/projects/${projA.id}/join-code`, priya);
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ joinCode: '111111' });
  });
});
