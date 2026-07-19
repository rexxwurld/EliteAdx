/* Minimal leveled logger. Swap for winston/pino later if needed. */
const timestamp = () => new Date().toISOString();

module.exports = {
  info: (msg) => console.log(`[INFO ${timestamp()}] ${msg}`),
  warn: (msg) => console.warn(`[WARN ${timestamp()}] ${msg}`),
  error: (msg) => console.error(`[ERROR ${timestamp()}] ${msg}`),
};
