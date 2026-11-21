const express = require('express');
const { requireAuth, authRouter } = require('./auth');
const Membership = require('./models/Membership');

function createApp({ jwtSecret } = {}) {
  const app = express();
  app.use(express.json());

  app.get('/api/health', (req, res) => res.json({ status: 'ok' }));
  app.use('/api/auth', authRouter(jwtSecret));

  // The signed-in user's projects with the role held on each (US-01, US-14).
  app.get('/api/projects', requireAuth(jwtSecret), async (req, res, next) => {
    try {
      const list = await Membership.listUserProjects(req.userId);
      res.json({ projects: list.map(({ project, role }) => ({ id: project._id, name: project.name, role })) });
    } catch (err) {
      next(err);
    }
  });

  app.use((req, res) => res.status(404).json({ error: 'Not found.' }));
  // Never echo the request body or error details, so passwords can't leak into responses or logs.
  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    const status = err.status || err.statusCode || 500;
    res.status(status).json({ error: status === 400 ? 'Invalid request.' : 'Something went wrong.' });
  });

  return app;
}

module.exports = { createApp };
