const fs = require('fs');
const path = require('path');

const env = require('../src/config/env');
const { connectToDatabase, closeDatabaseConnection } = require('../src/config/db');

async function seed() {
  const db = await connectToDatabase({ uri: env.mongodbUri, dbName: env.dbName });
  const lessonsCollection = db.collection('lessons');

  const seedPath = path.resolve(process.cwd(), 'data/lessons.seed.json');
  const lessons = JSON.parse(fs.readFileSync(seedPath, 'utf8'));

  if (!Array.isArray(lessons) || lessons.length < 10) {
    throw new Error('Seed file must contain at least 10 lessons');
  }

  await lessonsCollection.deleteMany({});
  await lessonsCollection.insertMany(lessons);

  // eslint-disable-next-line no-console
  console.log(`Seeded ${lessons.length} lessons.`);
}

seed()
  .then(() => closeDatabaseConnection())
  .catch(async (error) => {
    // eslint-disable-next-line no-console
    console.error('Seeding failed:', error.message);
    await closeDatabaseConnection();
    process.exit(1);
  });
