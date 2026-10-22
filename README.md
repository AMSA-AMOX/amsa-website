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
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=   # public: browser Storage uploads only
SUPABASE_SERVICE_ROLE_KEY=       # secret: server only, never prefix with NEXT_PUBLIC_
```

3) Run the development server:
```bash
npm run dev
```

The application will be available at [http://localhost:3000](http://localhost:3000).

## Deployment

This application is ready to be deployed on Next.js compatible platforms like [Vercel](https://vercel.com/). Ensure you configure your environment variables in your deployment platform's settings.

## Database migrations

SQL lives in `supabase/migrations/`, one dated file per change with a header
comment explaining it. Nothing applies them automatically: run each new file
in the Supabase SQL editor, in filename order, **before deploying code that
depends on it**. They are all idempotent (`if not exists` / `create or replace`),
so re-running one is harmless.

Setting up a fresh database? Apply every file, then backfill the derived
columns once:

```bash
npx tsx --conditions=react-server scripts/backfill-school-names.ts
npx tsx --conditions=react-server scripts/backfill-user-denorm.ts
npx tsx --conditions=react-server scripts/backfill-experience-logos.ts
```

(add `--dry` to preview.)

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
