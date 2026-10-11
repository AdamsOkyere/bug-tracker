# Fieldnote Feedback

A full-stack feedback collection tool for bug reports, feature requests, and general product notes. Public submissions are validated, rate-limited, stored in PostgreSQL, and managed from a protected admin inbox.

## Screenshots

Screenshot placeholders: public feedback form, admin inbox, and submission detail view.

## Features

- Responsive, accessible public form with inline client/server validation
- PostgreSQL persistence through Prisma, readable reference IDs, input normalization, and a database-backed limit of 5 submissions per IP every 10 minutes
- Credentials-only admin login with bcrypt password hashes and JWT sessions
- Protected inbox with search, type/status/severity filters, date sorting, and pagination
- Submission detail, status management, private team notes, and confirmed deletion
- Total/new/resolved-this-week stats, a 14-day submissions chart, and filtered CSV export
- Vitest coverage for shared validation, rate limiting, and reference generation

## Stack

Next.js 14 App Router, React 18, TypeScript, Tailwind CSS, PostgreSQL, Prisma, Auth.js / NextAuth Credentials, Zod, Recharts, Sonner, and Vitest.

## Local Setup

Prerequisites: Node.js 20 or newer and a PostgreSQL database. Create a database with Neon, Supabase, or a local PostgreSQL server.

1. Install dependencies and create the local environment file:

   ```bash
   npm install
   cp .env.example .env
   ```

2. Set `DATABASE_URL` to a PostgreSQL connection string, `NEXTAUTH_SECRET` to a long random value, and `NEXTAUTH_URL` to `http://localhost:3000`. A typical local database URL is `postgresql://postgres:password@localhost:5432/feedback?schema=public`.

3. Apply the schema, seed the admin and sample submissions, and start Next.js:

   ```bash
   npx prisma migrate dev --name init
   npm run seed
   npm run dev
   ```

4. Visit [http://localhost:3000](http://localhost:3000) to submit feedback, or [http://localhost:3000/admin/login](http://localhost:3000/admin/login) for the admin inbox.

The seed creates 25 sample submissions only when the feedback table is empty. It upserts the admin account on every run. Demo credentials: `admin@feedback.app` / `Admin1234!`.

## Environment Variables

| Variable          | Required | Description                                                                |
| ----------------- | -------- | -------------------------------------------------------------------------- |
| `DATABASE_URL`    | Yes      | PostgreSQL connection URL used by Prisma                                   |
| `NEXTAUTH_SECRET` | Yes      | Long random secret used to sign JWT sessions and anonymize rate-limit keys |
| `NEXTAUTH_URL`    | Yes      | Canonical app URL; use `http://localhost:3000` locally                     |
| `ADMIN_EMAIL`     | No       | Seed admin email; defaults to `admin@feedback.app`                         |
| `ADMIN_PASSWORD`  | No       | Seed admin password; defaults to `Admin1234!`                              |

Generate a secret with `openssl rand -base64 32`. Never use the demo admin password in a deployed environment; set a unique `ADMIN_PASSWORD` before running the seed command.

## Tests and Checks

```bash
npm test
npm run typecheck
npm run lint
npm run format:check
```

## Deploy to Vercel

1. Create a PostgreSQL database in Neon or Supabase and copy its connection string. Use the provider's pooled connection URL for serverless runtime queries when available. If migrations are not supported through that pooler, apply migrations with the provider's direct connection URL.
2. Push this repository to GitHub and import it into Vercel as a Next.js project. The `postinstall` script runs `prisma generate`; `npm run build` also generates the Prisma client before the Next.js build.
3. Add `DATABASE_URL`, `NEXTAUTH_SECRET`, and `NEXTAUTH_URL` in the Vercel project settings. Set `NEXTAUTH_URL` to the production URL. Set strong `ADMIN_EMAIL` and `ADMIN_PASSWORD` values for the initial admin account.
4. Apply the checked-in migrations against the production database:

   ```bash
   npx prisma migrate deploy
   ```

   Run this with the production database URL available, from a trusted local environment or a deployment job. Do not use `prisma migrate dev` against production.

5. Seed the initial admin and sample submissions once:

   ```bash
   npm run seed
   ```

   Use the production database URL and the same admin environment variables configured in Vercel. Sample submissions are created only if the table is empty.

6. Deploy from Vercel and verify the public form, `/admin/login`, and an authenticated CSV export.

The rate limiter uses a PostgreSQL upsert so limits persist across serverless instances. The source IP is stored only as an HMAC-SHA256 key derived with `NEXTAUTH_SECRET`; changing that secret resets active rate-limit windows.
