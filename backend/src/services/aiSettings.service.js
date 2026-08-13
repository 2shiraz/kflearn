import { env } from "../config/env.js";
import { AppSetting } from "../models/AppSetting.js";
import { decryptSecret, encryptSecret } from "../utils/crypto.js";

const SETTINGS_KEY = "ai";
const PROVIDERS = ["groq", "openai"];

export async function getAiSettings() {
  const stored = await AppSetting.findOne({ key: SETTINGS_KEY }).lean();
  const value = stored?.value || {};
  const settings = {
    defaultProvider: PROVIDERS.includes(value.defaultProvider) ? value.defaultProvider : env.defaultAiProvider,
    maxStudentMessageTokens: Number(value.maxStudentMessageTokens || env.maxStudentMessageTokens),
    groq: {
      apiKey: decryptSecret(value.groq?.apiKey || "") || env.groqApiKey,
      chatModel: value.groq?.chatModel || env.groqChatModel,
      evalModel: value.groq?.evalModel || env.groqEvalModel,
      sttModel: value.groq?.sttModel || env.groqSttModel,
    },
    openai: {
      apiKey: decryptSecret(value.openai?.apiKey || "") || env.openaiApiKey,
      chatModel: value.openai?.chatModel || env.openaiChatModel,
      evalModel: value.openai?.evalModel || env.openaiEvalModel,
    },
  };

  if (!PROVIDERS.includes(settings.defaultProvider)) settings.defaultProvider = "groq";
  if (!settings.maxStudentMessageTokens || settings.maxStudentMessageTokens < 20) settings.maxStudentMessageTokens = 160;
  return settings;
}

export async function getAiSettingsDto() {
  const settings = await getAiSettings();
  return {
    defaultProvider: settings.defaultProvider,
    maxStudentMessageTokens: settings.maxStudentMessageTokens,
    providers: [
      {
        id: "groq",
        label: "Groq",
        configured: Boolean(settings.groq.apiKey),
        apiKeyPreview: previewKey(settings.groq.apiKey),
        chatModel: settings.groq.chatModel,
        evalModel: settings.groq.evalModel,
        sttModel: settings.groq.sttModel,
      },
      {
        id: "openai",
        label: "OpenAI",
        configured: Boolean(settings.openai.apiKey),
        apiKeyPreview: previewKey(settings.openai.apiKey),
        chatModel: settings.openai.chatModel,
        evalModel: settings.openai.evalModel,
      },
    ],
  };
}

export async function updateAiSettings(payload = {}) {
  const currentDoc = await AppSetting.findOne({ key: SETTINGS_KEY });
  const current = currentDoc?.value || {};
  const next = {
    defaultProvider: PROVIDERS.includes(payload.defaultProvider) ? payload.defaultProvider : current.defaultProvider || env.defaultAiProvider,
    maxStudentMessageTokens: Number(payload.maxStudentMessageTokens || current.maxStudentMessageTokens || env.maxStudentMessageTokens),
    groq: {
      apiKey: pickSecret(payload.groqApiKey, current.groq?.apiKey),
      chatModel: payload.groqChatModel || current.groq?.chatModel || env.groqChatModel,
      evalModel: payload.groqEvalModel || current.groq?.evalModel || env.groqEvalModel,
      sttModel: payload.groqSttModel || current.groq?.sttModel || env.groqSttModel,
    },
    openai: {
      apiKey: pickSecret(payload.openaiApiKey, current.openai?.apiKey),
      chatModel: payload.openaiChatModel || current.openai?.chatModel || env.openaiChatModel,
      evalModel: payload.openaiEvalModel || current.openai?.evalModel || env.openaiEvalModel,
    },
  };

  if (next.maxStudentMessageTokens < 20 || next.maxStudentMessageTokens > 2000) {
    const error = new Error("Message token limit must be between 20 and 2000.");
    error.status = 400;
    throw error;
  }

  await AppSetting.findOneAndUpdate({ key: SETTINGS_KEY }, { $set: { value: next } }, { upsert: true, new: true });
  return getAiSettingsDto();
}

export function providerConfigured(settings, provider) {
  return Boolean(settings[provider]?.apiKey);
}

export function previewKey(key = "") {
  if (!key) return "";
  if (key.length <= 8) return "configured";
  return `${key.slice(0, 4)}...${key.slice(-4)}`;
}

function pickSecret(incoming, existing) {
  if (incoming === "__CLEAR__") return "";
  if (typeof incoming === "string" && incoming.trim()) return encryptSecret(incoming.trim());
  return existing || "";
}
