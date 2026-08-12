# KF LearnSmart / PHMS

## Backend

```bash
cd backend
npm install
copy .env.example .env
npm run seed
npm run dev
```

Set `MONGODB_URI` and `GROQ_API_KEY` in `backend/.env`.

## Frontend

```bash
cd frontend
npm install
copy .env.example .env
npm run dev
```

Set:

```env
VITE_API_BASE_URL=http://localhost:5000/api
```

Keep `VITE_USE_MOCK_AUTH=true` for local demo auth. Set it to `false` only when real auth endpoints are implemented.

## History Taking

Seeded content includes:

- Universal history taking guide
- SOCRATES
- HOSE PIPERS
- MJTHREADS
- ONE RESPS breathlessness guide
- Maya Khan respiratory/asthma virtual patient case
- Eight-item asthma smart checklist
