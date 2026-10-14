const express = require('express');
const { parseObjectId } = require('../utils/objectId');
const { validateLessonUpdatePayload } = require('../utils/validators');

function getLessonsFilter(query) {
  const filter = {};

  if (query.teacher) {
    filter.$or = [
      { 'teacher.name': { $regex: query.teacher, $options: 'i' } },
      { teacherName: { $regex: query.teacher, $options: 'i' } }
    ];
  }

  if (query.minPrice || query.maxPrice) {
    filter.price = {};
    if (query.minPrice !== undefined && !Number.isNaN(Number(query.minPrice))) {
      filter.price.$gte = Number(query.minPrice);
    }
    if (query.maxPrice !== undefined && !Number.isNaN(Number(query.maxPrice))) {
      filter.price.$lte = Number(query.maxPrice);
    }
    if (!Object.keys(filter.price).length) {
      delete filter.price;
    }
  }

  const searchTerm = query.q || query.search;
  if (searchTerm) {
    const regex = { $regex: searchTerm, $options: 'i' };
    const orSearch = [
      { subject: regex },
      { location: regex },
      { description: regex },
      { image: regex },
      { icon: regex },
      { teacherName: regex },
      { 'teacher.name': regex }
    ];

    const numericSearch = Number(searchTerm);
    if (!Number.isNaN(numericSearch)) {
      orSearch.push({ price: numericSearch }, { spaces: numericSearch });
    }

    if (filter.$or) {
      filter.$and = [{ $or: filter.$or }, { $or: orSearch }];
      delete filter.$or;
    } else {
      filter.$or = orSearch;
    }
  }

  return filter;
}

function createLessonsRouter(db) {
  const router = express.Router();
  const lessonsCollection = db.collection('lessons');

  router.get('/', async (req, res, next) => {
    try {
      const sortBy = ['subject', 'location', 'price', 'spaces', 'teacherName'].includes(req.query.sortBy)
        ? req.query.sortBy
        : 'subject';
      const order = req.query.order === 'desc' ? -1 : 1;
      const filter = getLessonsFilter(req.query);

      const lessons = await lessonsCollection
        .find(filter)
        .sort({ [sortBy]: order })
        .toArray();

      return res.status(200).json(lessons);
    } catch (error) {
      return next(error);
    }
  });

  router.put('/:id', async (req, res, next) => {
    try {
      const lessonId = parseObjectId(req.params.id);
      if (!lessonId) {
        return res.status(400).json({ error: 'Invalid lesson id' });
      }

      const validation = validateLessonUpdatePayload(req.body);
      if (!validation.valid) {
        return res.status(400).json({ error: 'Validation failed', details: validation.errors });
      }

      const result = await lessonsCollection.findOneAndUpdate(
        { _id: lessonId },
        { $set: validation.data },
        { returnDocument: 'after' }
      );

      if (!result) {
        return res.status(404).json({ error: 'Lesson not found' });
      }

      return res.status(200).json(result);
    } catch (error) {
      return next(error);
    }
  });

  return router;
}

module.exports = { createLessonsRouter };
