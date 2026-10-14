const express = require('express');
const cors = require('cors');
const path = require('path');
const morgan = require('morgan');

const { createLessonsRouter } = require('./routes/lessons');
const { createOrdersRouter } = require('./routes/orders');
const { createEnrolmentRouter } = require('./routes/enrolment');
const { notFoundHandler, errorHandler } = require('./middleware/error-handler');

function buildCorsOptions(frontendUrl) {
  const allowedOrigins = [
    frontendUrl,
    'http://localhost:5173',
    'http://127.0.0.1:5173'
  ].filter(Boolean);

  return {
    origin(origin, callback) {
      if (!origin) {
        return callback(null, true);
      }

      const isGithubPages = /^https:\/\/[a-zA-Z0-9-]+\.github\.io$/.test(origin);
      if (isGithubPages || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(null, false);
    }
  };
}

function createApp({ db, frontendUrl }) {
  const app = express();

  app.use(cors(buildCorsOptions(frontendUrl)));
  app.use(express.json({ limit: '1mb' }));
  app.use(morgan('dev'));
  app.use('/images', express.static(path.join(process.cwd(), 'public/images')));

  app.get('/health', async (req, res) => {
    let dbStatus = 'up';

    try {
      await db.command({ ping: 1 });
    } catch (error) {
      dbStatus = 'down';
    }

    return res.status(200).json({ status: 'ok', database: dbStatus });
  });

  app.use('/lessons', createLessonsRouter(db));
  app.use('/orders', createOrdersRouter(db));
  app.use('/enrolment', createEnrolmentRouter(db));

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

module.exports = { createApp };
