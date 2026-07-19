require('dotenv').config();

const app = require('./src/app');
const connectDB = require('./src/config/db');
const validateEnv = require('./src/config/env');
const logger = require('./src/utils/logger');

validateEnv();

const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  app.listen(PORT, () => {
    logger.info(`EliteAdx server running on http://localhost:${PORT}`);
  });
});
