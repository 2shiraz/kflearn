import multer from "multer";

// iPhone Safari records audio/mp4; Chrome and Firefox record webm or ogg.
// Browsers may add a codec ("audio/webm;codecs=opus"), so only the base type
// is checked.
const allowedAudioTypes = new Set([
  "audio/webm",
  "audio/ogg",
  "audio/wav",
  "audio/x-wav",
  "audio/mpeg",
  "audio/mp4",
  "audio/x-m4a",
  "video/webm",
  "video/mp4",
]);

export const audioBaseType = (mimetype = "") => mimetype.split(";")[0].trim().toLowerCase();

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
    if (!allowedAudioTypes.has(audioBaseType(file.mimetype))) {
      const error = new Error("That recording format isn't supported. Type your question instead.");
      error.status = 400;
      cb(error);
      return;
    }
    cb(null, true);
  },
});
