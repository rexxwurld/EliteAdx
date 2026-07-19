const required = [
  'MONGO_URI',
  'JWT_SECRET',
  'FLW_PUBLIC_KEY',
  'FLW_SECRET_KEY',
];

function validateEnv() {
  const missing = required.filter((key) => !process.env[key]);
  if (missing.length) {
    // eslint-disable-next-line no-console
    console.warn(
      `[env] Missing recommended variables: ${missing.join(', ')}. ` +
      `Copy .env.example to .env and fill these in.`
    );
  }
}

module.exports = validateEnv;
