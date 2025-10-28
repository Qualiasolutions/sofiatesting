# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is **SOFIA** - an AI Assistant for Zyprus Property Group (Cyprus Real Estate). It's a Next.js 15 chatbot application built with the AI SDK that specializes in generating professional real estate documents for agents.

**Key Identity**: The app is configured as "SOFIA - Zyprus Property Group AI Assistant" and follows specific real estate document generation workflows defined in `SOPHIA_AI_ASSISTANT_INSTRUCTIONS_UPDATED.md`.

**Telegram Bot Integration**: SOFIA now includes a fully functional Telegram bot that forwards messages and maintains conversations. The web interface acts as an admin panel for testing and monitoring. See `TELEGRAM_BOT_SETUP.md` for setup instructions.

## Development Commands

### Core Development
- `pnpm dev` - Start development server with Turbo
- `pnpm build` - Build production application (includes database migration)
- `pnpm start` - Start production server
- `pnpm lint` - Check code quality with Ultracite
- `pnpm format` - Fix code formatting with Ultracite

### Database Management (Drizzle ORM)
- `pnpm db:generate` - Generate database migrations
- `pnpm db:migrate` - Run database migrations (uses tsx lib/db/migrate.ts)
- `pnpm db:push` - Push schema changes directly to database
- `pnpm db:studio` - Open Drizzle Studio for database inspection
- `pnpm db:pull` - Pull schema from database
- `pnpm db:check` - Check migration files
- `pnpm db:up` - Apply migrations

### Testing
- `pnpm test` - Run Playwright end-to-end tests (requires PLAYWRIGHT=True environment variable)
- Individual test files can be run with: `npx playwright test tests/e2e/specific-test.test.ts`

## Architecture Overview

### Tech Stack
- **Framework**: Next.js 15 with App Router and React 19 RC
- **AI**: AI SDK 5.0 with Vercel AI Gateway (xAI models by default)
- **Database**: PostgreSQL with Drizzle ORM
- **Auth**: NextAuth.js 5.0 beta
- **UI**: shadcn/ui components with Tailwind CSS
- **Storage**: Vercel Blob for files, Redis for sessions
- **Package Manager**: pnpm
- **Code Quality**: Ultracite for linting and formatting

### Directory Structure
```
app/
├── (auth)/           # Authentication pages (login, register)
│   └── api/auth/     # NextAuth.js routes (guest user, [...nextauth])
├── (chat)/           # Main chat interface
│   ├── api/          # Core API routes (chat, document, suggestions, files, history)
│   ├── chat/[id]/    # Individual chat sessions with streaming
│   └── page.tsx      # Chat interface
├── api/              # Additional API endpoints
│   ├── templates/    # Document template management
│   └── telegram/     # Telegram bot webhook and setup
└── layout.tsx        # Root layout with theme provider

components/
├── ui/               # shadcn/ui components
├── elements/         # Chat message elements (response, tool, etc.)
├── artifact-*.tsx    # Document/artifact system components
└── *.tsx             # Main UI components (chat, sidebar, etc.)

lib/
├── ai/               # AI configuration, models, prompts, tools, providers
├── db/               # Database schema, queries, migrations, client
├── telegram/         # Telegram bot integration (client, handlers, types, user-mapping)
├── editor/           # Rich text editor with suggestions and diff support
├── zyprus/           # External service integrations
└── *.ts              # Utilities, types, constants, usage tracking

tests/
├── e2e/              # End-to-end Playwright tests
├── fixtures.ts       # Test data and fixtures
└── helpers.ts        # Test utilities
```

### Key Systems

#### AI Integration (SOFIA Core)
- **Primary Models**: Configurable via Vercel AI Gateway with fallbacks
  - Default: Mistral models (Small, Medium 1.2, Large, Codestral)
  - xAI models available: `grok-2-vision-1212`, `grok-3-mini`
  - Mock models for testing: `mock-chat-model`, `mock-chat-model-reasoning`
- **Model Configuration**: Models defined in `lib/ai/models.ts` with `DEFAULT_CHAT_MODEL` setting
- **Chat Schema**: Request validation via `app/(chat)/api/chat/schema.ts` with message parts and file attachments
- **Critical Constraint**: SOFIA NEVER uses tools, artifacts, or side-by-side editing - generates all documents directly in chat
- **Real Estate Specialization**: 42+ document templates for Cyprus real estate (registrations, viewing forms, marketing agreements, client communications)

#### Database Schema
- **Message System**: v2 message parts system (`Message_v2` table) - deprecated v1 still present in schema
- **Document Management**: Real estate documents with collaborative suggestions system
- **User Management**: Simple user auth with email/password and guest user support
- **Chat Persistence**: Chat history with visibility settings and geographic context
- **Stream Support**: Resumable streams with Redis backend and token tracking
- **Property Listings**: Schema.org compliant real estate listing system (currently disabled)
- **Vote System**: User feedback on messages with v2 implementation

#### SOPHIA AI Behavior
The AI assistant follows strict operating principles:
- **Output Format**: Only field requests OR final generated documents (nothing else)
- **Document Generation**: Immediate generation when all required fields are complete
- **No Tools/Artifacts**: All content generated directly in chat interface
- **Template Accuracy**: Character-by-character template copying with pricing information in **bold**
- **Field Extraction**: Smart extraction from any message across conversation history

## Configuration Files

### Environment Variables (.env.local required)
- `AUTH_SECRET` - NextAuth.js secret for session encryption
- `AI_GATEWAY_API_KEY` - Vercel AI Gateway key (required for non-Vercel deployments)
- `POSTGRES_URL` - PostgreSQL database connection string
- `BLOB_READ_WRITE_TOKEN` - Vercel Blob storage token for file uploads
- `REDIS_URL` - Redis connection for session storage and rate limiting
- `TELEGRAM_BOT_TOKEN` - Telegram bot token from @BotFather (for Telegram integration)
- `PLAYWRIGHT` - Set to "True" when running E2E tests

### Key Config Files
- `drizzle.config.ts` - Database configuration using environment variables
- `next.config.ts` - Next.js with PPR (Partial Prerendering) enabled and AI SDK integration
- `playwright.config.ts` - E2E testing setup with configurable timeouts and retries
- `.cursor/rules/ultracite.mdc` - Comprehensive Ultracite linting and formatting rules
- `app/(chat)/api/chat/schema.ts` - Chat API request validation with Zod schemas

## Development Notes

### SOPHIA Instructions System
The core AI behavior is defined in `SOPHIA_AI_ASSISTANT_INSTRUCTIONS_UPDATED.md`:
- Complete operating instructions with 42+ real estate document templates
- Enhanced formatting rules (plain text with **bold pricing only**)
- Field request structures and decision trees
- Location-aware responses (Cyprus-focused)
- Performance targets and quality standards

### Chat API Architecture
- **Route**: `app/(chat)/api/chat/route.ts` handles all chat interactions
- **Tools Disabled**: `experimental_activeTools: []` and empty tools object for SOFIA
- **Streaming**: Real-time streaming with TokenLens usage tracking
- **Rate Limiting**: Message limits based on user type
- **Context Management**: Geographic hints from request location

### Message System Migration
The project uses Message v2 system with parts-based architecture:
- Current: `Message_v2` table with parts and attachments
- Deprecated: `Message` table still present for backward compatibility
- Conversion utilities available in `lib/utils.ts`

### Authentication & User Management
- NextAuth.js with simple email/password authentication
- User types with different entitlements (max messages per day)
- Session management with Redis
- Guest user support for testing

### Testing Strategy
- **E2E Tests**: Playwright tests for SOFIA formatting, chat interactions, and document generation
- **Test Environment**: Mock models available for consistent testing
- **CI/CD**: Tests run in production-like environment
- **Special Tests**: SOFIA formatting tests verify proper rendering of lists, bold text, and document structure

### Code Quality and Style
The project uses Ultracite for code formatting and linting with strict rules enforced via `.cursor/rules/ultracite.mdc`:
- **TypeScript**: Strict type safety, no enums, no namespaces, `export type`/`import type` usage
- **React**: No `<img>` or `<head>` in Next.js, proper hook dependencies, fragment usage
- **Accessibility**: Comprehensive a11y rules for screen readers, keyboard navigation, ARIA attributes
- **Code Quality**: Cognitive complexity limits, no console/debugger statements, proper error handling
- **Style**: Consistent naming, arrow functions, proper imports/exports, no var/let misuse
- **Security**: No hardcoded secrets, proper CSP, safe eval usage

Run `pnpm lint` to check and `pnpm format` to fix issues automatically.

### Critical Development Constraints
- **SOFIA Never Uses Tools**: The AI assistant is configured to never use artifacts, tools, or side-by-side editing
- **Direct Chat Generation**: All documents are generated directly in the chat interface
- **Template Fidelity**: Documents must follow templates exactly with only pricing information bolded
- **No Markdown Formatting**: Plain text output with bold pricing only

### Telegram Bot Architecture
- **Webhook System**: Telegram sends updates to `/api/telegram/webhook`
- **User Mapping**: Each Telegram user gets a database user (`telegram_<id>@sofia.bot`)
- **Persistent Chats**: One continuous conversation per Telegram user
- **Model**: Uses Gemini 2.5 Flash by default (8x cheaper than Grok for high-volume)
- **Message Flow**: Telegram → Webhook → SOFIA AI → Database → Response to Telegram
- **Calculator Tools**: Full support for transfer fees, capital gains, and VAT calculators
- **Setup Scripts**: `scripts/setup-telegram-bot.sh` and `scripts/deploy-with-telegram.sh`
- **Documentation**: See `TELEGRAM_BOT_SETUP.md` for complete setup guide