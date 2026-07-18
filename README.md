# MockMate

AI-powered Interview Preparation Platform.

## Stack

- **Next.js 15** (App Router) + TypeScript
- **Tailwind CSS** + **shadcn/ui**
- **Framer Motion**, **Lucide React**, **Recharts**
- **React Hook Form** + **Zod**
- **Supabase** (client ready for Phase 2+)
- **Vercel**-ready deployment

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project structure

```
app/                 # Next.js App Router
components/          # Shared UI & layout
  ui/                # shadcn-style primitives
features/            # Feature modules (landing, …)
hooks/               # Shared hooks
lib/                 # Config, utils, Supabase client
services/            # Domain services (Phase 2+)
types/               # Shared TypeScript types
utils/               # Extra helpers
public/              # Static assets
```

## Phase 1

Landing page only — no auth, dashboard, AI, or backend yet.

## Environment

Copy `.env.example` to `.env.local` when wiring Supabase in Phase 2.
