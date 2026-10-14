const http = require('http');

const env = require('./config/env');
const { connectToDatabase, closeDatabaseConnection } = require('./config/db');
const { createApp } = require('./app');

async function startServer() {
  const db = await connectToDatabase({ uri: env.mongodbUri, dbName: env.dbName });
  const app = createApp({ db, frontendUrl: env.frontendUrl });
  const server = http.createServer(app);

  server.listen(env.port, () => {
    // eslint-disable-next-line no-console
    console.log(`Server listening on port ${env.port}`);
  });

  const shutdown = async () => {
    server.close(async () => {
      await closeDatabaseConnection();
      process.exit(0);
    });
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

startServer().catch((error) => {
  // eslint-disable-next-line no-console
  console.error('Failed to start server:', error.message);
  process.exit(1);
});
