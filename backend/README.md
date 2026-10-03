# KF LearnSmart OSCE Backend

## Setup

```bash
cd backend
npm install
copy .env.example .env
npm run seed
npm run dev
```

Set `MONGODB_URI` plus at least one AI provider key in `.env`.

In production, set a random `JWT_SECRET` of at least 32 characters. Set a
separate random `ENCRYPTION_KEY` of at least 32 characters if AI provider keys
are stored in the admin settings. Set `FRONTEND_URL` to the exact browser origin.
`TRUST_PROXY_HOPS` defaults to `0`; set it to the exact number of trusted proxy
hops only when the API is reachable exclusively through those proxies. The API
binds to `127.0.0.1` outside production unless `HOST` is set.

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

The OSCE API uses `/api/osce`, `/api/osce/attempts`, and `/api/admin/osce`.
Avoid running the seed on a populated production database: it updates authored
station content.

## Commands

```bash
npm run seed
npm run seed:cvs
npm run seed:endocrinology
npm run dev
npm test
```

`seed:cvs` imports the 15 cardiovascular stations. `seed:endocrinology`
imports the 15 endocrinology stations and corrects the older DKA history
station's specialty without replacing its content or identifiers. The full
`seed` command includes both collections plus the existing station bank.
The station data is checked into `src/seed`; the uploaded documents are not
needed to seed another database. Set `MONGODB_URI` for the target database,
then run the relevant command from `backend`.

These seeds upsert by stable slug, so repeated runs preserve station, script,
and checklist IDs without adding duplicates. They update authored content
for those slugs. The new stations use ten-minute sessions and 20-point
checklists with 0/1/2 self-marking. AI patient mode is enabled only where a
patient conversation can cover the task; other stations offer guided practice.

## Real-AI OSCE tests

The normal `npm test` suite does not require a working AI provider key and
does not verify live AI marking.
For real virtual-patient interviews and AI marking, configure a working
`GROQ_API_KEY` or `OPENAI_API_KEY` in `backend/.env`, then run from `backend`:

```bash
npm run test:live:scenarios
```

This runs five new AI-marked sessions plus a guided self-practice check. To run
the complete live suite (including the earlier sessions), use `npm run test:live`.
Both commands make external provider calls and may incur usage
charges. They use a temporary in-memory MongoDB, not your configured
`MONGODB_URI`, so they do not change real users, stations, or credit balances.
If neither key is configured, live cases are skipped. Each test verifies that
the examiner returned the configured model and item-level rationale rather
than the deterministic fallback.
