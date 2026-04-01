# Affiliate Link Manager

## Project Overview
A full-stack web application for managing affiliate links, product comparisons, and a "link-in-bio" page. Built for affiliate marketers to showcase reviewed products with rankings, comparisons, and referral links.

## Tech Stack
- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui, framer-motion, TanStack Query, wouter
- **Backend**: Node.js, Express 5, TypeScript (tsx), Passport.js (local auth), express-session
- **Database**: PostgreSQL via Drizzle ORM
- **Validation**: Zod

## Project Structure
```
client/          # React frontend (Vite)
  src/
    components/  # Reusable UI components (shadcn/ui + custom)
    pages/       # Home, Admin, Comparison, LinkBio
    hooks/       # Custom React hooks
    lib/         # Utilities and React Query client
server/          # Express backend
  index.ts       # Entry point, middleware setup
  routes.ts      # API route definitions
  storage.ts     # Data access layer (Repository pattern)
  db.ts          # Database connection
  vite.ts        # Vite dev middleware integration
  static.ts      # Static file serving for production
shared/          # Shared types/schemas used by both client and server
  schema.ts      # Drizzle schema + Zod validation
script/
  build.ts       # esbuild + vite production build
```

## Key Commands
- `npm run dev` — Start development server (port 5000)
- `npm run build` — Build for production
- `npm start` — Run production build
- `npm run db:push` — Sync database schema

## Environment Variables
- `DATABASE_URL` — PostgreSQL connection string (required)
- `SESSION_SECRET` — Express session secret (optional, has fallback)

## Authentication
- Passport.js local strategy
- Default admin credentials seeded on first run: `admin` / `admin123`
- Sessions stored in PostgreSQL via connect-pg-simple

## Deployment
- Build command: `npm run build`
- Run command: `node ./dist/index.cjs`
- Deployment target: autoscale
