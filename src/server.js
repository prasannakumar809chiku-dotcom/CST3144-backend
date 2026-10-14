const env = require('./config/env');
const { connectToDatabase } = require('./config/db');
const { createApp } = require('./app');

async function startServer() {
  const db = await connectToDatabase({ uri: env.mongodbUri, dbName: env.dbName });
  const app = createApp({ db, frontendUrl: env.frontendUrl });

  app.listen(env.port, () => {
    // eslint-disable-next-line no-console
    console.log(`Server listening on port ${env.port}`);
  });
}

startServer().catch((error) => {
  // eslint-disable-next-line no-console
  console.error('Failed to start server:', error.message);
  process.exit(1);
});
