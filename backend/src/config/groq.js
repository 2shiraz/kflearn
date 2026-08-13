import Groq from "groq-sdk";
import { env } from "./env.js";

export function getGroqClient(apiKey = env.groqApiKey) {
  if (!apiKey) {
    const error = new Error("GROQ_API_KEY is not configured.");
    error.status = 503;
    throw error;
  }
  return new Groq({ apiKey });
}
