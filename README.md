# Clin

A mobile app for managing health clinics from both the doctor and patient
side: appointments, per-patient case history, visits, diagnoses, lab tests,
and imaging (X-rays) — with role-based security around all of it.

## Where to start

- **[`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)** — the design: data
  model, security/RBAC model, API surface, and mobile UX flows. Read this
  first; everything else implements it.
- **[`backend/`](backend/README.md)** — Node.js + TypeScript + Express API,
  Prisma + PostgreSQL, JWT auth, relationship-based access control, file
  uploads for imaging/lab documents.
- **[`mobile/`](mobile/README.md)** — Expo + React Native (TypeScript) app
  with role-based navigation for doctors and patients.

## Quick start

```bash
# 1. Backend
cd backend
cp .env.example .env   # edit DATABASE_URL / JWT secrets
npm install
npm run prisma:migrate
npm run dev             # http://localhost:4000

# 2. Mobile app (separate terminal)
cd mobile
npm install
npm start                # then press i / a / w, or scan the QR with Expo Go
```

## Status

Both halves have been verified to build and typecheck cleanly
(`npm run build` / `npm run typecheck` in `backend/`, `npm run typecheck` in
`mobile/`), and the backend boots and answers `GET /health`. There is no
Postgres instance, mobile simulator, or physical device available in the
environment this was scaffolded in, so the full login → book appointment →
record a visit → upload an X-ray flow has not been exercised end-to-end —
do that before treating this as production-ready. See each README's
"known limitations" / "not implemented yet" notes for what's intentionally
left as follow-up work (MFA, push notifications, real S3 storage, clinic
admin console, automated tests, CI).
