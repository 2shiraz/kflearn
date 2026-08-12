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
  limits: { fileSize: 12 * 1024 * 1024 },
  fileFilter(req, file, cb) {
    if (!allowedAudioTypes.has(file.mimetype)) {
      cb(new Error("Unsupported audio format."));
      return;
    }
    cb(null, true);
  },
});
