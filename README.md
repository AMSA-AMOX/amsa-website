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
