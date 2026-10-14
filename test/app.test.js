const test = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const { ObjectId } = require('mongodb');

const { createApp } = require('../src/app');

function buildFakeDb() {
  const lessons = [
    {
      _id: new ObjectId('66aa00000000000000000001'),
      subject: 'Mathematics Club',
      location: 'Room A1',
      price: 25,
      spaces: 2,
      teacherName: 'Ms. Priya Shah',
      teacher: { name: 'Ms. Priya Shah' },
      description: 'Math'
    },
    {
      _id: new ObjectId('66aa00000000000000000002'),
      subject: 'Physics Lab',
      location: 'Science Lab',
      price: 30,
      spaces: 5,
      teacherName: 'Dr. Sarah Khan',
      teacher: { name: 'Dr. Sarah Khan' },
      description: 'Science practical'
    }
  ];
  const orders = [];

  const applyFilter = (dataset, filter) => {
    if (!filter || !Object.keys(filter).length) {
      return dataset;
    }

    const matchRegex = (value, regexObj) => new RegExp(regexObj.$regex, regexObj.$options).test(String(value || ''));

    const matches = (doc, clause) => {
      const keys = Object.keys(clause);
      return keys.every((key) => {
        if (key === '$or') {
          return clause.$or.some((inner) => matches(doc, inner));
        }
        if (key === '$and') {
          return clause.$and.every((inner) => matches(doc, inner));
        }

        const value = key.includes('.')
          ? key.split('.').reduce((acc, segment) => (acc ? acc[segment] : undefined), doc)
          : doc[key];

        if (clause[key] && clause[key].$regex !== undefined) {
          return matchRegex(value, clause[key]);
        }
        if (clause[key] && clause[key].$gte !== undefined) {
          return value >= clause[key].$gte;
        }
        if (clause[key] && clause[key].$lte !== undefined) {
          return value <= clause[key].$lte;
        }

        return value === clause[key];
      });
    };

    return dataset.filter((doc) => matches(doc, filter));
  };

  return {
    command: async () => ({ ok: 1 }),
    collection(name) {
      if (name === 'lessons') {
        return {
          find(filter) {
            const filtered = applyFilter(lessons, filter);
            return {
              sort(sortObj) {
                const [[key, order]] = Object.entries(sortObj);
                filtered.sort((a, b) => (a[key] > b[key] ? order : -order));
                return this;
              },
              async toArray() {
                return filtered;
              }
            };
          },
          async updateOne(query, update) {
            const lesson = lessons.find((item) => item._id.toString() === query._id.toString());
            if (!lesson) {
              return { matchedCount: 0, modifiedCount: 0 };
            }
            if (query.spaces?.$gte !== undefined && lesson.spaces < query.spaces.$gte) {
              return { matchedCount: 0, modifiedCount: 0 };
            }
            if (update.$set) {
              Object.assign(lesson, update.$set);
            }
            if (update.$inc?.spaces) {
              lesson.spaces += update.$inc.spaces;
            }
            return { matchedCount: 1, modifiedCount: 1 };
          },
          async findOne(query) {
            return lessons.find((item) => item._id.toString() === query._id.toString()) || null;
          }
        };
      }

      if (name === 'orders') {
        return {
          async insertOne(doc) {
            orders.push(doc);
            return { insertedId: new ObjectId('66aa000000000000000000ff') };
          },
          aggregate() {
            return {
              async toArray() {
                return [{ totalEnrolled: 0 }];
              }
            };
          }
        };
      }

      throw new Error('Unknown collection');
    }
  };
}


test('GET / returns service info', async () => {
  const app = createApp({ db: buildFakeDb(), frontendUrl: '' });

  const response = await request(app).get('/');
  assert.equal(response.status, 200);
  assert.equal(response.body.service, 'CST3144 Backend API');
});

test('invalid JSON payload returns 400', async () => {
  const app = createApp({ db: buildFakeDb(), frontendUrl: '' });

  const response = await request(app)
    .post('/orders')
    .set('Content-Type', 'application/json')
    .send('{"name":');

  assert.equal(response.status, 400);
});

test('GET /lessons supports search and teacher filter', async () => {
  const app = createApp({ db: buildFakeDb(), frontendUrl: '' });

  const response = await request(app).get('/lessons?q=physics&teacher=sarah');
  assert.equal(response.status, 200);
  assert.equal(response.body.length, 1);
  assert.equal(response.body[0].subject, 'Physics Lab');
});

test('POST /orders validates payload and returns 400 on invalid values', async () => {
  const app = createApp({ db: buildFakeDb(), frontendUrl: '' });

  const response = await request(app).post('/orders').send({ name: 'Bad123', phone: 'abc' });
  assert.equal(response.status, 400);
});

test('PUT /lessons/:id rejects invalid ObjectId', async () => {
  const app = createApp({ db: buildFakeDb(), frontendUrl: '' });

  const response = await request(app).put('/lessons/not-an-id').send({ spaces: 4 });
  assert.equal(response.status, 400);
});
