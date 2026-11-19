const { loadConfig } = require('./config');
const { createApp } = require('./app');
const { connectDb } = require('./db');

let config;
try {
  config = loadConfig();
} catch (err) {
  console.error(err.message);
  process.exit(1);
}

connectDb(config.mongodbUri)
  .then(() => createApp().listen(config.port, () => console.log(`API listening on port ${config.port}`)))
  .catch((err) => {
    console.error(`Could not connect to MongoDB: ${err.message}`);
    process.exit(1);
  });
