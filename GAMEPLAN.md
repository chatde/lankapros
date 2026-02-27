# LankaPros — Sri Lankan Professional Network

## Overview
LinkedIn-style professional networking platform with MySpace-style customizable profiles.
- **URL:** lankapros.com
- **Domain:** Namecheap (already purchased)
- **Target:** Sri Lankan professionals and younger workforce entrants

## Tech Stack
- **Frontend:** Next.js 14+ (App Router, TypeScript, Tailwind CSS)
- **Backend/DB/Auth/Storage:** Supabase (PostgreSQL, free tier)
- **Hosting:** Vercel (free tier)
- **Code:** `/Volumes/AI-Models/lankapros/`
- **GitHub:** `chatde/lankapros`

## Core Features
1. Auth — Email/password + Google OAuth
2. Customizable Profiles — MySpace-style theme colors & background patterns
3. Post Feed — Text/image posts, likes, comments, industry filters
4. Connections — Send/accept, "People you may know"
5. Real-time Messaging — DMs via Supabase Realtime
6. Industry Groups — 19 pre-seeded Sri Lankan industries
7. Search — Fuzzy search on people, posts, groups
8. Notifications — Real-time bell via Supabase Realtime

## Database (14 tables)
profiles, experiences, education, skills, connections, posts, post_likes, comments, conversations, messages, groups, group_members, notifications, industries

## Design
- Dark mode default
- Sri Lankan flag palette: maroon, orange, green, gold (#D4A843 accent)
- Mobile-first responsive
- Cultural touches: lotus patterns, batik, "Ayubowan" welcome

## Deployment
- Vercel (auto-deploy from GitHub main branch)
- Namecheap DNS: A @ → 76.76.21.21, CNAME www → cname.vercel-dns.com
