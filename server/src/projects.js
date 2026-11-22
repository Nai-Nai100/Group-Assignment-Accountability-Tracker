const express = require('express');
const { requireAuth } = require('./auth');
const { requireMember, requireLead } = require('./access');
const Project = require('./models/Project');
const Membership = require('./models/Membership');
const { projectForCode, addMember, alreadyOn, joinedProject } = require('./join');

const optionalText = (v) => v === undefined || v === null || (typeof v === 'string' && v.trim().length <= 100);

function projectsRouter(jwtSecret) {
  const router = express.Router();
  const auth = requireAuth(jwtSecret);

  // The signed-in user's projects with the role held on each (US-01, US-14).
  router.get('/', auth, async (req, res, next) => {
    try {
      const list = await Membership.listUserProjects(req.userId);
      res.json({ projects: list.map(({ project, role }) => ({ id: project._id, name: project.name, course: project.course, role })) });
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
      const project = await new Project({ name, course: course?.trim() || undefined, createdBy: req.userId }).saveWithJoinCode();
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

  // Join another project with a code while signed in (frames B2, B4; US-15). Always as a team member.
  router.post('/join', auth, async (req, res, next) => {
    try {
      const project = await projectForCode(req, res, [`ip:${req.ip}`, `user:${req.userId}`]);
      if (!project) return;
      if (!(await addMember(req.userId, project._id))) return res.status(409).json({ error: alreadyOn(project) });
      res.status(201).json({ project: joinedProject(project) });
    } catch (err) {
      next(err);
    }
  });

  // One project the caller is on: its name, the caller's role, and the team (names and roles only, no emails).
  // Feeds the team dashboard (A5/B5) and the D6 refusal, which names the lead (US-14, RC-03).
  router.get('/:projectId', auth, requireMember, async (req, res, next) => {
    try {
      const [project, memberships] = await Promise.all([
        Project.findById(req.projectId).lean(),
        Membership.find({ projectId: req.projectId }).populate('userId', 'name').lean(),
      ]);
      if (!project) return res.status(404).json({ error: 'Not found.' });
      const members = memberships
        .filter((m) => m.userId)
        .map((m) => ({ id: m.userId._id, name: m.userId.name, role: m.role }))
        .sort((a, b) => (a.role === b.role ? a.name.localeCompare(b.name) : a.role === 'lead' ? -1 : 1));
      const lead = members.find((m) => m.role === 'lead');
      res.json({
        project: {
          id: project._id,
          name: project.name,
          course: project.course,
          role: req.role,
          lead: lead ? { name: lead.name } : null,
          members,
        },
      });
    } catch (err) {
      next(err);
    }
  });

  // The project's join code, for its team lead only (frame A4).
  router.get('/:projectId/join-code', auth, requireMember, requireLead, async (req, res, next) => {
    try {
      const project = await Project.findById(req.projectId);
      if (!project) return res.status(404).json({ error: 'Not found.' });
      res.json({ joinCode: project.joinCode || null });
    } catch (err) {
      next(err);
    }
  });

  return router;
}

module.exports = { projectsRouter };
