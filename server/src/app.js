const express = require('express');
const { authRouter } = require('./auth');
const { projectsRouter } = require('./projects');

function createApp({ jwtSecret } = {}) {
  const app = express();
  app.use(express.json());

  app.get('/api/health', (req, res) => res.json({ status: 'ok' }));
  app.use('/api/auth', authRouter(jwtSecret));
  app.use('/api/projects', projectsRouter(jwtSecret));

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
