function notFoundHandler(req, res) {
  return res.status(404).json({ error: 'Not Found' });
}

function errorHandler(err, req, res, next) { // eslint-disable-line no-unused-vars
  const isJsonSyntaxError = err instanceof SyntaxError && err.status === 400 && 'body' in err;
  const statusCode = isJsonSyntaxError ? 400 : (err.statusCode || 500);
  const message = isJsonSyntaxError ? 'Invalid JSON payload' : (err.message || 'Internal Server Error');

  if (process.env.NODE_ENV !== 'production') {
    return res.status(statusCode).json({ error: message, details: err.details || null });
  }

  return res.status(statusCode).json({ error: message });
}

module.exports = {
  notFoundHandler,
  errorHandler
};
