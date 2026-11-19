const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const User = require('../src/models/User');
const Project = require('../src/models/Project');
const Membership = require('../src/models/Membership');

jest.setTimeout(60000);

// Fake bcrypt-format hash built by hand: "$2b$10$" + 53 chars of [./A-Za-z0-9].
const HASH = '$2b$10$' + 'a'.repeat(53);

let mongod;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
  await Promise.all([User.syncIndexes(), Project.syncIndexes(), Membership.syncIndexes()]);
});

afterEach(async () => {
  await Promise.all([User.deleteMany({}), Project.deleteMany({}), Membership.deleteMany({})]);
});

afterAll(async () => {
  await mongoose.disconnect();
  if (mongod) await mongod.stop();
});

const makeUser = (email = 'a@example.com') => User.create({ name: 'Ana', email, passwordHash: HASH });
const makeProject = (createdBy, extra = {}) => Project.create({ name: 'Proj', createdBy, ...extra });

describe('per-project roles', () => {
  test('same user is lead on project A and member on project B', async () => {
    const user = await makeUser();
    const a = await makeProject(user._id, { name: 'A' });
    const b = await makeProject(user._id, { name: 'B' });
    await Membership.create({ userId: user._id, projectId: a._id, role: 'lead' });
    await Membership.create({ userId: user._id, projectId: b._id, role: 'member' });

    const list = await Membership.listUserProjects(user._id);
    const byName = Object.fromEntries(list.map((x) => [x.project.name, x.role]));
    expect(list).toHaveLength(2);
    expect(byName).toEqual({ A: 'lead', B: 'member' });
  });

  test('Membership.ROLES is exactly lead and member', () => {
    expect(Membership.ROLES).toEqual(['lead', 'member']);
  });

  test('User schema has no role path', () => {
    expect(User.schema.path('role')).toBeUndefined();
  });

  test.each(['admin', 'team lead'])('rejects unknown role "%s"', async (role) => {
    const m = new Membership({ userId: new mongoose.Types.ObjectId(), projectId: new mongoose.Types.ObjectId(), role });
    await expect(m.validate()).rejects.toThrow(mongoose.Error.ValidationError);
  });

  test('duplicate membership (same user + project) is rejected even with a different role', async () => {
    const user = await makeUser();
    const p = await makeProject(user._id);
    await Membership.create({ userId: user._id, projectId: p._id, role: 'lead' });
    await expect(
      Membership.create({ userId: user._id, projectId: p._id, role: 'member' }),
    ).rejects.toMatchObject({ code: 11000 });
  });
});

describe('User password storage', () => {
  test('a plaintext password field is never stored', async () => {
    const user = await User.create({ name: 'Ana', email: 'a@example.com', passwordHash: HASH, password: 'secret123' });
    const raw = await User.collection.findOne({ _id: user._id });
    expect(raw).not.toHaveProperty('password');
    expect(raw.passwordHash).toBe(HASH);
  });

  test('passwordHash that is not a bcrypt hash fails validation', async () => {
    const u = new User({ name: 'Ana', email: 'a@example.com', passwordHash: 'plaintext123' });
    await expect(u.validate()).rejects.toThrow(mongoose.Error.ValidationError);
  });
});

describe('Project joinCode', () => {
  test('stores a joinCode', async () => {
    const user = await makeUser();
    const p = await makeProject(user._id, { joinCode: 'ABC123' });
    const raw = await Project.collection.findOne({ _id: p._id });
    expect(raw.joinCode).toBe('ABC123');
  });

  test('two projects without joinCode are both allowed (sparse)', async () => {
    const user = await makeUser();
    await makeProject(user._id);
    await expect(makeProject(user._id)).resolves.toBeDefined();
  });

  test('duplicate joinCode is rejected', async () => {
    const user = await makeUser();
    await makeProject(user._id, { joinCode: 'ABC123' });
    await expect(makeProject(user._id, { joinCode: 'ABC123' })).rejects.toMatchObject({ code: 11000 });
  });
});
