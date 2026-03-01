# LankaPros — Sri Lankan Professional Network

LinkedIn meets MySpace for Sri Lankan professionals. Next.js 16 + TypeScript + Tailwind CSS 4 + Supabase. GitHub: chatde/lankapros. Owner: Dad — maximum autonomy.

## Commands

```bash
npm run build    # Build — catches ALL TS errors
npm run dev      # Dev server
npm test         # Run tests (if configured)
```

## Stack & Conventions

- **Framework**: Next.js 16 App Router, React 19, TypeScript strict
- **Styling**: Tailwind CSS 4, Sri Lankan flag palette (maroon, orange, green, gold #D4A843)
- **Database**: Supabase (PostgreSQL + Realtime + Auth + Storage)
- **Schema**: supabase-schema.sql (14 tables with RLS, 3 storage buckets, 3 RPC functions)
- **Auth**: Email/password + Google OAuth via Supabase Auth
- **Search**: pg_trgm fuzzy search on profiles, posts, groups
- **Realtime**: Supabase Realtime on messages + notifications tables

## Design

- Dark mode default, mobile-first
- Background patterns: dots, waves, batik, lotus, grid
- MySpace-style customizable profile themes

## Known Pitfalls

- NOT deployed yet — needs Supabase project (Singapore region) + Vercel
- Domain lankapros.com registered on Namecheap but DNS not configured
- Google OAuth must be configured in Supabase Auth settings
