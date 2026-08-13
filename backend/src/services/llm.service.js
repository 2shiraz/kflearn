import { getGroqClient } from "../config/groq.js";
import { createOpenAiResponse } from "../config/openai.js";
import { getAiSettings, providerConfigured } from "./aiSettings.service.js";

export const AI_PROVIDERS = ["groq", "openai"];

export function resolveAiProvider(provider, settings) {
  const requested = AI_PROVIDERS.includes(provider) ? provider : settings.defaultProvider;
  if (providerConfigured(settings, requested)) return requested;
  const fallback = AI_PROVIDERS.find((candidate) => providerConfigured(settings, candidate));
  if (fallback) return fallback;
  const error = new Error("No AI provider is configured.");
  error.status = 503;
  throw error;
}

export function estimateTokens(text = "") {
  return Math.ceil(String(text).length / 4);
}

export function assertStudentMessageWithinLimit(text) {
  throw new Error("Use assertStudentMessageWithinConfiguredLimit instead.");
}

export async function assertStudentMessageWithinConfiguredLimit(text) {
  const settings = await getAiSettings();
  const estimatedTokens = estimateTokens(text);
  if (estimatedTokens > settings.maxStudentMessageTokens) {
    const error = new Error(`Message is too long. Keep each question under about ${settings.maxStudentMessageTokens} tokens.`);
    error.status = 413;
    throw error;
  }
}

export async function generateText({ provider, messages, maxTokens = 160 }) {
  const settings = await getAiSettings();
  const resolvedProvider = resolveAiProvider(provider, settings);
  if (resolvedProvider === "openai") {
    const response = await createOpenAiResponse({
      model: settings.openai.chatModel,
      input: toOpenAiInput(messages),
      max_output_tokens: maxTokens,
    }, settings.openai.apiKey);
    return {
      text: extractOpenAiText(response),
      model: settings.openai.chatModel,
      provider: resolvedProvider,
    };
  }

  const groq = getGroqClient(settings.groq.apiKey);
  const completion = await groq.chat.completions.create({
    model: settings.groq.chatModel,
    temperature: 0.4,
    max_tokens: maxTokens,
    messages,
    });
  return {
    text: completion.choices[0]?.message?.content?.trim() || "",
    model: settings.groq.chatModel,
    provider: resolvedProvider,
  };
}

export async function generateJson({ provider, messages, maxTokens = 5000 }) {
  const settings = await getAiSettings();
  const resolvedProvider = resolveAiProvider(provider, settings);
  if (resolvedProvider === "openai") {
    const response = await createOpenAiResponse({
      model: settings.openai.evalModel,
      input: toOpenAiInput(messages),
      max_output_tokens: maxTokens,
      text: { format: { type: "json_object" } },
    }, settings.openai.apiKey);
    return {
      text: extractOpenAiText(response),
      model: settings.openai.evalModel,
      provider: resolvedProvider,
    };
  }

  const groq = getGroqClient(settings.groq.apiKey);
  const completion = await groq.chat.completions.create({
    model: settings.groq.evalModel,
    temperature: 0.1,
    max_tokens: maxTokens,
    response_format: { type: "json_object" },
    messages,
  });
  return {
    text: completion.choices[0]?.message?.content?.trim() || "",
    model: settings.groq.evalModel,
    provider: resolvedProvider,
  };
}

function toOpenAiInput(messages) {
  return messages.map((message) => ({
    role: message.role === "system" ? "developer" : message.role,
    content: message.content,
  }));
}

function extractOpenAiText(response) {
  if (response.output_text) return response.output_text.trim();
  const parts = [];
  for (const item of response.output || []) {
    for (const content of item.content || []) {
      if (content.text) parts.push(content.text);
    }
  }
  return parts.join("\n").trim();
}
