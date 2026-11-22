// All secrets come from server-side environment variables only (RC-12). No defaults for secrets.
const REQUIRED = ['MONGODB_URI', 'JWT_SECRET', 'GEMINI_API_KEY'];

function loadConfig(env = process.env) {
  const missing = REQUIRED.filter((name) => !env[name]);
  if (missing.length) {
    throw new Error(
      `Missing required environment variable(s): ${missing.join(', ')}. Copy .env.example to .env and fill them in.`,
    );
  }
  return {
    mongodbUri: env.MONGODB_URI,
    jwtSecret: env.JWT_SECRET,
    geminiApiKey: env.GEMINI_API_KEY,
    port: Number(env.PORT) || 5000,
  };
}

module.exports = { loadConfig, REQUIRED };
