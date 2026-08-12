export function notFound(req, res, next) {
  const error = new Error(`Route not found: ${req.method} ${req.originalUrl}`);
  error.status = 404;
  next(error);
}

export function errorHandler(error, req, res, next) {
  const status = error.status || error.statusCode || 500;
  if (status >= 500) {
    console.error(error);
  }
  res.status(status).json({
    success: false,
    message: error.message || "Server error",
    details: error.details,
  });
}
