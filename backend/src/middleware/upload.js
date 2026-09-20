import multer from "multer";

const allowedAudioTypes = new Set([
  "audio/webm",
  "audio/wav",
  "audio/mpeg",
  "audio/mp4",
  "audio/x-m4a",
  "video/webm",
]);

export const audioUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 12 * 1024 * 1024,
    files: 1,
    fields: 0,
    parts: 1,
    fieldNestingDepth: 0,
    fieldArrayIndexLimit: 0,
  },
  fileFilter(req, file, cb) {
    if (!allowedAudioTypes.has(file.mimetype)) {
      const error = new Error("Unsupported audio format.");
      error.status = 400;
      cb(error);
      return;
    }
    cb(null, true);
  },
});
