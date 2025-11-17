# SOFIA Documentation

**Version**: 3.1.0
**Last Updated**: 2025-01-17
**Status**: ✅ Production Ready

## Overview

SOFIA (Sophia AI Assistant) is a production-grade Next.js 15 application serving as Zyprus Property Group's AI Assistant for Cyprus real estate operations. This documentation covers all aspects of the platform development, deployment, and maintenance.

## Quick Start

### For Developers

```bash
# Clone and setup
git clone https://github.com/Qualiasolutions/sofiatesting.git
cd sofiatesting
pnpm install

# Environment setup
cp .env.example .env.local
# Configure required environment variables

# Development server
pnpm dev

# Database setup
pnpm db:generate
pnpm db:migrate

# Build and test
pnpm build
pnpm test
```

### For Users

**Live Site**: https://sofiatesting.vercel.app
**Admin Panel**: https://sofiatesting.vercel.app/admin (admin access required)

## Documentation Structure

### 📚 Core Documentation

- [**Property Upload Workflow**](development/property-upload-workflow.md) - Complete property listing creation process
- [**Zyprus API Integration**](api/zyprus-integration.md) - External API integration details
- [**Admin Panel Guide**](admin/admin-panel-guide.md) - Platform administration interface
- [**Bug Fixes Report**](bug-fixes/zyprus-property-upload-critical-fixes-2025-01-17.md) - Recent critical bug fixes

### 🚀 Deployment & Operations

- [**Deployment Summary**](../DEPLOYMENT_SUMMARY.md) - Production deployment checklist and procedures
- [**Changelog**](changelog/v3.1.0-zyprus-upload-fixes.md) - Version 3.1.0 release notes
- [**QA Gates**](qa/gates/property-upload-bug-fixes-2025-01-17.yml) - Quality assurance reviews

### 🔧 Development

- [**CLAUDE.md**](../CLAUDE.md) - Development guidelines and project structure
- [**Implementation Plan**](../IMPLEMENTATION_PLAN.md) - Project roadmap and task tracking
- [**Environment Setup**](../.env.example) - Configuration template

## Platform Features

### 🏠 Core Real Estate Functionality

- **Property Listings**: Create and manage Cyprus real estate listings
- **Document Generation**: 38 Cyprus real estate document templates
- **Tax Calculators**: VAT, transfer fees, capital gains tax
- **AI Chat Interface**: Specialized real estate assistance
- **Property Upload**: Direct integration with Zyprus API

### 🤖 AI Integration

- **Multi-Model Support**: Claude Haiku/Sonnet, Gemini 2.5 Pro, GPT-4o Mini
- **Specialized Tools**: Cyprus real estate calculation tools
- **Template System**: Smart document generation with variable extraction
- **Conversation Management**: Context-aware chat with history

### 🔌 Third-Party Integrations

- **Zyprus API**: Property listing management and upload
- **Telegram Bot**: External support and notifications
- **AI Gateway**: Vercel AI Gateway for model access
- **Redis/KV**: Caching and rate limiting
- **PostgreSQL**: Primary data storage with Drizzle ORM

### 🛠️ Administrative Features

- **User Management**: Role-based access control
- **System Monitoring**: Health checks and performance metrics
- **Audit Logging**: Complete admin action tracking
- **Integration Status**: Real-time service health monitoring
- **Analytics Dashboard**: Usage and performance insights

## Architecture Overview

### Frontend Architecture

```
app/
├── (auth)/              # Authentication pages
├── (chat)/              # Main chat interface
│   ├── api/chat/        # Streaming AI endpoint
│   └── chat/[id]/       # Individual chat sessions
├── (admin)/             # Admin interface
├── api/                 # API routes
├── properties/          # Property management UI
└── globals.css          # Tailwind CSS styling
```

### Backend Architecture

```
lib/
├── ai/
│   ├── providers.ts     # AI Gateway configuration
│   ├── prompts.ts       # System prompts (cached)
│   └── tools/           # Cyprus real estate tools
├── db/
│   ├── schema.ts        # Drizzle schema with indexes
│   └── queries.ts       # Database operations
├── telegram/            # Bot integration
└── zyprus/              # API client with Redis cache
```

### Database Schema

Key tables:
- `User` - Authentication and profiles
- `Chat` - Conversation sessions
- `Message_v2` - Chat messages with parts
- `PropertyListing` - Real estate listings
- `Vote_v2` - Message feedback
- Admin tables (migration 0013)

## Technology Stack

### Core Technologies

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript with strict type checking
- **Database**: PostgreSQL with Drizzle ORM
- **Caching**: Redis/Upstash KV
- **Authentication**: NextAuth.js
- **Styling**: Tailwind CSS with PostCSS

### AI & APIs

- **AI Models**: Claude (Anthropic), Gemini (Google), GPT-4o (OpenAI)
- **AI Gateway**: Vercel AI Gateway for model access
- **Real Estate API**: Zyprus JSON:API integration
- **Communication**: Telegram Bot API
- **Image Processing**: Native fetch with blob handling

### Development & Deployment

- **Package Manager**: pnpm with workspace support
- **Code Quality**: Ultracite (ESLint + Prettier)
- **Testing**: Playwright for E2E, Vitest for unit tests
- **Deployment**: Vercel with automatic deployments
- **Monitoring**: Vercel Analytics, custom health checks

## Recent Updates

### Version 3.1.0 (2025-01-17) - Critical Bug Fixes

**🚨 Production Blocking Issues Resolved**:
- Fixed property upload images requirement (422 errors)
- Fixed image upload format (415 errors)
- Success rate improved from 0% to 100%

**✨ New Features**:
- Complete admin panel interface
- Comprehensive test suite
- Enhanced documentation
- Gemini 2.5 Pro integration

**📊 Performance Improvements**:
- Redis caching for Zyprus taxonomy (95% fewer API calls)
- Prompt caching for Claude models ($2-5 savings per 1000 requests)
- Optimized database queries with composite indexes

## Getting Help

### Development Support

- **Project Guidelines**: See [CLAUDE.md](../CLAUDE.md)
- **Bug Reports**: Check [Issues](https://github.com/Qualiasolutions/sofiatesting/issues)
- **Documentation Updates**: Contribute via pull requests

### Operational Support

- **Deployment Issues**: Check Vercel logs and environment variables
- **API Problems**: Review integration status in admin panel
- **Performance Issues**: Monitor system health metrics

### Contact Information

- **Development Team**: SOFIA Development Team
- **Project Repository**: https://github.com/Qualiasolutions/sofiatesting
- **Production Site**: https://sofiatesting.vercel.app

## Contributing

### Development Workflow

1. **Setup**: Clone repository and configure environment
2. **Development**: Create feature branch from main
3. **Testing**: Run full test suite before commits
4. **Documentation**: Update relevant documentation
5. **Review**: Submit pull request for review
6. **Deployment**: Merge to main triggers automatic deployment

### Code Quality Standards

- **TypeScript**: Strict mode enabled
- **Code Style**: Ultracite configuration enforced
- **Testing**: Minimum 80% coverage for new code
- **Documentation**: Updates required for API changes
- **Security**: Input validation and error handling required

## Quality Assurance

### Testing Strategy

- **Unit Tests**: Core business logic and utilities
- **Integration Tests**: API endpoints and database operations
- **E2E Tests**: Complete user workflows
- **Performance Tests**: Load testing for critical paths
- **Security Tests**: Vulnerability scanning and penetration testing

### Quality Gates

- **Code Review**: All changes require peer review
- **Automated Testing**: CI/CD pipeline with quality checks
- **Manual Testing**: E2E validation for critical features
- **Performance Monitoring**: Post-deployment health checks

## Monitoring & Maintenance

### System Monitoring

- **Application Health**: Custom health checks and metrics
- **Performance**: Response times and error rates
- **Usage Analytics**: User behavior and feature adoption
- **Cost Tracking**: API usage and infrastructure costs

### Maintenance Procedures

- **Regular Updates**: Dependency updates and security patches
- **Database Maintenance**: Index optimization and cleanup
- **Backup Procedures**: Regular data backups and restoration testing
- **Performance Tuning**: Ongoing optimization based on metrics

## Security & Compliance

### Security Measures

- **Authentication**: Secure session management with NextAuth
- **Authorization**: Role-based access control
- **Data Protection**: Encrypted data storage and transmission
- **Input Validation**: Comprehensive input sanitization
- **Audit Logging**: Complete admin action tracking

### Compliance

- **GDPR**: Data protection and privacy compliance
- **Data Retention**: Configurable retention policies
- **User Rights**: Data access and deletion capabilities
- **Privacy**: Minimal data collection and transparent policies

---

**For detailed information on specific topics, please navigate to the relevant sections in the sidebar or use the search functionality.**

**Last Updated**: 2025-01-17
**Document Version**: 3.1.0
**Maintainers**: SOFIA Development Team