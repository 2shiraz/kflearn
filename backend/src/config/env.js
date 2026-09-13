import dotenv from "dotenv";

dotenv.config();

const nodeEnv = process.env.NODE_ENV || "development";
const isProduction = nodeEnv === "production";
const INSECURE_DEFAULT_JWT_SECRET = "dev-jwt-secret-change-me";

if (isProduction) {
  const missing = ["JWT_SECRET", "MONGODB_URI", "FRONTEND_URL"].filter((key) => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables in production: ${missing.join(", ")}`);
  }
  if (process.env.JWT_SECRET === INSECURE_DEFAULT_JWT_SECRET || process.env.JWT_SECRET.length < 32) {
    throw new Error("JWT_SECRET must be set to a random value of at least 32 characters in production.");
  }
}

const cookieSameSite = (process.env.COOKIE_SAMESITE || "lax").toLowerCase();

export const env = {
  port: Number(process.env.PORT || 5000),
  nodeEnv,
  isProduction,
  mongodbUri: process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/phms",
  frontendUrl: process.env.FRONTEND_URL || "http://localhost:5173",
  jwtSecret: process.env.JWT_SECRET || INSECURE_DEFAULT_JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "1d",
  // Falls back to JWT_SECRET so existing encrypted AppSettings keep decrypting, but a
  // dedicated ENCRYPTION_KEY avoids reusing one secret for two purposes (SEC best practice).
  encryptionKey: process.env.ENCRYPTION_KEY || process.env.JWT_SECRET || INSECURE_DEFAULT_JWT_SECRET,
  // SameSite=None requires Secure; otherwise Secure follows NODE_ENV so local http dev still works.
  cookieSameSite,
  cookieSecure: cookieSameSite === "none" ? true : isProduction,
  groqApiKey: process.env.GROQ_API_KEY || "",
  groqChatModel: process.env.GROQ_CHAT_MODEL || "openai/gpt-oss-20b",
  groqEvalModel: process.env.GROQ_EVAL_MODEL || "openai/gpt-oss-20b",
  groqSttModel: process.env.GROQ_STT_MODEL || "whisper-large-v3-turbo",
  openaiApiKey: process.env.OPENAI_API_KEY || "",
  openaiChatModel: process.env.OPENAI_CHAT_MODEL || "gpt-5.6-luna",
  openaiEvalModel: process.env.OPENAI_EVAL_MODEL || "gpt-5.6-luna",
  defaultAiProvider: process.env.DEFAULT_AI_PROVIDER || "groq",
  maxStudentMessageTokens: Number(process.env.MAX_STUDENT_MESSAGE_TOKENS || 160),
};
