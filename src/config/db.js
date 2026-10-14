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

async function ensureDatabaseIndexes() {
  if (!db) {
    throw new Error('Database is not connected');
  }

  await db.collection('lessons').createIndexes([
    { key: { subject: 1 } },
    { key: { location: 1 } },
    { key: { teacherName: 1 } },
    { key: { price: 1 } }
  ]);

  await db.collection('orders').createIndex({ createdAt: -1 });
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
  ensureDatabaseIndexes,
  getDb,
  closeDatabaseConnection
};
