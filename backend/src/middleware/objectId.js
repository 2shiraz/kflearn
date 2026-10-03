import mongoose from "mongoose";

// 404s a request whose :param isn't a valid ObjectId, before any query runs.
export function validateObjectIdParam(param) {
  return (req, res, next) => {
    if (mongoose.isObjectIdOrHexString(req.params[param])) return next();
    return res.status(404).json({ success: false, message: "Not found." });
  };
}
