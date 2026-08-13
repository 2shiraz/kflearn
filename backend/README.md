# PHMS History Backend

## Setup

```bash
cd backend
npm install
copy .env.example .env
npm run seed
npm run dev
```

Set `MONGODB_URI` plus at least one AI provider key in `.env`.

```env
GROQ_API_KEY=
GROQ_CHAT_MODEL=openai/gpt-oss-20b
GROQ_EVAL_MODEL=openai/gpt-oss-20b
GROQ_STT_MODEL=whisper-large-v3-turbo

OPENAI_API_KEY=
OPENAI_CHAT_MODEL=gpt-5.6-luna
OPENAI_EVAL_MODEL=gpt-5.6-luna

DEFAULT_AI_PROVIDER=groq
MAX_STUDENT_MESSAGE_TOKENS=160
```

Frontend should use:

```env
VITE_API_BASE_URL=http://localhost:5000/api
```

## Commands

```bash
npm run seed
npm run dev
npm test
```
