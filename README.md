# SOFIA – Zyprus Property Group AI Assistant

SOFIA is a production-grade Next.js 15 application that helps Zyprus agents draft real estate documents, manage property listings, and operate an AI-assisted support desk. It builds on Vercel's AI SDK with custom tooling, PostgreSQL persistence, and a Telegram bot integration.

## 🚀 Active Development

**Optimization work in progress!** See `IMPLEMENTATION_PLAN.md` for:
- 10 prioritized performance & cost optimizations
- Current implementation status
- Testing & deployment checklists
- Performance metrics tracking

All contributors and AI agents should reference `IMPLEMENTATION_PLAN.md` before starting work.

## Highlights
- **Chat Workspace** – secure, access-code gated UI with guest and registered sessions.
- **Template Engine** – 38 instruction templates sourced from the legacy SOPHIA corpus with smart loading support.
- **Property Listing Flow** – create, review, and upload listings to the Zyprus API, with retries and audit logging.
- **Telegram Bot** – webhook-powered agent experience for external conversations.
- **Observability** – OpenTelemetry instrumentation hooks ready for Vercel traces.

## Requirements
- Node.js 20+
- pnpm 9.x
- PostgreSQL (Neon/Vercel Postgres recommended)
- Redis (Upstash) for rate limiting and sessions
- Credentials for the Vercel AI Gateway (or direct model keys)
- Zyprus API OAuth client (for listing uploads)

## Getting Started
```bash
pnpm install
cp .env.example .env.local   # populate required secrets
pnpm db:migrate
pnpm dev
```

Visit `http://localhost:3000`, enter the access code, then authenticate (or let SOFIA auto-provision a guest).

## Key Scripts
- `pnpm lint` / `pnpm format` – run Ultracite linting and formatting using the pinned workspace version.
- `pnpm db:*` – manage Drizzle migrations against `lib/db/schema.ts`.
- `pnpm test` – execute Playwright E2E suites (requires a running dev server and `PLAYWRIGHT=True`).

## Documentation
All Markdown documentation now lives under `docs/`:
- `guides/` – deployment, AI gateway, API key, and Telegram setup walk-throughs.
- `knowledge/` – domain context plus the new property-listing implementation guide.
- `templates/` – consolidated SOPHIA instruction registry and historical exports.
- `updates/` – change logs and Claude configuration notes.

Start with `docs/README.md` to locate the material you need.

## Deployment Notes
- `next.config.ts` targets Vercel but can be adapted for other platforms.
- The middleware enforces an access cookie (`qualia-access`) before any page render; seed it via `/access` or in tests.
- For production, set `POSTGRES_URL`, `ZYPRUS_CLIENT_ID`, `ZYPRUS_CLIENT_SECRET`, model provider tokens, and `AUTH_SECRET`.

## Contributing
1. Create feature branches off `main`.
2. Keep AI template changes isolated and update the registry in `lib/ai/instructions/template-loader.ts`.
3. Document noteworthy changes in `docs/updates/`.
4. Open a PR with screenshots or trace links when touching UI or Playwright flows.

SOFIA remains under the MIT license (see `LICENSE`).
