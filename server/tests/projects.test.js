const crypto = require('crypto');
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
const CODE = /^\d{6}$/;

let mongod;
let priya;
let omar;
let projB; // Omar leads, Priya is a member
let projC; // Omar only

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
  await Promise.all([User.syncIndexes(), Project.syncIndexes(), Membership.syncIndexes()]);
});

beforeEach(async () => {
  const passwordHash = await bcrypt.hash('Correct-Horse-42', 4);
  priya = await User.create({ name: 'Priya', email: 'priya@university.edu', passwordHash });
  omar = await User.create({ name: 'Omar', email: 'omar@university.edu', passwordHash });
  projB = await Project.create({ name: 'B', createdBy: omar._id, joinCode: '111111' });
  projC = await Project.create({ name: 'C', createdBy: omar._id, joinCode: '222222' });
  await Membership.create({ userId: omar._id, projectId: projB._id, role: 'lead' });
  await Membership.create({ userId: priya._id, projectId: projB._id, role: 'member' });
  await Membership.create({ userId: omar._id, projectId: projC._id, role: 'lead' });
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
const create = (body, auth) => {
  const req = request(app).post('/api/projects').send(body);
  return auth ? req.set('Authorization', auth) : req;
};
const joinCode = (id, auth) => {
  const req = request(app).get(`/api/projects/${id}/join-code`);
  return auth ? req.set('Authorization', auth) : req;
};

describe('POST /api/projects', () => {
  test('creator becomes lead, gets a 6-digit code, and sees the project as lead', async () => {
    const res = await create({ name: 'Transit study', course: 'ENV 215' }, bearer(priya));
    expect(res.status).toBe(201);
    const { project } = res.body;
    expect(project).toMatchObject({ name: 'Transit study', course: 'ENV 215', role: 'lead' });
    expect(project.joinCode).toMatch(CODE);

    const m = await Membership.findOne({ userId: priya._id, projectId: project.id }).lean();
    expect(m.role).toBe('lead');

    const list = await request(app).get('/api/projects').set('Authorization', bearer(priya));
    expect(list.body.projects).toContainEqual({ id: project.id, name: 'Transit study', course: 'ENV 215', role: 'lead' });
  });

  test('no token returns 401 and creates nothing', async () => {
    const res = await create({ name: 'Sneaky' });
    expect(res.status).toBe(401);
    expect(await Project.countDocuments({ name: 'Sneaky' })).toBe(0);
    expect(await Membership.countDocuments()).toBe(3);
  });

  test.each([
    ['missing name', {}],
    ['blank name', { name: '   ' }],
    ['101-character name', { name: 'x'.repeat(101) }],
    ['non-string name', { name: ['A'] }],
    ['non-string course', { name: 'Ok', course: 42 }],
    ['object course', { name: 'Ok', course: { $ne: null } }],
    ['101-character course', { name: 'Ok', course: 'c'.repeat(101) }],
  ])('%s returns 400 and creates nothing', async (_label, body) => {
    const before = await Project.countDocuments();
    const res = await create(body, bearer(priya));
    expect(res.status).toBe(400);
    expect(await Project.countDocuments()).toBe(before);
  });

  test('a 100-character name is accepted', async () => {
    const res = await create({ name: 'x'.repeat(100) }, bearer(priya));
    expect(res.status).toBe(201);
  });

  test('role and createdBy in the body are ignored', async () => {
    const res = await create({ name: 'Mine', role: 'member', createdBy: omar.id, userId: omar.id }, bearer(priya));
    expect(res.status).toBe(201);
    expect(res.body.project.role).toBe('lead');
    const project = await Project.findById(res.body.project.id).lean();
    expect(String(project.createdBy)).toBe(priya.id);
    const memberships = await Membership.find({ projectId: project._id }).lean();
    expect(memberships).toHaveLength(1);
    expect(memberships[0]).toMatchObject({ role: 'lead' });
    expect(String(memberships[0].userId)).toBe(priya.id);
  });

  test('several projects get distinct codes', async () => {
    const codes = [];
    for (let i = 0; i < 5; i += 1) {
      const res = await create({ name: `P${i}` }, bearer(priya));
      codes.push(res.body.project.joinCode);
    }
    codes.forEach((c) => expect(c).toMatch(CODE));
    expect(new Set(codes).size).toBe(5);
  });

  test('a taken code is retried and a different code is saved', async () => {
    const spy = jest.spyOn(crypto, 'randomInt').mockReturnValueOnce(111111).mockReturnValueOnce(42);
    const res = await create({ name: 'Collide' }, bearer(priya));
    expect(res.status).toBe(201);
    expect(spy).toHaveBeenCalledTimes(2);
    expect(res.body.project.joinCode).toBe('000042');
    expect((await Project.findById(projB._id).lean()).joinCode).toBe('111111');
  });
});

describe('GET /api/projects/:projectId/join-code', () => {
  test('the lead gets the same code that create returned', async () => {
    const created = await create({ name: 'Mine' }, bearer(priya));
    const res = await joinCode(created.body.project.id, bearer(priya));
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ joinCode: created.body.project.joinCode });
  });

  test('a team member gets 403 with no code', async () => {
    const res = await joinCode(projB.id, bearer(priya));
    expect(res.status).toBe(403);
    expect(res.body).toEqual({ error: 'Only the team lead can do this.' });
    expect(res.text).not.toMatch(/111111|joinCode/);
  });

  test('a user from another project gets 404 with no code', async () => {
    const res = await joinCode(projC.id, bearer(priya));
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'Not found.' });
    expect(res.text).not.toMatch(/222222|joinCode/);
  });

  test('a malformed id returns 404', async () => {
    const res = await joinCode('not-an-id', bearer(priya));
    expect(res.status).toBe(404);
  });

  test('no token returns 401 with no code', async () => {
    const res = await joinCode(projB.id);
    expect(res.status).toBe(401);
    expect(res.text).not.toMatch(/111111/);
  });
});
