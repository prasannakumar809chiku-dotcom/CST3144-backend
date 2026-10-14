const express = require('express');
const { parseObjectId } = require('../utils/objectId');
const { validateOrderPayload } = require('../utils/validators');

function createOrdersRouter(db) {
  const router = express.Router();
  const ordersCollection = db.collection('orders');
  const lessonsCollection = db.collection('lessons');

  router.post('/', async (req, res, next) => {
    const updates = [];

    try {
      const validation = validateOrderPayload(req.body);
      if (!validation.valid) {
        return res.status(400).json({ error: 'Validation failed', details: validation.errors });
      }

      const normalizedItems = validation.items.map((item) => {
        const lessonObjectId = parseObjectId(item.lessonId);
        if (!lessonObjectId) {
          throw Object.assign(new Error(`Invalid lesson id: ${item.lessonId}`), { statusCode: 400 });
        }
        return { ...item, lessonObjectId };
      });

      for (const item of normalizedItems) {
        const reserveResult = await lessonsCollection.updateOne(
          { _id: item.lessonObjectId, spaces: { $gte: item.quantity } },
          { $inc: { spaces: -item.quantity } }
        );

        if (!reserveResult.matchedCount || !reserveResult.modifiedCount) {
          throw Object.assign(new Error(`Not enough spaces for lesson ${item.lessonId}`), { statusCode: 409 });
        }

        updates.push(item);
      }

      const orderDocument = {
        name: req.body.name.trim(),
        phone: req.body.phone.trim(),
        items: normalizedItems.map((item) => ({
          lessonId: item.lessonObjectId,
          quantity: item.quantity
        })),
        createdAt: new Date()
      };

      const insertResult = await ordersCollection.insertOne(orderDocument);

      return res.status(201).json({
        message: 'Order created',
        orderId: insertResult.insertedId,
        items: normalizedItems.map((item) => ({ lessonId: item.lessonId, quantity: item.quantity }))
      });
    } catch (error) {
      if (updates.length) {
        await Promise.all(
          updates.map((item) => lessonsCollection.updateOne({ _id: item.lessonObjectId }, { $inc: { spaces: item.quantity } }))
        );
      }
      return next(error);
    }
  });

  return router;
}

module.exports = { createOrdersRouter };
