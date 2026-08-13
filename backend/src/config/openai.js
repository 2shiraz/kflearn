import { env } from "./env.js";

export function requireOpenAiKey(apiKey = env.openaiApiKey) {
  if (!apiKey) {
    const error = new Error("OPENAI_API_KEY is not configured.");
    error.status = 503;
    throw error;
  }
}

export async function createOpenAiResponse(payload, apiKey = env.openaiApiKey) {
  requireOpenAiKey(apiKey);
  const res = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const error = new Error(data.error?.message || `OpenAI request failed with status ${res.status}.`);
    error.status = res.status;
    error.provider = "openai";
    error.details = data.error;
    throw error;
  }
  return data;
}
