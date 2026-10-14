require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');
const { MongoClient, ObjectId } = require('mongodb');

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = process.env.DB_NAME || 'cst3144';
const FRONTEND_URL = process.env.FRONTEND_URL || '*';

let mongoClient;
let lessonsCollection;
let ordersCollection;

app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});

app.use(cors({
  origin: FRONTEND_URL === '*' ? true : FRONTEND_URL,
  methods: ['GET', 'POST', 'PUT', 'OPTIONS'],
  allowedHeaders: ['Content-Type']
}));
app.use(express.json({ limit: '100kb' }));
app.use('/images', express.static(path.join(__dirname, 'public', 'images')));

const sampleLessons = [
  { topic: 'Math', location: 'Hendon', price: 100, space: 5, icon: 'calculator' },
  { topic: 'Math', location: 'Colindale', price: 80, space: 5, icon: 'calculator' },
  { topic: 'Math', location: 'Brent Cross', price: 90, space: 5, icon: 'calculator' },
  { topic: 'English', location: 'Hendon', price: 95, space: 5, icon: 'book' },
  { topic: 'English', location: 'Golders Green', price: 85, space: 5, icon: 'book' },
  { topic: 'Science', location: 'Colindale', price: 110, space: 5, icon: 'flask' },
  { topic: 'Science', location: 'Brent Cross', price: 105, space: 5, icon: 'flask' },
  { topic: 'Music', location: 'Hendon', price: 120, space: 5, icon: 'music' },
  { topic: 'Art', location: 'Golders Green', price: 75, space: 5, icon: 'palette' },
  { topic: 'Coding', location: 'Colindale', price: 130, space: 5, icon: 'code' },
  { topic: 'Football', location: 'Hendon', price: 60, space: 5, icon: 'futbol' },
  { topic: 'Drama', location: 'Brent Cross', price: 70, space: 5, icon: 'theater-masks' }
];

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&');
}

async function connectToDatabase() {
  if (!MONGODB_URI) throw new Error('MONGODB_URI environment variable is not set');

  mongoClient = new MongoClient(MONGODB_URI);
  await mongoClient.connect();
  const db = mongoClient.db(DB_NAME);
  lessonsCollection = db.collection('lesson');
  ordersCollection = db.collection('order');

  if (await lessonsCollection.countDocuments() === 0) {
    await lessonsCollection.insertMany(sampleLessons);
    console.log(`Seeded ${sampleLessons.length} lessons`);
  }

  console.log(`Connected to MongoDB database: ${DB_NAME}`);
}

function databaseReady() {
  return Boolean(lessonsCollection && ordersCollection);
}

function requireDatabase(req, res, next) {
  if (!databaseReady()) return res.status(503).json({ error: 'Database is not ready' });
  next();
}

app.get('/', (_req, res) => {
  res.json({
    message: 'CST3144 After-School Classes API is running',
    endpoints: ['GET /lessons', 'GET /lessons/search?q=', 'POST /orders', 'PUT /lessons/:id', 'GET /enrolment/:lessonid', 'GET /health']
  });
});

app.get('/health', (_req, res) => {
  res.status(databaseReady() ? 200 : 503).json({ status: databaseReady() ? 'ok' : 'starting', database: databaseReady() });
});

app.get('/lessons', requireDatabase, async (_req, res) => {
  try {
    res.json(await lessonsCollection.find({}).toArray());
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch lessons' });
  }
});

app.get('/lessons/search', requireDatabase, async (req, res) => {
  try {
    const query = String(req.query.q || '').trim();
    if (!query) return res.json(await lessonsCollection.find({}).toArray());

    const regex = new RegExp(escapeRegex(query), 'i');
    const numericQuery = Number(query);
    const conditions = [{ topic: regex }, { location: regex }];
    if (Number.isFinite(numericQuery)) conditions.push({ price: numericQuery }, { space: numericQuery });

    res.json(await lessonsCollection.find({ $or: conditions }).toArray());
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Search failed' });
  }
});

app.post('/orders', requireDatabase, async (req, res) => {
  try {
    const { name, phone, lessonIDs, spaces } = req.body || {};
    const cleanName = typeof name === 'string' ? name.trim() : '';

    if (!/^[A-Za-z ]+$/.test(cleanName)) return res.status(400).json({ error: 'Name must contain letters and spaces only' });
    if (typeof phone !== 'string' || !/^\d+$/.test(phone)) return res.status(400).json({ error: 'Phone must contain numbers only' });
    if (!Array.isArray(lessonIDs) || lessonIDs.length === 0 || lessonIDs.some((id) => typeof id !== 'string' || !ObjectId.isValid(id))) return res.status(400).json({ error: 'lessonIDs must be a non-empty array of valid IDs' });

    const quantity = spaces === undefined ? lessonIDs.length : Number(spaces);
    if (!Number.isInteger(quantity) || quantity < 1) return res.status(400).json({ error: 'spaces must be a positive integer' });

    const result = await ordersCollection.insertOne({ name: cleanName, phone, lessonIDs, spaces: quantity, createdAt: new Date() });
    res.status(201).json({ message: 'Order submitted successfully', orderId: result.insertedId });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to save order' });
  }
});

app.put('/lessons/:id', requireDatabase, async (req, res) => {
  try {
    if (!ObjectId.isValid(req.params.id)) return res.status(400).json({ error: 'Invalid lesson ID' });

    const updates = { ...req.body };
    delete updates._id;
    if (Object.keys(updates).length === 0) return res.status(400).json({ error: 'At least one update is required' });
    if (updates.space !== undefined && (!Number.isInteger(Number(updates.space)) || Number(updates.space) < 0)) return res.status(400).json({ error: 'space must be a non-negative integer' });
    if (updates.space !== undefined) updates.space = Number(updates.space);

    const _id = new ObjectId(req.params.id);
    const result = await lessonsCollection.updateOne({ _id }, { $set: updates });
    if (!result.matchedCount) return res.status(404).json({ error: 'Lesson not found' });

    res.json(await lessonsCollection.findOne({ _id }));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update lesson' });
  }
});

app.get('/enrolment/:lessonid', requireDatabase, async (req, res) => {
  try {
    const lessonId = req.params.lessonid;
    const orders = await ordersCollection.find({ lessonIDs: lessonId }).toArray();
    const enrolment = orders.reduce((total, order) => total + (Array.isArray(order.lessonIDs) ? order.lessonIDs.filter((id) => String(id) === lessonId).length : 0), 0);
    res.json({ lessonId, enrolment });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to get enrolment' });
  }
});

connectToDatabase()
  .then(() => app.listen(PORT, () => console.log(`Server running on port ${PORT}`)))
  .catch((error) => {
    console.error(`Failed to start server: ${error.message}`);
    process.exit(1);
  });

module.exports = app;
