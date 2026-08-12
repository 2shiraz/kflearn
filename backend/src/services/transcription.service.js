import { toFile } from "groq-sdk";
import { env } from "../config/env.js";
import { getGroqClient } from "../config/groq.js";

export async function transcribeAudio(file) {
  const groq = getGroqClient();
  const result = await groq.audio.transcriptions.create({
    file: await toFile(file.buffer, file.originalname || "audio.webm"),
    model: env.groqSttModel,
  });
  return result.text || "";
}
