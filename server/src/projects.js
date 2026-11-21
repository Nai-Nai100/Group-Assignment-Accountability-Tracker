const crypto = require('crypto');
const express = require('express');
const { requireAuth } = require('./auth');
const { requireMember, requireLead } = require('./access');
const Project = require('./models/Project');
const Membership = require('./models/Membership');

// 6 random digits (frames A4, B3). Not guessable from other codes; TMP-06 must also limit wrong guesses (#13).
const newJoinCode = () => String(crypto.randomInt(0, 1000000)).padStart(6, '0');
const isDuplicateCode = (err) => err.code === 11000 && err.keyPattern && err.keyPattern.joinCode;

// Saves the project with a fresh join code, retrying if the code is already taken.
async function saveWithJoinCode(project) {
  for (let attempt = 0; ; attempt += 1) {
    project.joinCode = newJoinCode();
    try {
      return await project.save();
    } catch (err) {
      if (!isDuplicateCode(err) || attempt >= 4) throw err;
    }
  }
}

const optionalText = (v) => v === undefined || v === null || (typeof v === 'string' && v.trim().length <= 100);

function projectsRouter(jwtSecret) {
  const router = express.Router();
  const auth = requireAuth(jwtSecret);

  // The signed-in user's projects with the role held on each (US-01, US-14).
  router.get('/', auth, async (req, res, next) => {
    try {
      const list = await Membership.listUserProjects(req.userId);
      res.json({ projects: list.map(({ project, role }) => ({ id: project._id, name: project.name, role })) });
    } catch (err) {
      next(err);
    }
  });

  // Create a project; the creator becomes its team lead (US-08, DD-05) and gets the join code (DD-08).
  router.post('/', auth, async (req, res, next) => {
    try {
      const { name, course } = req.body || {};
      if (typeof name !== 'string' || !name.trim() || name.trim().length > 100 || !optionalText(course)) {
        return res.status(400).json({ error: 'Enter a project name of up to 100 characters.' });
      }
      const project = await saveWithJoinCode(
        new Project({ name, course: course ? course : undefined, createdBy: req.userId }),
      );
      try {
        await Membership.create({ userId: req.userId, projectId: project._id, role: 'lead' });
      } catch (err) {
        await Project.deleteOne({ _id: project._id }); // no project without a lead
        throw err;
      }
      res.status(201).json({
        project: { id: project._id, name: project.name, course: project.course, role: 'lead', joinCode: project.joinCode },
      });
    } catch (err) {
      next(err);
    }
  });

  // The project's join code, for its team lead only (frame A4).
  router.get('/:projectId/join-code', auth, requireMember, requireLead, async (req, res, next) => {
    try {
      let project = await Project.findById(req.projectId);
      if (!project) return res.status(404).json({ error: 'Not found.' });
      if (!project.joinCode) project = await saveWithJoinCode(project); // projects made before codes existed
      res.json({ joinCode: project.joinCode });
    } catch (err) {
      next(err);
    }
  });

  return router;
}

module.exports = { projectsRouter };
