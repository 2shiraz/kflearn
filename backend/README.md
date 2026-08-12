# PHMS History Backend

## Setup

```bash
cd backend
npm install
copy .env.example .env
npm run seed
npm run dev
```

Set `MONGODB_URI` and `GROQ_API_KEY` in `.env`.

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
