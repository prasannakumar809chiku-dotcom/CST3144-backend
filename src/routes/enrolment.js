const express = require('express');
const { parseObjectId } = require('../utils/objectId');

function createEnrolmentRouter(db) {
  const router = express.Router();
  const lessonsCollection = db.collection('lessons');
  const ordersCollection = db.collection('orders');

  router.get('/:lessonid', async (req, res, next) => {
    try {
      const lessonId = parseObjectId(req.params.lessonid);
      if (!lessonId) {
        return res.status(400).json({ error: 'Invalid lesson id' });
      }

      const lesson = await lessonsCollection.findOne({ _id: lessonId });
      if (!lesson) {
        return res.status(404).json({ error: 'Lesson not found' });
      }

      const enrolmentAgg = await ordersCollection
        .aggregate([
          { $unwind: '$items' },
          { $match: { 'items.lessonId': lessonId } },
          { $group: { _id: '$items.lessonId', totalEnrolled: { $sum: '$items.quantity' } } }
        ])
        .toArray();

      const totalEnrolled = enrolmentAgg[0]?.totalEnrolled || 0;

      return res.status(200).json({
        lessonId: req.params.lessonid,
        subject: lesson.subject,
        spacesRemaining: lesson.spaces,
        totalEnrolled
      });
    } catch (error) {
      return next(error);
    }
  });

  return router;
}

module.exports = { createEnrolmentRouter };
