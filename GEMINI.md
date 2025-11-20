# SOFIA Project Context

## Project Overview
SOFIA (System for Optimized Financial & Investment Assistance) is a production-grade Next.js 15 application serving as an AI-powered assistant for Zyprus Property Group. It leverages the Vercel AI SDK and AI Gateway to provide features like real estate document drafting, property listing management, and automated support via web and Telegram.

## Tech Stack
- **Framework:** Next.js 15.3.0 (App Router)
- **Language:** TypeScript
- **AI:** Vercel AI SDK 5.0, AI Gateway (Claude, GPT-4o, Gemini)
- **Database:** PostgreSQL (via Drizzle ORM)
- **Auth:** NextAuth.js 5.0 Beta
- **Styling:** Tailwind CSS 4.0
- **State/Cache:** Upstash Redis

## Key Directories
- `app/`: Next.js App Router pages and API routes.
  - `(chat)/`: Main chat interface.
  - `api/`: Backend API endpoints.
- `lib/`: Core logic and utilities.
  - `ai/`: AI provider configuration, prompts, and tools.
  - `db/`: Database schema and queries.
  - `zyprus/`: Integration with Zyprus API.
- `components/`: React UI components.
- `docs/`: Comprehensive project documentation.
- `scripts/`: Utility scripts for database and admin tasks.

## Development & Commands
- **Package Manager:** `pnpm`
- **Start Dev Server:** `pnpm dev`
- **Build:** `pnpm build`
- **Database Migrations:** `pnpm db:migrate`
- **Lint/Format:** `pnpm lint`, `pnpm format`
- **Tests:** `pnpm test` (E2E), `pnpm test:unit`

## Configuration
- **Environment Variables:** Managed via `.env.local` (local) and Vercel Project Settings (production).
- **Key Variables:** `AI_GATEWAY_API_KEY` (Critical), `POSTGRES_URL`, `AUTH_SECRET`, `GOOGLE_GENERATIVE_AI_API_KEY` (Potential issue).

## Current Focus
- Troubleshooting Gemini API integration in Vercel deployment.
- Ensuring strictly Vercel AI Gateway usage where applicable, or correct direct API usage if intended.
