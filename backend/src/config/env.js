import dotenv from "dotenv";

dotenv.config();

export const env = {
  port: Number(process.env.PORT || 5000),
  nodeEnv: process.env.NODE_ENV || "development",
  mongodbUri: process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/phms",
  frontendUrl: process.env.FRONTEND_URL || "http://localhost:5173",
  jwtSecret: process.env.JWT_SECRET || "dev-jwt-secret-change-me",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "1d",
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
