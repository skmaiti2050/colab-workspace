# Real-time Collaborative Workspace Backend

A production-grade NestJS backend service that powers real-time collaborative workspaces for developers. The system enables secure multi-user collaboration on projects with real-time synchronization, robust authentication, and scalable cloud-ready architecture.

## 🚀 Features

- **🔐 Multi-user Authentication**: JWT-based authentication with role-based access control (Owner, Collaborator, Viewer)
- **🏢 Workspace Management**: Create and manage collaborative workspaces with project organization
- **⚡ Real-time Collaboration**: WebSocket-based real-time updates for file changes, user presence, and cursor movements
- **🔄 Asynchronous Processing**: Background job processing with message queues for code execution and heavy tasks
- **🗄️ Multi-database Architecture**: PostgreSQL for structured data, Redis for caching and sessions
- **🛡️ Security-first Design**: Input validation, rate limiting, secure password hashing, and protection against common vulnerabilities

## 🏗️ Architecture Overview

### High-Level Architecture

```mermaid
graph TB
    Client[Client Applications] --> LB[Load Balancer]
    LB --> API[NestJS API Service]
    API --> Auth[Authentication Module]
    API --> WS[WebSocket Gateway]
    API --> Jobs[Job Processing Module]

    Auth --> DB[(PostgreSQL)]
    API --> DB
    Jobs --> Queue[Redis - BullMQ]
    WS --> PubSub[Redis - Pub/Sub]

    Jobs --> Worker[Background Workers]
    Worker --> Queue
    Worker --> DB

    API --> Cache[Redis - Cache]
```

### Core Modules

- **Authentication Module**: JWT-based auth with refresh tokens and RBAC
- **Workspace Module**: Multi-tenant workspace and project management
- **Collaboration Module**: Real-time WebSocket events and presence tracking
- **Job Processing Module**: Asynchronous background task processing
- **User Module**: User management and profile operations

## 🛠️ Tech Stack

- **Framework:** NestJS 11 with TypeScript 5.9
- **Database:** PostgreSQL 17 with TypeORM 0.3.28
- **Cache/Queue:** Redis with BullMQ and Socket.io adapter
- **Authentication:** JWT with Passport and bcrypt
- **Validation:** Zod + class-validator + class-transformer
- **Security:** Helmet + CORS + Rate limiting (@nestjs/throttler)
- **Documentation:** Swagger/OpenAPI
- **Testing:** Jest 30 + fast-check for property-based testing
- **Code Quality:** ESLint + Prettier + Husky + lint-staged

## 📋 Prerequisites

- **Node.js:** 22+ (minimum requirement)
- **npm:** 10+ (minimum requirement)
- **PostgreSQL:** 17+ (or NeonDB for cloud deployment)
- **Redis:** Latest (or Redis Cloud for production)
- **Docker:** Optional for local development

## 🚀 Quick Start

### Local Development

```bash
# Clone the repository
git clone <repository-url>
cd collaborative-workspace

# Install dependencies
npm install

# Copy environment template and configure
cp .env.example .env
# Edit .env with your database and Redis credentials

# Run database migrations
npm run migration:run

# Start development server with hot reload
npm run start:dev

# The API will be available at http://localhost:3000
# Swagger documentation at http://localhost:3000/api/docs
```

For detailed setup instructions including database configuration, production deployment, and troubleshooting, see the **[Setup Guide](docs/SETUP.md)**.

### Docker Development

```bash
# Start all services (PostgreSQL + Redis + App)
npm run docker:up

# View logs
npm run docker:logs

# Stop services
npm run docker:down
```

## 📁 Project Structure

```
src/
├── main.ts                 # Application bootstrap
├── app.module.ts           # Root module with all imports
├── app.controller.ts       # Health check endpoint
├── health-check.ts         # Health check utilities
├── config/                 # Configuration with Zod validation
│   ├── configuration.ts    # Main config schema
│   ├── database.config.ts  # Database configuration
│   └── redis.config.ts     # Redis configuration
├── auth/                   # Authentication module
│   ├── auth.module.ts
│   ├── auth.controller.ts  # Login, register, refresh endpoints
│   ├── auth.service.ts     # Authentication business logic
│   ├── jwt-auth.guard.ts   # JWT authentication guard
│   ├── jwt.strategy.ts     # Passport JWT strategy
│   ├── public.decorator.ts # Public endpoint decorator
│   └── user.decorator.ts   # Current user decorator
├── modules/                # Feature modules
│   ├── user/               # User management
│   ├── workspace/          # Workspace CRUD operations
│   ├── project/            # Project and file management
│   ├── collaboration/      # Real-time WebSocket events
│   └── job/                # Background job processing
├── entities/               # TypeORM database entities
│   ├── user.entity.ts
│   ├── workspace.entity.ts
│   ├── project.entity.ts
│   ├── workspace-member.entity.ts
│   ├── project-file.entity.ts
│   ├── collaboration-event.entity.ts
│   ├── job.entity.ts
│   └── index.ts            # Entity exports
├── dto/                    # Data Transfer Objects
│   ├── auth-response.dto.ts
│   ├── create-*.dto.ts     # Creation DTOs
│   ├── update-*.dto.ts     # Update DTOs
│   ├── *-response.dto.ts   # Response DTOs
│   └── index.ts            # DTO exports
├── interfaces/             # TypeScript interfaces
├── utils/                  # Utility functions
│   ├── password.util.ts    # Password hashing utilities
│   └── index.ts
├── validators/             # Custom validators
└── migrations/             # Database migrations
    └── *.ts                # Migration files
```

## 📖 Documentation

- **[Setup Guide](docs/SETUP.md)** - Complete setup instructions for development and production
- **[API Documentation](docs/API.md)** - Detailed API endpoint documentation with examples
- **[Deployment Guide](docs/DEPLOYMENT.md)** - Step-by-step deployment instructions for various environments
- **[Architecture Overview](docs/ARCHITECTURE.md)** - Detailed system architecture and design decisions
- **[Interactive API Docs](http://localhost:3000/api/docs)** - Swagger UI (development only)

### Core Endpoints

For detailed API documentation with request/response examples, see [docs/API.md](docs/API.md).

#### Authentication

```
POST   /api/v1/auth/register     # Register new user
POST   /api/v1/auth/login        # User login
POST   /api/v1/auth/refresh      # Refresh access token
POST   /api/v1/auth/logout       # User logout
```

#### Workspaces

```
GET    /api/v1/workspaces        # List user workspaces
POST   /api/v1/workspaces        # Create workspace
GET    /api/v1/workspaces/:id    # Get workspace details
PUT    /api/v1/workspaces/:id    # Update workspace
DELETE /api/v1/workspaces/:id    # Delete workspace
POST   /api/v1/workspaces/:id/invite  # Invite user to workspace
PUT    /api/v1/workspaces/:id/members/:userId/role  # Update member role
```

#### Projects

```
GET    /api/v1/projects          # List workspace projects
POST   /api/v1/projects          # Create project
GET    /api/v1/projects/:id      # Get project details
PUT    /api/v1/projects/:id      # Update project
DELETE /api/v1/projects/:id      # Delete project
POST   /api/v1/projects/:id/files     # Add file to project
PUT    /api/v1/projects/:id/files/:fileId  # Update project file
DELETE /api/v1/projects/:id/files/:fileId  # Delete project file
```

#### Jobs

```
POST   /api/v1/jobs              # Submit background job
GET    /api/v1/jobs/:id          # Get job status
GET    /api/v1/jobs/:id/result   # Get job result
```

#### Health Check

```
GET    /api/v1/health            # System health status
```

### WebSocket Events

#### Connection

```javascript
// Connect to workspace
socket.emit('join-workspace', { workspaceId: 'uuid' });

// Leave workspace
socket.emit('leave-workspace', { workspaceId: 'uuid' });
```

#### Real-time Events

```javascript
// File change events
socket.on('file-changed', (data) => {
  // Handle file change: { fileId, content, userId, timestamp }
});

// User presence events
socket.on('user-joined', (data) => {
  // Handle user join: { userId, username, timestamp }
});

socket.on('user-left', (data) => {
  // Handle user leave: { userId, timestamp }
});

// Cursor updates
socket.on('cursor-update', (data) => {
  // Handle cursor movement: { userId, position, fileId }
});
```

### Authentication

All protected endpoints require a Bearer token in the Authorization header:

```bash
curl -H "Authorization: Bearer <your-jwt-token>" \
     https://your-app.onrender.com/api/v1/workspaces
```

### Rate Limiting

- **Default:** 100 requests per 15 minutes per IP
- **Authentication endpoints:** 10 requests per 15 minutes per IP
- **WebSocket connections:** 5 connections per minute per IP

### Error Responses

All errors follow a consistent format:

```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "error": "Bad Request",
  "details": [
    {
      "field": "email",
      "message": "Invalid email format"
    }
  ]
}
```

## 🧪 Testing

### Running Tests

```bash
# Unit tests
npm test

# Unit tests with coverage
npm run test:cov

# Unit tests in watch mode
npm run test:watch

# End-to-end tests
npm run test:e2e

# Debug tests
npm run test:debug
```

### Test Structure

- **Unit Tests:** Co-located with source files (`*.spec.ts`)
- **E2E Tests:** Separate directory (`test/*.e2e-spec.ts`)
- **Property-Based Tests:** Using fast-check for comprehensive input testing
- **Coverage Target:** 70% minimum (branches, functions, lines, statements)

### Test Categories

1. **Unit Tests:** Individual component testing
2. **Integration Tests:** API endpoint testing
3. **Property-Based Tests:** Universal property validation
4. **E2E Tests:** Complete workflow testing

## 🔧 Available Scripts

### Development

```bash
npm run start:dev     # Start with hot reload
npm run start:debug   # Start with debugging
npm run build         # Build for production
npm run start:prod    # Run production build
```

### Testing

```bash
npm test              # Run unit tests
npm run test:watch    # Run tests in watch mode
npm run test:cov      # Run with coverage report
npm run test:e2e      # Run end-to-end tests
```

### Database

```bash
npm run migration:generate  # Generate new migration
npm run migration:run      # Run pending migrations
npm run migration:revert   # Revert last migration
npm run schema:sync        # Sync schema (dev only)
```

### Code Quality

```bash
npm run lint          # Lint and fix code
npm run format        # Format code with Prettier
npm run format:check  # Check formatting
```

### Docker

```bash
npm run docker:up     # Start all services
npm run docker:down   # Stop all services
npm run docker:logs   # View container logs
npm run docker:build  # Build Docker image
```

## 🚀 Deployment

### Cloud Deployment (Render + NeonDB + Redis Cloud)

This project is optimized for deployment on Render's free tier with managed databases.

#### Prerequisites

1. **Database:** Create a NeonDB PostgreSQL database at [neon.tech](https://neon.tech)
2. **Cache/Queue:** Set up Redis Cloud at [redis.com](https://redis.com)
3. **Hosting:** Deploy to Render using the included `render.yaml`

#### Step-by-Step Deployment

1. **Fork/Clone Repository**

   ```bash
   git clone <your-repository-url>
   cd collaborative-workspace
   ```

2. **Set Up NeonDB**
   - Create account at [neon.tech](https://neon.tech)
   - Create new database
   - Copy connection string (format: `postgresql://user:pass@host:port/db`)

3. **Set Up Redis Cloud**
   - Create account at [redis.com](https://redis.com)
   - Create new database
   - Note host, port, and password

4. **Deploy to Render**
   - Connect your GitHub repository to Render
   - Render will automatically detect `render.yaml`
   - Configure environment variables in Render dashboard

#### Required Environment Variables

```bash
# Database (NeonDB)
DATABASE_URL=postgresql://username:password@host:port/database

# Redis (Redis Cloud)
REDIS_HOST=your-redis-host.redis.cloud
REDIS_PORT=6379
REDIS_PASSWORD=your-redis-password

# JWT Secrets (generate secure random strings)
JWT_SECRET=your-super-secure-jwt-secret-min-32-chars
JWT_REFRESH_SECRET=your-super-secure-refresh-secret-min-32-chars

# Optional Configuration
NODE_ENV=production
PORT=10000
THROTTLE_TTL=60
THROTTLE_LIMIT=100
CORS_ORIGIN=https://your-frontend-domain.com
LOG_LEVEL=info
```

#### Deployment Configuration (`render.yaml`)

```yaml
services:
  - type: web
    name: collaborative-workspace-api
    runtime: node
    region: oregon
    plan: free
    buildCommand: npm ci && npm run build
    startCommand: npm run start:prod
    healthCheckPath: /api/v1/health
    envVars:
      - key: NODE_ENV
        value: production
      - key: PORT
        value: 10000
      # Add other environment variables in Render dashboard
```

#### Post-Deployment Steps

1. **Run Migrations**

   ```bash
   # Render will automatically run migrations during build
   # Or manually via Render shell:
   npm run migration:run
   ```

2. **Verify Deployment**
   - Check health endpoint: `https://your-app.onrender.com/api/v1/health`
   - Verify API documentation: `https://your-app.onrender.com/api/docs` (if enabled)

3. **Monitor Logs**
   - Use Render dashboard to monitor application logs
   - Set up log aggregation for production monitoring

### Local Docker Deployment

```bash
# Build and run with Docker Compose
npm run docker:up

# Or build single container
docker build -t collaborative-workspace .
docker run -p 3000:3000 \
  -e DATABASE_URL=postgresql://user:pass@host:port/db \
  -e REDIS_HOST=redis-host \
  collaborative-workspace
```

### Environment Configuration

#### Development (`.env`)

```bash
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://postgres:password@localhost:5432/collaborative_workspace
REDIS_HOST=localhost
REDIS_PORT=6379
JWT_SECRET=dev-secret-change-in-production
JWT_REFRESH_SECRET=dev-refresh-secret-change-in-production
```

#### Production

- Use environment variables in your hosting platform
- Never commit secrets to version control
- Use secure, randomly generated JWT secrets (minimum 32 characters)
- Enable SSL/TLS for database connections in production

## 🔄 CI/CD Pipeline

### GitHub Actions Workflows

The project includes automated CI/CD pipelines:

#### Main CI/CD Pipeline (`.github/workflows/ci-cd.yml`)

- **Triggers:** Push to main, pull requests
- **Steps:**
  1. Code quality checks (ESLint, Prettier)
  2. Security audit (npm audit)
  3. Unit and E2E tests
  4. Build verification
  5. Automatic deployment to Render (main branch only)

#### Security Monitoring (`.github/workflows/security-monitoring.yml`)

- **Triggers:** Daily schedule, manual dispatch
- **Steps:**
  1. Dependency vulnerability scanning
  2. Security audit reporting
  3. Automated dependency updates (Dependabot)

#### Manual Deployment (`.github/workflows/manual-deployment.yml`)

- **Triggers:** Manual dispatch
- **Features:**
  - Environment selection (staging/production)
  - Optional test skipping for emergency deployments
  - Deployment verification

### Deployment Best Practices

1. **Environment Separation:** Use different databases for dev/staging/production
2. **Secret Management:** Use platform-specific secret management (Render environment variables)
3. **Health Checks:** Monitor `/api/v1/health` endpoint for service health
4. **Logging:** Configure structured logging for production debugging
5. **Monitoring:** Set up alerts for error rates and response times

## 🔧 Troubleshooting Guide

### Common Issues and Solutions

#### Database Connection Issues

**Problem:** `ECONNREFUSED` or database connection timeout

```
Error: connect ECONNREFUSED 127.0.0.1:5432
```

**Solutions:**

1. **Check Database Status**

   ```bash
   # For local PostgreSQL
   sudo systemctl status postgresql
   sudo systemctl start postgresql

   # For Docker
   docker-compose ps
   docker-compose up -d postgres
   ```

2. **Verify Connection String**

   ```bash
   # Test connection manually
   psql "postgresql://username:password@host:port/database"
   ```

3. **Check Environment Variables**
   ```bash
   # Verify .env file exists and has correct values
   cat .env | grep DATABASE
   ```

#### Redis Connection Issues

**Problem:** Redis connection failures or job queue not working

```
Error: connect ECONNREFUSED 127.0.0.1:6379
```

**Solutions:**

1. **Start Redis Server**

   ```bash
   # Local Redis
   redis-server

   # Docker
   docker run -d -p 6379:6379 redis:alpine
   ```

2. **Test Redis Connection**

   ```bash
   redis-cli ping
   # Should return: PONG
   ```

3. **Check Redis Configuration**
   ```bash
   # Verify Redis environment variables
   cat .env | grep REDIS
   ```

#### JWT Authentication Issues

**Problem:** `401 Unauthorized` errors or token validation failures

**Solutions:**

1. **Check JWT Secrets**

   ```bash
   # Ensure JWT secrets are set and consistent
   echo $JWT_SECRET
   echo $JWT_REFRESH_SECRET
   ```

2. **Verify Token Format**

   ```javascript
   // Correct Authorization header format
   Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

3. **Check Token Expiration**
   ```bash
   # Decode JWT to check expiration (use jwt.io)
   # Or refresh token if expired
   curl -X POST /api/v1/auth/refresh \
        -H "Content-Type: application/json" \
        -d '{"refreshToken": "your-refresh-token"}'
   ```

#### WebSocket Connection Issues

**Problem:** Real-time features not working or WebSocket connection failures

**Solutions:**

1. **Check CORS Configuration**

   ```typescript
   // Ensure WebSocket CORS is properly configured
   WEBSOCKET_CORS_ORIGIN=http://localhost:3000
   ```

2. **Verify Socket.io Client Version**

   ```javascript
   // Ensure client version matches server
   npm install socket.io-client@^4.8.3
   ```

3. **Test WebSocket Connection**
   ```javascript
   const socket = io('http://localhost:3000');
   socket.on('connect', () => console.log('Connected'));
   socket.on('disconnect', () => console.log('Disconnected'));
   ```

#### Migration Issues

**Problem:** Database schema out of sync or migration failures

**Solutions:**

1. **Check Migration Status**

   ```bash
   npm run migration:show
   ```

2. **Run Pending Migrations**

   ```bash
   npm run migration:run
   ```

3. **Reset Database (Development Only)**
   ```bash
   # WARNING: This will delete all data
   npm run schema:drop
   npm run migration:run
   ```

#### Performance Issues

**Problem:** Slow API responses or high memory usage

**Solutions:**

1. **Check Database Indexes**

   ```sql
   -- Verify indexes exist
   \d+ users
   \d+ workspaces
   \d+ projects
   ```

2. **Monitor Memory Usage**

   ```bash
   # Check Node.js memory usage
   node --inspect dist/main.js
   # Open chrome://inspect in Chrome
   ```

3. **Enable Query Logging**
   ```typescript
   // In database.config.ts
   logging: true,
   logger: 'advanced-console',
   ```

#### Build and Deployment Issues

**Problem:** Build failures or deployment errors

**Solutions:**

1. **Clear Node Modules**

   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

2. **Check Node.js Version**

   ```bash
   node --version  # Should be 22+
   npm --version   # Should be 10+
   ```

3. **Verify TypeScript Compilation**

   ```bash
   npm run build
   # Check for TypeScript errors
   ```

4. **Check Environment Variables**
   ```bash
   # Ensure all required variables are set
   npm run start:prod
   ```

### Development Issues

#### Hot Reload Not Working

**Problem:** Changes not reflected during development

**Solutions:**

1. **Restart Development Server**

   ```bash
   npm run start:dev
   ```

2. **Check File Watchers**
   ```bash
   # Increase file watcher limit (Linux)
   echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf
   sudo sysctl -p
   ```

#### Test Failures

**Problem:** Tests failing unexpectedly

**Solutions:**

1. **Clear Jest Cache**

   ```bash
   npm test -- --clearCache
   ```

2. **Run Tests in Isolation**

   ```bash
   npm test -- --runInBand
   ```

3. **Check Test Database**
   ```bash
   # Ensure test database is separate
   NODE_ENV=test npm run migration:run
   ```

### Production Issues

#### Health Check Failures

**Problem:** `/api/v1/health` endpoint returning unhealthy status

**Solutions:**

1. **Check Service Dependencies**

   ```bash
   # Verify database and Redis connections
   curl https://your-app.onrender.com/api/v1/health
   ```

2. **Review Application Logs**
   ```bash
   # Check Render logs or application logs
   tail -f logs/error.log
   ```

#### High Error Rates

**Problem:** Increased 5xx errors in production

**Solutions:**

1. **Check Resource Limits**
   - Monitor memory usage
   - Check database connection pool
   - Verify Redis connection limits

2. **Review Error Logs**

   ```bash
   # Look for patterns in error logs
   grep "ERROR" logs/combined.log | tail -100
   ```

3. **Scale Resources**
   - Upgrade Render plan if needed
   - Optimize database queries
   - Implement caching strategies

### Getting Help

If you're still experiencing issues:

1. **Check Application Logs**

   ```bash
   # Development
   npm run start:dev

   # Production
   tail -f logs/combined.log
   ```

2. **Enable Debug Logging**

   ```bash
   LOG_LEVEL=debug npm run start:dev
   ```

3. **Create Issue Report**
   Include the following information:
   - Node.js version (`node --version`)
   - npm version (`npm --version`)
   - Operating system
   - Error messages and stack traces
   - Steps to reproduce the issue

4. **Community Resources**
   - [NestJS Documentation](https://docs.nestjs.com/)
   - [TypeORM Documentation](https://typeorm.io/)
   - [Socket.io Documentation](https://socket.io/docs/)

## 🤝 Contributing

### Development Setup

1. **Fork and Clone**

   ```bash
   git clone https://github.com/skmaiti2050/colab-workspace.git
   cd collaborative-workspace
   ```

2. **Install Dependencies**

   ```bash
   npm install
   ```

3. **Set Up Environment**

   ```bash
   cp .env.example .env
   # Edit .env with your local configuration
   ```

4. **Run Database Migrations**

   ```bash
   npm run migration:run
   ```

5. **Start Development Server**
   ```bash
   npm run start:dev
   ```

### Code Quality Standards

- **TypeScript:** Strict mode enabled with comprehensive type checking
- **ESLint:** Enforced code style and best practices
- **Prettier:** Consistent code formatting
- **Husky:** Pre-commit hooks for quality assurance
- **Conventional Commits:** Standardized commit message format

### Testing Requirements

- **Unit Tests:** Required for all new features
- **Integration Tests:** Required for API endpoints
- **Property-Based Tests:** Recommended for complex business logic
- **Coverage:** Minimum 70% coverage required

### Pull Request Process

1. **Create Feature Branch**

   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make Changes**
   - Follow existing code patterns
   - Add tests for new functionality
   - Update documentation as needed

3. **Run Quality Checks**

   ```bash
   npm run lint
   npm run format
   npm test
   npm run test:e2e
   ```

4. **Commit Changes**

   ```bash
   git add .
   git commit -m "feat: add new feature description"
   ```

5. **Push and Create PR**
   ```bash
   git push origin feature/your-feature-name
   # Create pull request on GitHub
   ```

## 📄 License

This project is licensed under the UNLICENSED license - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [NestJS](https://nestjs.com/) - Progressive Node.js framework
- [TypeORM](https://typeorm.io/) - Object-Relational Mapping
- [Socket.io](https://socket.io/) - Real-time communication
- [BullMQ](https://bullmq.io/) - Background job processing
- [Render](https://render.com/) - Cloud hosting platform
- [NeonDB](https://neon.tech/) - Serverless PostgreSQL
- [Redis Cloud](https://redis.com/) - Managed Redis service

---

**Built with ❤️ using NestJS and TypeScript**
