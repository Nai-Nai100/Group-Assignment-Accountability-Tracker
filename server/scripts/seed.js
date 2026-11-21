// Dev/demo only: creates two users who are each lead on one project and member on the other (frame D4).
// Safe to run more than once. Run with `npm run seed` from /server. Never run against production data.
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('../src/models/User');
const Project = require('../src/models/Project');
const Membership = require('../src/models/Membership');

const USERS = [
  { name: 'Maya Chen', email: 'maya@example.edu' },
  { name: 'Priya Raman', email: 'priya@example.edu' },
];
const PROJECTS = [
  { name: 'Transit study', lead: 'maya@example.edu', member: 'priya@example.edu' },
  { name: 'Energy report', lead: 'priya@example.edu', member: 'maya@example.edu' },
];

async function seed() {
  const { MONGODB_URI, SEED_PASSWORD } = process.env;
  if (!MONGODB_URI || !SEED_PASSWORD) {
    throw new Error('Set MONGODB_URI and SEED_PASSWORD in .env before seeding.');
  }
  await mongoose.connect(MONGODB_URI);
  await Promise.all([User.init(), Project.init(), Membership.init()]);

  const passwordHash = await bcrypt.hash(SEED_PASSWORD, 10);
  const ids = {};
  for (const u of USERS) {
    const user = await User.findOneAndUpdate({ email: u.email }, { ...u, passwordHash }, { upsert: true, new: true });
    ids[u.email] = user._id;
  }
  for (const p of PROJECTS) {
    const project = await Project.findOneAndUpdate(
      { name: p.name, createdBy: ids[p.lead] },
      { name: p.name, createdBy: ids[p.lead] },
      { upsert: true, new: true },
    );
    if (!project.joinCode) await project.saveWithJoinCode();
    for (const [email, role] of [[p.lead, 'lead'], [p.member, 'member']]) {
      await Membership.updateOne(
        { userId: ids[email], projectId: project._id },
        { role },
        { upsert: true, runValidators: true },
      );
    }
  }
  console.log(`Seeded ${USERS.map((u) => u.email).join(' and ')} (password from SEED_PASSWORD).`);
}

seed()
  .catch((err) => {
    console.error(`Seeding failed: ${err.message}`);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
