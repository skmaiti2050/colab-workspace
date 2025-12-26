# Collaborative Workspace Backend

A NestJS backend service for real-time collaborative workspaces.

## Tech Stack

- **Framework:** NestJS 11 with TypeScript 5.9
- **Database:** PostgreSQL 17 with TypeORM
- **Validation:** Zod + class-validator
- **Security:** Helmet + CORS + Rate limiting
- **Testing:** Jest + fast-check

## Prerequisites

- Node.js 24+
- PostgreSQL 17+
- Docker (optional)

## Quick Start

```bash
# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Start development server
npm run start:dev

# Run tests
npm test
```

## Project Structure

```
src/
├── config/           # Configuration with Zod validation
├── app.module.ts     # Root module
├── app.controller.ts # Health check endpoint
├── app.service.ts    # Application service
└── main.ts          # Bootstrap
```

## Available Scripts

```bash
npm run start:dev     # Development with hot reload
npm run build         # Build for production
npm run start:prod    # Run production build
npm test              # Run unit tests
npm run test:cov      # Test coverage
npm run test:e2e      # E2E tests
npm run lint          # Lint code
```

## Deployment

### Render + NeonDB

This project is configured for deployment on Render with NeonDB as the database:

1. Create a NeonDB database at https://neon.tech
2. Deploy to Render using `render.yaml`
3. Add `DATABASE_URL` environment variable in Render dashboard with your NeonDB connection string

See `render.yaml` for deployment configuration.

## Docker

```bash
# Docker Compose (recommended)
npm run docker:up      # Start PostgreSQL + App
npm run docker:logs    # View logs
npm run docker:down    # Stop services

# Single container
docker build -t collaborative-workspace .
docker run -p 3000:3000 collaborative-workspace
```

## API Endpoints

- **Health Check:** `GET /api/v1/health`
- **API Docs:** http://localhost:3000/api/docs (development only)

## Environment Variables

See `.env.example` for all available configuration options.

## License

UNLICENSED
