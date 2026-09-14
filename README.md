# AMSA Website

Modern web application for the Association of Mongolian Students in America (AMSA), built with Next.js 15.

## Stack
- **Framework:** Next.js 15 (App Router)
- **UI/Styling:** React 19, Tailwind CSS 4
- **Database/ORM:** Supabase, Sequelize (MySQL)
- **Tooling:** Turbopack

## Prerequisites
- Node.js 18+ and npm
- A database instance (MySQL or compatible)

## Setup

1) Install dependencies:
```bash
npm install
```

2) Environment Variables:
Copy `.env.example` to `.env.local` (or create it) and fill in your connection details:
```env
# .env.local expected variables (e.g., Database, Supabase secrets, etc.)
```

3) Run the development server:
```bash
npm run dev
```

The application will be available at [http://localhost:3000](http://localhost:3000).

## Deployment

This application is ready to be deployed on Next.js compatible platforms like [Vercel](https://vercel.com/). Ensure you configure your environment variables in your deployment platform's settings.

## Database migrations

SQL lives in `supabase/migrations/` and is applied by hand in the Supabase SQL
editor (CI never touches the database). **Apply them before deploying code that
depends on them** — the order matters:

1. `20260913_0001_indexes.sql` — indexes for the hot queries plus the
   denormalized `Users.college_unitid / state_abbr / logo_domain` columns.
2. `20260913_0002_rpc.sql` — the `get_*` / `appreciate_post` SQL functions the
   API calls via `supabase.rpc()` (one round trip per page).
3. `20260914_0003_experience_logo.sql` — `Experiences.companyUrl / logoDomain`,
   the employer logo domain resolved when an experience is saved.
4. `20260914_0004_hub_thread_body_optional.sql` — lets a thread be posted with
   a title only; the old check constraint rejected an empty body.
5. Backfill existing rows once:
   ```bash
   npx tsx --conditions=react-server scripts/backfill-school-names.ts
   npx tsx --conditions=react-server scripts/backfill-user-denorm.ts
   npx tsx --conditions=react-server scripts/backfill-experience-logos.ts
   ```
   (add `--dry` to preview.)

All migrations are idempotent (`if not exists` / `create or replace`).

## Images

Marketing images are committed as right-sized WebP under `public/**/optimized/`
and served with immutable cache headers. The multi-MB originals live in
`assets-src/` (not deployed). After changing a source image:

```bash
npm run images:build
```

## Latency checks

```bash
curl -sI "https://www.amsa.mn/api/health?db=1" | grep -i server-timing   # DB round-trip from the function
curl -so /dev/null -w "%{time_starttransfer}s cache=%header{x-vercel-cache}\n" https://www.amsa.mn/api/colleges
```
