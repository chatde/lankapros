# CLAUDE.md — LankaPros

## What This Is

Professional social network for Sri Lankan professionals — LinkedIn meets MySpace, with customizable profiles, community groups, messaging, and career features tailored for the Sri Lankan diaspora and local professionals.

## Tech Stack

- **Framework**: Next.js 16 App Router, React 19, TypeScript strict
- **Database**: Supabase (PostgreSQL + Realtime + Auth + Storage, 14 tables, RLS, 3 storage buckets, 3 RPC functions, pg_trgm fuzzy search)
- **Auth**: Email/password + Google OAuth via Supabase Auth
- **Charts**: Recharts (dynamically imported)
- **Notifications**: Sonner toast library
- **Styling**: Tailwind CSS 4, dark mode default, mobile-first, Sri Lankan flag palette (maroon, orange, green, gold `#D4A843`)
- **Validation**: Zod v4
- **Hosting**: Vercel (target — not yet deployed)
- **Domain**: lankapros.com (Namecheap — DNS not yet configured)
- **GitHub**: chatde/lankapros (SSH protocol)
- **Node**: /opt/homebrew/bin/node

## Key Paths

```
src/                    # Next.js App Router source
src/app/                # Pages and API routes
src/components/         # Shared UI components
src/lib/                # Utility libraries
supabase-schema.sql     # Full database schema (14 tables, RLS, buckets, RPC functions)
GAMEPLAN.md             # Architecture plan and feature checklist
```

## Development Workflow

```bash
npm run dev      # Dev server
npm run build    # Production build — catches ALL TS errors
npm run lint     # ESLint
npm test         # Run tests (when configured)

# Deploy
git push origin main   # Triggers Vercel auto-deploy (once connected)
```

## Project-Specific Rules

- **TypeScript strict**: Never use `any`. Use `unknown`, proper types, or generics. Zero errors before commit.
- **No console.log in production code.**
- **Database**: Supabase project should be in Singapore region for latency. Needs `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY` + `SUPABASE_SERVICE_ROLE_KEY` in .env.
- **Google OAuth**: Must be configured in Supabase Auth dashboard settings before it will work.
- **Recharts**: Dynamically imported to avoid SSR issues — keep this pattern for any chart components.
- **Background patterns**: Dots, waves, batik, lotus, grid — preserve these cultural design elements.
- **Profile themes**: MySpace-style customizable themes are a key differentiator — do not remove theme functionality.
- **Status**: Not yet live — needs Supabase project creation + Vercel project connection + DNS setup.
- **Git**: SSH protocol (chatde on GitHub). Deploy by pushing to main — Vercel auto-deploys once connected.
