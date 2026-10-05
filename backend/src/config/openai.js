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
    signal: AbortSignal.timeout(120_000),
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

// Streams a Responses API call, passing each server-sent event to onEvent.
export async function streamOpenAiResponse(payload, apiKey = env.openaiApiKey, onEvent) {
  requireOpenAiKey(apiKey);
  const res = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    signal: AbortSignal.timeout(120_000),
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ ...payload, stream: true }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    const error = new Error(data.error?.message || `OpenAI request failed with status ${res.status}.`);
    error.status = res.status;
    error.provider = "openai";
    error.details = data.error;
    throw error;
  }
  const decoder = new TextDecoder();
  let buffer = "";
  for await (const bytes of res.body) {
    buffer += decoder.decode(bytes, { stream: true });
    let end;
    while ((end = buffer.indexOf("\n\n")) !== -1) {
      const block = buffer.slice(0, end);
      buffer = buffer.slice(end + 2);
      const data = block.split("\n").filter((line) => line.startsWith("data:")).map((line) => line.slice(5).trim()).join("");
      if (!data || data === "[DONE]") continue;
      const event = JSON.parse(data);
      if (event.type === "error" || event.type === "response.failed") {
        const error = new Error(event.error?.message || event.response?.error?.message || "OpenAI stream failed.");
        error.provider = "openai";
        throw error;
      }
      onEvent(event);
    }
  }
}
