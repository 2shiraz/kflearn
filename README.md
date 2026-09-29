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

Authentication uses the backend session cookie; there is no mock auth mode.

## OSCE Stations

The backend seeds interactive OSCE stations with patient scripts and marking
checklists. Students can use guided self-practice or a credit-funded AI virtual
patient and assessment. Station attempts and scores are stored in MongoDB.

## History Taking Guide

The separate History Taking Guide is static frontend content. It is not the
interactive OSCE station bank and does not require database seeding.
