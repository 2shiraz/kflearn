import { env } from "../config/env.js";

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
  // Don't leak internal error messages (stack traces, driver/library errors) to clients in production.
  const message = status >= 500 && env.isProduction ? "Something went wrong. Please try again." : error.message || "Server error";
  res.status(status).json({
    success: false,
    message,
    details: env.isProduction ? undefined : error.details,
  });
}
