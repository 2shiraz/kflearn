export function requireRole(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user?.role)) {
      const error = new Error("You do not have permission to perform this action.");
      error.status = 403;
      next(error);
      return;
    }
    next();
  };
}
