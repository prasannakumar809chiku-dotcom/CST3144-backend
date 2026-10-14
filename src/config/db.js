const { MongoClient } = require('mongodb');

let client;
let db;

async function connectToDatabase({ uri, dbName }) {
  if (!uri) {
    throw new Error('MONGODB_URI is required');
  }
  if (!dbName) {
    throw new Error('DB_NAME is required');
  }

  client = new MongoClient(uri);
  await client.connect();
  db = client.db(dbName);
  return db;
}

function getDb() {
  if (!db) {
    throw new Error('Database is not connected');
  }
  return db;
}

async function closeDatabaseConnection() {
  if (client) {
    await client.close();
  }
  client = undefined;
  db = undefined;
}

module.exports = {
  connectToDatabase,
  getDb,
  closeDatabaseConnection
};
