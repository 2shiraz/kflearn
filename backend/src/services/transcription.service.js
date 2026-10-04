import { toFile } from "groq-sdk";
import { getGroqClient } from "../config/groq.js";
import { audioBaseType } from "../middleware/upload.js";
import { getAiSettings } from "./aiSettings.service.js";

// The file name tells the speech service what format it is, so it must match
// what the browser actually recorded (an iPhone sends mp4, not webm).
const EXTENSIONS = {
  "audio/webm": "webm",
  "video/webm": "webm",
  "audio/ogg": "ogg",
  "audio/wav": "wav",
  "audio/x-wav": "wav",
  "audio/mpeg": "mp3",
  "audio/mp4": "mp4",
  "video/mp4": "mp4",
  "audio/x-m4a": "m4a",
};

function failure(message, status, cause) {
  const error = new Error(message);
  error.status = status;
  error.publicMessage = message;
  error.cause = cause;
  return error;
}

export async function transcribeAudio(file) {
  if (!file?.buffer?.length || file.buffer.length < 800) {
    throw failure("That recording was too short. Hold the mic button while you speak.", 400);
  }
  const settings = await getAiSettings();
  let groq;
  try {
    groq = getGroqClient(settings.groq.apiKey);
  } catch (error) {
    throw failure("Voice typing isn't set up yet. Type your question instead.", 503, error);
  }
  const ext = EXTENSIONS[audioBaseType(file.mimetype)] || "webm";
  try {
    const result = await groq.audio.transcriptions.create({
      file: await toFile(file.buffer, `question.${ext}`),
      model: settings.groq.sttModel,
    });
    return result.text || "";
  } catch (error) {
    // Keep the provider's own status (a 401 from a bad key would otherwise
    // sign the student out) and its wording out of the response; log it.
    console.error("Transcription failed:", error?.status, error?.message);
    throw failure("We couldn't turn that recording into text. Try again, or type your question.", 502, error);
  }
}
