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
npm run seed:git
npm run seed:gynae-obstetrics
npm run seed:infectious-diseases
npm run seed:orthopedics
npm run seed:rheumatology
npm run seed:cns
npm run dev
npm test
```

`seed:cvs` imports the 15 cardiovascular stations. `seed:endocrinology`
imports the 15 endocrinology stations and corrects the older DKA history
station's specialty without replacing its content or identifiers. The full
`seed` command includes these collections, the 15 GIT stations (`seed:git`),
the 15 gynaecology/obstetrics stations (`seed:gynae-obstetrics`),
the 15 infectious-disease stations (`seed:infectious-diseases`),
and the existing station bank.
The full seed also includes 15 orthopedics stations (`seed:orthopedics`):
10 AI conversations and 5 guided-only examinations, each eight minutes with
a 20-point checklist. Their source data and reusable seed are in `src/seed`.
The station data is checked into `src/seed`; the uploaded documents are not
needed to seed another database. Set `MONGODB_URI` for the target database,
then run the relevant command from `backend`.

These seeds upsert by stable slug, so repeated runs preserve station, script,
and checklist IDs without adding duplicates. They update authored content
for those slugs. CVS and endocrinology use ten-minute sessions; GIT uses
eight-minute sessions, as do gynaecology/obstetrics, infectious diseases and orthopedics.
The full seed also includes 10 rheumatology stations
(`seed:rheumatology`): six AI histories and four guided interpretation,
examination or emergency cases. These also use eight-minute sessions.
The full seed also includes 15 CNS stations (`seed:cns`): three AI patient/parent
conversations and twelve guided examination, interpretation, procedural or emergency
stations, each eight minutes. CT cases preserve the authored textual findings;
clinical images, mannequins and examination equipment must be supplied separately.
All eight sets have 20-point checklists with 0/1/2 self-marking. AI patient mode is enabled only where a
patient conversation can cover the task; other stations offer guided practice.

## OSCE categories and availability

The station bank separates overall clinical-skill categories from specialties:
history/clinical assessment, counselling/communication, clinical examination,
data/image interpretation, emergency assessment/management, and procedures/practical skills.
Each station has one primary category. AI availability comes from its configured
practice modes, not its category; guided-only stations cannot start paid AI sessions.

The frontend supports search, specialty/category/difficulty/availability filters,
sorting and pagination. Filters are stored in the URL. Admin creation explicitly
sets category and AI support.

For an existing database or after running an individual seed:

```bash
npm run categorize:osce
```

This only fills missing categories, preserves content, IDs, timestamps and modes,
and can be rerun safely. Full `npm run seed` includes this step. Uncategorised
legacy stations also receive an effective category in API responses.

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
