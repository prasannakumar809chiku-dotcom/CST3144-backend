const test = require('node:test');
const assert = require('node:assert/strict');

const { parseObjectId } = require('../src/utils/objectId');
const { validateOrderPayload, validateLessonUpdatePayload } = require('../src/utils/validators');

test('validateOrderPayload accepts valid single-lesson order', () => {
  const result = validateOrderPayload({
    name: 'Alice Smith',
    phone: '07123456789',
    lessonId: '66aa00000000000000000001',
    quantity: 2
  });

  assert.equal(result.valid, true);
  assert.equal(result.items.length, 1);
  assert.equal(result.items[0].quantity, 2);
});

test('validateOrderPayload rejects invalid name/phone/quantity', () => {
  const result = validateOrderPayload({
    name: 'Alice123',
    phone: '07AB',
    items: [{ lessonId: '', quantity: -1 }]
  });

  assert.equal(result.valid, false);
  assert.ok(result.errors.some((error) => error.includes('name')));
  assert.ok(result.errors.some((error) => error.includes('phone')));
  assert.ok(result.errors.some((error) => error.includes('quantity')));
});

test('validateLessonUpdatePayload rejects unsupported and negative spaces', () => {
  const result = validateLessonUpdatePayload({ spaces: -1, random: true });

  assert.equal(result.valid, false);
  assert.ok(result.errors.some((error) => error.includes('Unsupported field')));
  assert.ok(result.errors.some((error) => error.includes('spaces')));
});

test('parseObjectId returns null for invalid id', () => {
  assert.equal(parseObjectId('bad-id'), null);
});
