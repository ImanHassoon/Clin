# Clin backend

Node.js + TypeScript + Express API backing the Clin mobile app. See
[`../docs/ARCHITECTURE.md`](../docs/ARCHITECTURE.md) for the full data model,
security model, and API surface this implements.

## Setup

```bash
cp .env.example .env      # then edit DATABASE_URL and the JWT secrets
npm install
npm run prisma:migrate    # creates the Postgres schema
npm run dev                # starts the API on :4000 with hot reload
```

Requires a running PostgreSQL instance matching `DATABASE_URL`. For local
dev:

```bash
docker run --name clin-postgres -e POSTGRES_USER=clin -e POSTGRES_PASSWORD=clin \
  -e POSTGRES_DB=clin -p 5432:5432 -d postgres:16
```

## Scripts

- `npm run dev` — run with hot reload (`tsx watch`)
- `npm run build` / `npm start` — compile to `dist/` and run it
- `npm run typecheck` — `tsc --noEmit`
- `npm run prisma:studio` — browse the DB in Prisma Studio

## Notes

- Uploaded files (X-rays, lab documents) are saved to `UPLOAD_DIR` via the
  `StorageAdapter` interface (`src/storage/`). Swap `LocalStorageAdapter` for
  an S3-backed implementation for production — nothing else in the app
  needs to change.
- Every clinical read/write writes an `AuditLog` row (`src/utils/audit.ts`).
- Access control is two-layered: `requireRole` (coarse RBAC) plus
  `assertCanAccessPatient` / `assertDoctorOwnsVisit` (`src/services/access.ts`)
  which enforce that a doctor can only reach a patient's clinical data
  through an active care link or explicit consent grant.
