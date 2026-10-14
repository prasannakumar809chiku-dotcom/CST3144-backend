const ALLOWED_LESSON_FIELDS = new Set([
  'subject',
  'location',
  'price',
  'spaces',
  'image',
  'icon',
  'description',
  'teacher',
  'teacherName'
]);

function isPlainObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function validateOrderPayload(payload) {
  const errors = [];

  if (!isPlainObject(payload)) {
    return { valid: false, errors: ['Request body must be a JSON object'], items: [] };
  }

  if (!/^[A-Za-z\s'-]{2,80}$/.test(String(payload.name || '').trim())) {
    errors.push('name must contain letters only');
  }

  if (!/^\d{7,15}$/.test(String(payload.phone || '').trim())) {
    errors.push('phone must contain numbers only');
  }

  const items = Array.isArray(payload.items)
    ? payload.items
    : payload.lessonId
      ? [{ lessonId: payload.lessonId, quantity: payload.quantity ?? 1 }]
      : [];

  if (!items.length) {
    errors.push('items must contain at least one lesson');
  }

  const normalizedItems = items.map((item) => ({
    lessonId: item.lessonId,
    quantity: Number(item.quantity)
  }));

  normalizedItems.forEach((item, index) => {
    if (!item.lessonId || typeof item.lessonId !== 'string') {
      errors.push(`items[${index}].lessonId is required`);
    }

    if (!Number.isInteger(item.quantity) || item.quantity <= 0) {
      errors.push(`items[${index}].quantity must be a positive integer`);
    }
  });

  return {
    valid: errors.length === 0,
    errors,
    items: normalizedItems
  };
}

function validateLessonUpdatePayload(payload) {
  if (!isPlainObject(payload)) {
    return { valid: false, errors: ['Request body must be a JSON object'] };
  }

  const keys = Object.keys(payload);
  if (!keys.length) {
    return { valid: false, errors: ['At least one lesson field is required'] };
  }

  const errors = [];

  keys.forEach((key) => {
    if (!ALLOWED_LESSON_FIELDS.has(key)) {
      errors.push(`Unsupported field: ${key}`);
    }
  });

  if ('price' in payload && (Number.isNaN(Number(payload.price)) || Number(payload.price) < 0)) {
    errors.push('price must be a non-negative number');
  }

  if ('spaces' in payload && (!Number.isInteger(Number(payload.spaces)) || Number(payload.spaces) < 0)) {
    errors.push('spaces must be a non-negative integer');
  }

  return {
    valid: errors.length === 0,
    errors,
    data: {
      ...payload,
      ...(payload.price !== undefined ? { price: Number(payload.price) } : {}),
      ...(payload.spaces !== undefined ? { spaces: Number(payload.spaces) } : {})
    }
  };
}

module.exports = {
  validateOrderPayload,
  validateLessonUpdatePayload
};
