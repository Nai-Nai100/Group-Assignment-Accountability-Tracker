const express = require('express');

function createApp() {
  const app = express();

  app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

  return app;
}

module.exports = { createApp };
