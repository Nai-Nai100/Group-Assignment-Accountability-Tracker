const { loadConfig } = require('./config');
const { createApp } = require('./app');

let config;
try {
  config = loadConfig();
} catch (err) {
  console.error(err.message);
  process.exit(1);
}

createApp().listen(config.port, () => console.log(`API listening on port ${config.port}`));
