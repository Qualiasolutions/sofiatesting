# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is **SOFIA** (Sophisticated Optimized Functionality for Intelligent Assistance) - an AI Assistant for Zyprus Property Group (Cyprus Real Estate). It's a production-ready Next.js 15 chatbot application built with the AI SDK 5.0 that specializes in generating professional real estate documents for agents.

**Key Identity**: The app is configured as "SOFIA - Zyprus Property Group AI Assistant" and follows strict real estate document generation workflows defined in `SOPHIA_AI_ASSISTANT_INSTRUCTIONS_UPDATED.md`.

**Telegram Bot Integration**: SOFIA includes a fully functional Telegram bot that handles customer inquiries and maintains conversation history. The web interface serves as an admin panel for testing and monitoring. See `TELEGRAM_BOT_SETUP.md` for complete setup instructions.

**Template System**: 47 professional real estate document templates organized in `templates_03_38_instructions/` covering registrations, viewing forms, marketing agreements, and client communications with specialized Cyprus real estate knowledge.

## Development Commands

### Core Development
- `pnpm dev` - Start development server with Turbo for fast refresh
- `pnpm build` - Build production application (includes database migration)
- `pnpm start` - Start production server
- `pnpm lint` - Check code quality with Ultracite linter
- `pnpm format` - Fix code formatting with Ultracite formatter

### Database Management (Drizzle ORM)
- `pnpm db:generate` - Generate database migrations from schema changes
- `pnpm db:migrate` - Run database migrations (uses tsx lib/db/migrate.ts)
- `pnpm db:push` - Push schema changes directly to database (development)
- `pnpm db:studio` - Open Drizzle Studio for database inspection
- `pnpm db:pull` - Pull schema from existing database
- `pnpm db:check` - Check migration files for consistency
- `pnpm db:up` - Apply pending migrations

### Testing
- `pnpm test` - Run Playwright end-to-end tests (requires PLAYWRIGHT=True environment variable)
- Individual test files: `npx playwright test tests/e2e/specific-test.test.ts`
- Test with coverage: `npx playwright test --reporter=html`

## Architecture Overview

### Tech Stack
- **Framework**: Next.js 15 with App Router, React 19 RC, and PPR (Partial Prerendering)
- **AI**: AI SDK 5.0 with Vercel AI Gateway (Mistral models via @ai-sdk/mistral)
- **Database**: PostgreSQL with Drizzle ORM and comprehensive migration system
- **Auth**: NextAuth.js 5.0 beta with custom user management
- **UI**: shadcn/ui components with Tailwind CSS 4.x
- **Storage**: Vercel Blob for file uploads, Redis for session storage
- **Package Manager**: pnpm 9.x with efficient dependency management
- **Code Quality**: Ultracite for strict linting and formatting with comprehensive rules
- **Testing**: Playwright for E2E testing with realistic scenarios

### Directory Structure
```
app/
├── (auth)/                    # Authentication pages and routes
│   ├── api/auth/             # NextAuth.js API routes (guest user, [...nextauth])
│   ├── login/               # Login page with form validation
│   └── register/            # Registration page with email/password
├── (chat)/                   # Main chat interface with protected routes
│   ├── api/                 # Core API endpoints
│   │   ├── chat/           # Main chat API with streaming and tool integration
│   │   ├── document/       # Document management endpoints
│   │   ├── suggestions/    # Collaborative editing suggestions
│   │   ├── files/          # File upload and management
│   │   └── history/        # Chat history and session management
│   ├── chat/[id]/          # Individual chat sessions with real-time streaming
│   └── page.tsx            # Main chat interface with sidebar
├── api/                     # Additional API endpoints
│   ├── templates/          # Document template CRUD operations
│   └── telegram/           # Telegram bot webhook and setup endpoints
└── layout.tsx              # Root layout with theme provider and metadata

components/
├── ui/                     # shadcn/ui base components (Button, Input, etc.)
├── elements/               # Chat message components (response, tool, streaming)
├── artifact-*.tsx         # Document/artifact system components
├── chat-*.tsx             # Chat interface components (sidebar, input, messages)
└── *.tsx                  # Main UI components (header, navigation, etc.)

lib/
├── ai/                    # AI integration layer
│   ├── models.ts         # Model configuration (Mistral, xAI, mock models)
│   ├── prompts.ts        # System prompts and instructions for SOFIA
│   ├── tools/            # Tool definitions and handlers
│   └── providers.ts      # AI provider configurations
├── db/                   # Database layer
│   ├── schema.ts         # Drizzle schema with v2 message system
│   ├── migrations/       # Database migration files
│   ├── queries.ts        # Database query functions
│   └── client.ts         # Database client configuration
├── telegram/             # Telegram bot integration
│   ├── client.ts         # Telegram Bot API client
│   ├── handlers.ts       # Message processing and routing
│   ├── types.ts          # TypeScript types for Telegram objects
│   └── user-mapping.ts   # Telegram user to database user mapping
├── editor/               # Rich text editor with suggestions and diff support
├── zyprus/               # External service integrations (property listings, calculators)
└── *.ts                  # Utilities, types, constants, usage tracking

tests/
├── e2e/                  # End-to-end Playwright tests
│   ├── sofia-formatting/  # SOFIA-specific formatting tests
│   ├── chat-interactions/ # Chat flow and behavior tests
│   └── document-generation/ # Document generation tests
├── fixtures.ts           # Test data and mock scenarios
└── helpers.ts            # Test utilities and setup functions
```

### Key Systems

#### AI Integration (SOFIA Core)
- **Primary Models**: Configurable via Vercel AI Gateway with intelligent fallbacks
  - Default: `chat-model-small` (Mistral Small) - Fast and efficient ($0.6/M in, $1.8/M out)
  - Available models:
    - `chat-model-small`: Mistral Small
    - `chat-model-medium`: Mistral Medium 1.2 ($2/M in, $6/M out)
    - `chat-model-large`: Mistral Large ($3/M in, $9/M out)
    - `chat-model-code`: Codestral - Optimized for code ($0.3/M in, $0.9/M out)
    - `chat-model-reasoning`: Mistral Large with reasoning middleware
    - `chat-model-flagship`: Pixtral Large - Multimodal with vision ($8/M in, $24/M out)
  - Test environment: Automatically uses mock models when `PLAYWRIGHT=True`
- **Model Configuration**: Centralized in `lib/ai/models.ts` with `DEFAULT_CHAT_MODEL`
- **Provider Setup**: `lib/ai/providers.ts` configures models with reasoning middleware for enhanced capabilities
- **Chat Schema**: Request validation via `app/(chat)/api/chat/schema.ts` with message parts and file attachments
- **Critical Constraint**: SOFIA NEVER uses tools, artifacts, or side-by-side editing - generates all documents directly in chat
- **Real Estate Specialization**: 47 document templates for Cyprus real estate operations

#### Database Schema (Advanced)
- **Message System v2**: `Message_v2` table with parts-based architecture and attachments
- **Legacy Support**: Deprecated v1 message system still present for backward compatibility
- **Document Management**: Real estate documents with collaborative suggestions system
- **User Management**: Simple authentication with guest user support and role-based access
- **Chat Persistence**: Chat history with visibility settings, geographic context, and metadata
- **Stream Support**: Resumable streams with Redis backend and comprehensive token tracking
- **Property Listings**: Schema.org compliant real estate listing system (currently disabled)
- **Vote System**: User feedback on messages with v2 implementation for better analytics

#### SOFIA AI Behavior (Production Rules)
The AI assistant follows strict operating principles defined in `SOPHIA_AI_ASSISTANT_INSTRUCTIONS_UPDATED.md`:
- **Output Format**: Only field requests OR final generated documents (nothing else)
- **Document Generation**: Immediate generation when all required fields are complete
- **No Tools/Artifacts**: All content generated directly in chat interface for simplicity
- **Template Accuracy**: Character-by-character template copying with **bold pricing only**
- **Smart Field Extraction**: Intelligent extraction from conversation history and context
- **Decision Trees**: Complex logic for template selection and field requirements
- **Performance Targets**: Sub-3-second response times for document generation

## Configuration Files

### Environment Variables (.env.local required)
Critical environment variables for operation:
- `AUTH_SECRET` - NextAuth.js secret for session encryption (generate with `openssl rand -base64 32`)
- `AI_GATEWAY_API_KEY` - Vercel AI Gateway key (required for non-Vercel deployments)
- `POSTGRES_URL` - PostgreSQL database connection string
- `BLOB_READ_WRITE_TOKEN` - Vercel Blob storage token for file uploads
- `REDIS_URL` - Redis connection for session storage and rate limiting
- `TELEGRAM_BOT_TOKEN` - Telegram bot token from @BotFather (for Telegram integration)
- `PLAYWRIGHT` - Set to "True" when running E2E tests

### Key Configuration Files
- `drizzle.config.ts` - Database configuration using environment variables
- `next.config.ts` - Next.js with PPR enabled and AI SDK integration
- `playwright.config.ts` - E2E testing setup with configurable timeouts and parallel execution
- `.cursor/rules/ultracite.mdc` - Comprehensive Ultracite linting and formatting rules
- `app/(chat)/api/chat/schema.ts` - Chat API request validation with Zod schemas
- `lib/ai/models.ts` - AI model configuration and provider setup

## Development Guidelines

### SOPHIA Instructions System
The core AI behavior is comprehensively documented in `SOPHIA_AI_ASSISTANT_INSTRUCTIONS_UPDATED.md`:
- Complete operating instructions with 47 real estate document templates
- Enhanced formatting rules (plain text with **bold pricing only**)
- Complex field request structures and decision trees
- Location-aware responses (Cyprus-focused)
- Performance targets and quality standards
- Error prevention and common issues handling

### Chat API Architecture
- **Route**: `app/(chat)/api/chat/route.ts` handles all chat interactions with streaming
- **Tools Disabled**: `experimental_activeTools: []` and empty tools object for SOFIA
- **Streaming**: Real-time streaming with TokenLens usage tracking and error handling
- **Rate Limiting**: Message limits based on user type and authentication status
- **Context Management**: Geographic hints from request location and user preferences

### Message System Migration
The project uses Message v2 system with modern parts-based architecture:
- **Current**: `Message_v2` table with structured parts and file attachments
- **Deprecated**: `Message` table still present for backward compatibility
- **Migration**: Conversion utilities available in `lib/utils.ts` for seamless upgrade
- **Benefits**: Better performance, structured data, and enhanced querying capabilities

### Authentication & User Management
- **NextAuth.js**: Simple email/password authentication with secure session management
- **User Types**: Different entitlements based on authentication status (max messages per day)
- **Session Management**: Redis-based sessions with automatic cleanup and security
- **Guest Users**: Temporary guest access for testing and demonstrations
- **Telegram Integration**: Automatic user creation for Telegram users with mapped IDs

### Testing Strategy
- **E2E Tests**: Comprehensive Playwright tests for SOFIA formatting, chat interactions, and document generation
- **Test Environment**: Mock models available for consistent testing without API costs
- **CI/CD Integration**: Tests run in production-like environment with proper setup
- **Special Tests**: SOFIA formatting tests verify proper rendering of lists, bold text, and document structure
- **Coverage**: Tests cover critical paths including document generation, field extraction, and user interactions

### Code Quality and Style
The project uses Ultracite for code formatting and linting with strict rules:
- **TypeScript**: Strict type safety, no enums, no namespaces, proper `export type`/`import type` usage
- **React**: No `<img>` or `<head>` in Next.js, proper hook dependencies, fragment usage
- **Accessibility**: Comprehensive a11y rules for screen readers, keyboard navigation, ARIA attributes
- **Code Quality**: Cognitive complexity limits, no console/debugger statements, proper error handling
- **Style**: Consistent naming, arrow functions, proper imports/exports, no var/let misuse
- **Security**: No hardcoded secrets, proper CSP, safe eval usage, input validation

Run `pnpm lint` to check and `pnpm format` to fix issues automatically.

### Critical Development Constraints
- **SOFIA Never Uses Tools**: The AI assistant is configured to never use artifacts, tools, or side-by-side editing
- **Direct Chat Generation**: All documents are generated directly in the chat interface
- **Template Fidelity**: Documents must follow templates exactly with only pricing information bolded
- **No Markdown Formatting**: Plain text output with bold pricing only for professional appearance
- **Field Extraction**: Smart extraction from conversation history with silent usage
- **Error Prevention**: Multiple validation layers to prevent incomplete document generation

### Telegram Bot Architecture (Production Feature)
- **Webhook System**: Telegram sends updates to `/api/telegram/webhook` with secure validation
- **User Mapping**: Each Telegram user gets a database user (`telegram_<id>@sofia.bot`)
- **Persistent Chats**: One continuous conversation per Telegram user with history
- **Model Selection**: Uses configured Mistral models for consistent behavior across platforms
- **Message Flow**: Telegram → Webhook → SOFIA AI → Database → Response to Telegram
- **Calculator Tools**: Full support for transfer fees, capital gains, and VAT calculations
- **Setup Scripts**: `scripts/setup-telegram-bot.sh` and `scripts/deploy-with-telegram.sh`
- **Documentation**: Complete setup guide in `TELEGRAM_BOT_SETUP.md`

## Advanced Features

### Real Estate Calculators
SOFIA includes integrated real estate calculators for Cyprus:
- **Transfer Fees Calculator**: Progressive rates with 50% exemption for resale properties
- **Capital Gains Tax Calculator**: 20% tax with inflation adjustments and allowances
- **VAT Calculator**: Complex area-based calculations for new properties (pre/post Nov 2023 policies)

### Template System
47 professional document templates covering:
- **Registrations** (8 types): Seller, Bank, Developer registrations with viewing arrangements
- **Viewing Forms** (4 types): Standard, Advanced, Property Reservation, Reservation Agreement
- **Marketing Agreements** (3 types): Email, Non-Exclusive, Exclusive with different terms
- **Client Communications** (29 types): Follow-ups, valuations, compliance, apologies, etc.
- **Specialized Templates**: AML/KYC requests, phone number masking, bank-specific formats

### Performance Optimizations
- **Partial Prerendering (PPR)**: Enabled for faster initial page loads
- **Streaming Responses**: Real-time token streaming with proper error handling
- **Database Optimization**: Indexed queries, connection pooling, and efficient migrations
- **Caching Strategy**: Redis-based session caching with appropriate TTL values
- **Asset Optimization**: Vercel Blob for file storage with CDN integration

## Deployment Notes

### Vercel Deployment (Recommended)
- **Environment Variables**: Configure all required variables in Vercel dashboard
- **Database**: Use Vercel Postgres for seamless integration
- **Redis**: Vercel Redis for session storage and rate limiting
- **Blob Storage**: Vercel Blob for file uploads and document storage
- **AI Gateway**: Automatic authentication for Vercel deployments

### Local Development
- **Database**: PostgreSQL required (Docker recommended for consistency)
- **Redis**: Local Redis instance for session storage
- **Environment**: Copy `.env.example` to `.env.local` and configure all variables
- **Migrations**: Run `pnpm db:migrate` after database setup
- **Testing**: Set `PLAYWRIGHT=True` for E2E tests

### Monitoring and Analytics
- **Vercel Analytics**: Built-in performance monitoring and user analytics
- **TokenLens**: AI usage tracking for cost monitoring and optimization
- **Error Handling**: Comprehensive error tracking with proper logging
- **Database Monitoring**: Drizzle Studio for database inspection and query optimization

This codebase represents a production-ready AI chatbot with sophisticated document generation capabilities, comprehensive testing, and scalable architecture. The strict adherence to templates and formatting rules ensures consistent professional output for real estate operations.