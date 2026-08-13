import { toFile } from "groq-sdk";
import { getGroqClient } from "../config/groq.js";
import { getAiSettings } from "./aiSettings.service.js";

export async function transcribeAudio(file) {
  const settings = await getAiSettings();
  const groq = getGroqClient(settings.groq.apiKey);
  const result = await groq.audio.transcriptions.create({
    file: await toFile(file.buffer, file.originalname || "audio.webm"),
    model: settings.groq.sttModel,
  });
  return result.text || "";
}
