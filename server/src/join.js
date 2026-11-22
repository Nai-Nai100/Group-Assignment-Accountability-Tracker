const attempts = require('./attempts');
const Project = require('./models/Project');
const Membership = require('./models/Membership');

const CODE = /^\d{6}$/;
const WRONG_CODE = "That join code doesn't match a project. Check it with your team lead.";
const TOO_MANY = 'Too many attempts. Try again later.';

// Finds the project for req.body.code, or sends the error response and returns null.
// A wrong code counts against the guess limit for every key given (see attempts.js).
async function projectForCode(req, res, keys) {
  const { code } = req.body || {};
  if (typeof code !== 'string' || !CODE.test(code)) {
    res.status(400).json({ error: 'Enter the 6-digit join code.' });
    return null;
  }
  if (!attempts.begin(keys)) {
    res.status(429).json({ error: TOO_MANY });
    return null;
  }
  const project = await Project.findOne({ joinCode: code });
  if (!project) {
    res.status(400).json({ error: WRONG_CODE }); // the attempt stays counted
    return null;
  }
  attempts.refund(keys);
  return project;
}

// Adds the user to the project as a team member, never as lead (US-15, POLICY 3).
// Returns false if they are already on the project.
async function addMember(userId, projectId) {
  try {
    await Membership.create({ userId, projectId, role: 'member' });
    return true;
  } catch (err) {
    if (err.code === 11000) return false;
    throw err;
  }
}

const alreadyOn = (project) => `You're already on ${project.name}.`;
const joinedProject = (project) => ({ id: project._id, name: project.name, role: 'member' });

module.exports = { TOO_MANY, projectForCode, addMember, alreadyOn, joinedProject };
