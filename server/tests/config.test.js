const path = require('path');
const { spawnSync } = require('child_process');
const { loadConfig, REQUIRED } = require('../src/config');

const fullEnv = { MONGODB_URI: 'test-uri', JWT_SECRET: 'test-secret', GEMINI_API_KEY: 'test-key' };

describe('loadConfig', () => {
  test('returns values when all required vars are present; port defaults to 5000', () => {
    expect(loadConfig(fullEnv)).toEqual({
      mongodbUri: 'test-uri',
      jwtSecret: 'test-secret',
      geminiApiKey: 'test-key',
      port: 5000,
    });
  });

  test('throws naming every missing var when env is empty', () => {
    expect(() => loadConfig({})).toThrow(/MONGODB_URI, JWT_SECRET, GEMINI_API_KEY/);
  });

  test.each(REQUIRED)('throws naming %s when only it is missing', (name) => {
    const env = { ...fullEnv };
    delete env[name];
    expect(() => loadConfig(env)).toThrow(name);
  });

  test.each(REQUIRED)('treats empty string %s as missing', (name) => {
    expect(() => loadConfig({ ...fullEnv, [name]: '' })).toThrow(name);
  });
});

describe('src/index.js startup', () => {
  test('exits 1 and names missing vars (no hard-coded fallback)', () => {
    const env = { ...process.env };
    REQUIRED.forEach((name) => delete env[name]);
    const result = spawnSync(process.execPath, ['src/index.js'], {
      cwd: path.join(__dirname, '..'),
      env,
      encoding: 'utf8',
      timeout: 10000,
    });
    expect(result.status).toBe(1);
    REQUIRED.forEach((name) => expect(result.stderr).toContain(name));
  });
});
