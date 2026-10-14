const { ObjectId } = require('mongodb');

function parseObjectId(id) {
  if (!ObjectId.isValid(id)) {
    return null;
  }

  return new ObjectId(id);
}

module.exports = { parseObjectId };
