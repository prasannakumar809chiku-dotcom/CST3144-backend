const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const env = {
  port: Number(process.env.PORT) || 3000,
  mongodbUri: process.env.MONGODB_URI || '',
  dbName: process.env.DB_NAME || '',
  frontendUrl: process.env.FRONTEND_URL || '',
  nodeEnv: process.env.NODE_ENV || 'development'
};

module.exports = env;
