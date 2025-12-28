# Setup Guide

This guide will help you set up the Collaborative Workspace Backend for development and production environments.

## Table of Contents

- [Development Setup](#development-setup)
- [Production Setup](#production-setup)
- [Docker Setup](#docker-setup)
- [Environment Configuration](#environment-configuration)
- [Database Setup](#database-setup)
- [Testing Setup](#testing-setup)
- [IDE Configuration](#ide-configuration)

## Development Setup

### Prerequisites

Ensure you have the following installed:

- **Node.js:** 22+ ([Download](https://nodejs.org/))
- **npm:** 10+ (comes with Node.js)
- **PostgreSQL:** 17+ ([Download](https://www.postgresql.org/download/))
- **Redis:** Latest ([Download](https://redis.io/download))
- **Git:** Latest ([Download](https://git-scm.com/downloads))

### Step 1: Clone Repository

```bash
# Clone the repository
git clone <repository-url>
cd collaborative-workspace

# Verify Node.js version
node --version  # Should be 22+
npm --version   # Should be 10+
```

### Step 2: Install Dependencies

```bash
# Install all dependencies
npm install

# Verify installation
npm list --depth=0
```

### Step 3: Environment Configuration

```bash
# Copy environment template
cp .env.example .env

# Edit environment variables
nano .env  # or use your preferred editor
```

**Required Environment Variables:**

```bash
# Application
NODE_ENV=development
PORT=3000

# Database
DATABASE_URL=postgresql://postgres:password@localhost:5432/collaborative_workspace
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USERNAME=postgres
DATABASE_PASSWORD=password
DATABASE_NAME=collaborative_workspace
DATABASE_SSL=false

# Redis
REDIS_URL=redis://localhost:6379
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-in-production
JWT_REFRESH_EXPIRES_IN=7d

# Security
THROTTLE_TTL=60
THROTTLE_LIMIT=10
CORS_ORIGIN=*

# Logging
LOG_LEVEL=info
```

### Step 4: Database Setup

#### Option A: Local PostgreSQL

1. **Install PostgreSQL**

   ```bash
   # Ubuntu/Debian
   sudo apt update
   sudo apt install postgresql postgresql-contrib

   # macOS (using Homebrew)
   brew install postgresql
   brew services start postgresql

   # Windows
   # Download installer from https://www.postgresql.org/download/windows/
   ```

2. **Create Database and User**

   ```bash
   # Connect to PostgreSQL
   sudo -u postgres psql

   # Create database and user
   CREATE DATABASE collaborative_workspace;
   CREATE USER app_user WITH PASSWORD 'secure_password';
   GRANT ALL PRIVILEGES ON DATABASE collaborative_workspace TO app_user;
   \q
   ```

3. **Update Environment Variables**
   ```bash
   DATABASE_URL=postgresql://app_user:secure_password@localhost:5432/collaborative_workspace
   ```

#### Option B: Docker PostgreSQL

```bash
# Run PostgreSQL in Docker
docker run --name postgres-dev \
  -e POSTGRES_DB=collaborative_workspace \
  -e POSTGRES_USER=app_user \
  -e POSTGRES_PASSWORD=secure_password \
  -p 5432:5432 \
  -d postgres:17-alpine

# Verify connection
docker exec -it postgres-dev psql -U app_user -d collaborative_workspace
```

### Step 5: Redis Setup

#### Option A: Local Redis

1. **Install Redis**

   ```bash
   # Ubuntu/Debian
   sudo apt install redis-server
   sudo systemctl start redis-server

   # macOS (using Homebrew)
   brew install redis
   brew services start redis

   # Windows
   # Use Docker or WSL
   ```

2. **Test Connection**
   ```bash
   redis-cli ping
   # Should return: PONG
   ```

#### Option B: Docker Redis

```bash
# Run Redis in Docker
docker run --name redis-dev \
  -p 6379:6379 \
  -d redis:alpine

# Test connection
docker exec -it redis-dev redis-cli ping
```

### Step 6: Run Database Migrations

```bash
# Run migrations to create database schema
npm run migration:run

# Verify tables were created
psql $DATABASE_URL -c "\dt"
```

### Step 7: Start Development Server

```bash
# Start development server with hot reload
npm run start:dev

# The server will start on http://localhost:3000
# API documentation available at http://localhost:3000/api/docs
```

### Step 8: Verify Setup

1. **Health Check**

   ```bash
   curl http://localhost:3000/api/v1/health
   ```

2. **Expected Response**

   ```json
   {
     "status": "healthy",
     "timestamp": "2025-01-01T00:00:00.000Z",
     "services": {
       "database": { "status": "healthy" },
       "redis": { "status": "healthy" },
       "jobQueue": { "status": "healthy" }
     }
   }
   ```

3. **API Documentation**
   - Open http://localhost:3000/api/docs in your browser
   - You should see the Swagger UI with all API endpoints

## Production Setup

### Prerequisites

- **Server:** Linux server with root access
- **Domain:** Optional, for custom domain setup
- **SSL Certificate:** Let's Encrypt or commercial certificate

### Step 1: Server Preparation

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Install Node.js 22
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PostgreSQL
sudo apt install postgresql postgresql-contrib

# Install Redis
sudo apt install redis-server

# Install PM2 for process management
sudo npm install -g pm2
```

### Step 2: Application Deployment

```bash
# Clone repository
git clone <repository-url> /opt/collaborative-workspace
cd /opt/collaborative-workspace

# Install dependencies (production only)
npm ci --only=production

# Build application
npm run build

# Set up environment
cp .env.example .env
# Edit .env with production values
```

### Step 3: Database Configuration

```bash
# Create production database
sudo -u postgres createdb collaborative_workspace_prod
sudo -u postgres createuser --pwprompt app_user

# Grant permissions
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE collaborative_workspace_prod TO app_user;"

# Run migrations
NODE_ENV=production npm run migration:run
```

### Step 4: Process Management

```bash
# Create PM2 ecosystem file
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'collaborative-workspace',
    script: 'dist/main.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
};
EOF

# Start application
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### Step 5: Reverse Proxy (Nginx)

```bash
# Install Nginx
sudo apt install nginx

# Create Nginx configuration
sudo tee /etc/nginx/sites-available/collaborative-workspace << EOF
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

# Enable site
sudo ln -s /etc/nginx/sites-available/collaborative-workspace /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### Step 6: SSL Certificate (Let's Encrypt)

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Obtain SSL certificate
sudo certbot --nginx -d your-domain.com

# Verify auto-renewal
sudo certbot renew --dry-run
```

## Docker Setup

### Development with Docker Compose

1. **Start All Services**

   ```bash
   # Start PostgreSQL, Redis, and application
   npm run docker:up

   # View logs
   npm run docker:logs

   # Stop services
   npm run docker:down
   ```

2. **Individual Services**

   ```bash
   # Start only database services
   docker-compose up -d postgres redis

   # Start application separately
   npm run start:dev
   ```

### Production Docker Deployment

1. **Build Production Image**

   ```bash
   # Build optimized production image
   docker build -t collaborative-workspace:latest .

   # Run production container
   docker run -d \
     --name collaborative-workspace-prod \
     -p 3000:3000 \
     -e NODE_ENV=production \
     -e DATABASE_URL=postgresql://user:pass@host:port/db \
     -e REDIS_HOST=redis-host \
     collaborative-workspace:latest
   ```

2. **Docker Compose Production**

   ```yaml
   # docker-compose.prod.yml
   version: '3.8'
   services:
     app:
       build: .
       ports:
         - '3000:3000'
       environment:
         - NODE_ENV=production
         - DATABASE_URL=${DATABASE_URL}
         - REDIS_HOST=redis
       depends_on:
         - postgres
         - redis
       restart: unless-stopped

     postgres:
       image: postgres:17-alpine
       environment:
         POSTGRES_DB: collaborative_workspace
         POSTGRES_USER: ${DB_USER}
         POSTGRES_PASSWORD: ${DB_PASSWORD}
       volumes:
         - postgres_data:/var/lib/postgresql/data
       restart: unless-stopped

     redis:
       image: redis:alpine
       command: redis-server --requirepass ${REDIS_PASSWORD}
       restart: unless-stopped

   volumes:
     postgres_data:
   ```

## Environment Configuration

### Development Environment

```bash
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://postgres:password@localhost:5432/collaborative_workspace
REDIS_HOST=localhost
REDIS_PORT=6379
JWT_SECRET=dev-secret-change-in-production
JWT_REFRESH_SECRET=dev-refresh-secret-change-in-production
THROTTLE_LIMIT=100
CORS_ORIGIN=*
LOG_LEVEL=debug
```

### Production Environment

```bash
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://user:secure_pass@prod-host:5432/collaborative_workspace?sslmode=require
REDIS_HOST=prod-redis-host
REDIS_PORT=6379
REDIS_PASSWORD=secure_redis_password
JWT_SECRET=super-secure-jwt-secret-min-32-characters
JWT_REFRESH_SECRET=super-secure-refresh-secret-min-32-characters
THROTTLE_LIMIT=100
CORS_ORIGIN=https://your-frontend-domain.com
LOG_LEVEL=info
```

### Environment Variable Validation

The application uses Zod for environment variable validation. Invalid configurations will prevent startup with clear error messages.

## Database Setup

### Migration Commands

```bash
# Generate new migration
npm run migration:generate -- -n MigrationName

# Run pending migrations
npm run migration:run

# Revert last migration
npm run migration:revert

# Show migration status
npm run migration:show

# Sync schema (development only - destructive)
npm run schema:sync
```

### Database Seeding (Optional)

Create a seed script for development data:

```typescript
// scripts/seed.ts
import { DataSource } from 'typeorm';
import { User } from '../src/entities/user.entity';
import { Workspace } from '../src/entities/workspace.entity';

async function seed() {
  const dataSource = new DataSource({
    // ... database configuration
  });

  await dataSource.initialize();

  // Create test users
  const userRepository = dataSource.getRepository(User);
  const testUser = userRepository.create({
    email: 'test@example.com',
    name: 'Test User',
    passwordHash: 'hashed_password',
  });
  await userRepository.save(testUser);

  // Create test workspace
  const workspaceRepository = dataSource.getRepository(Workspace);
  const testWorkspace = workspaceRepository.create({
    name: 'Test Workspace',
    description: 'A workspace for testing',
    ownerId: testUser.id,
  });
  await workspaceRepository.save(testWorkspace);

  console.log('Database seeded successfully');
  await dataSource.destroy();
}

seed().catch(console.error);
```

## Testing Setup

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

### Test Database Setup

```bash
# Create test database
createdb collaborative_workspace_test

# Set test environment
export NODE_ENV=test
export DATABASE_URL=postgresql://postgres:password@localhost:5432/collaborative_workspace_test

# Run migrations for test database
npm run migration:run
```

### Test Configuration

```typescript
// test/setup.ts
import { Test } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';

export async function createTestingModule() {
  const module = await Test.createTestingModule({
    imports: [
      ConfigModule.forRoot({
        envFilePath: '.env.test',
      }),
      TypeOrmModule.forRoot({
        type: 'postgres',
        url: process.env.DATABASE_URL,
        entities: [__dirname + '/../src/**/*.entity{.ts,.js}'],
        synchronize: true, // Only for testing
      }),
    ],
  }).compile();

  return module;
}
```

## IDE Configuration

### Visual Studio Code

1. **Recommended Extensions**

   ```json
   {
     "recommendations": [
       "ms-vscode.vscode-typescript-next",
       "esbenp.prettier-vscode",
       "ms-vscode.vscode-eslint",
       "bradlc.vscode-tailwindcss",
       "ms-vscode.vscode-json"
     ]
   }
   ```

2. **Settings**

   ```json
   {
     "editor.formatOnSave": true,
     "editor.defaultFormatter": "esbenp.prettier-vscode",
     "typescript.preferences.importModuleSpecifier": "relative",
     "eslint.format.enable": true
   }
   ```

3. **Debug Configuration**
   ```json
   {
     "type": "node",
     "request": "launch",
     "name": "Debug NestJS",
     "program": "${workspaceFolder}/src/main.ts",
     "outFiles": ["${workspaceFolder}/dist/**/*.js"],
     "runtimeArgs": ["-r", "ts-node/register"],
     "env": {
       "NODE_ENV": "development"
     }
   }
   ```

### IntelliJ IDEA / WebStorm

1. **TypeScript Configuration**
   - Enable TypeScript service
   - Set TypeScript version to project version
   - Enable ESLint integration

2. **Run Configurations**
   - Create Node.js run configuration
   - Set working directory to project root
   - Add environment variables from .env

## Troubleshooting

### Common Setup Issues

1. **Node.js Version Issues**

   ```bash
   # Check version
   node --version

   # Use nvm to manage versions
   nvm install 22
   nvm use 22
   ```

2. **Database Connection Issues**

   ```bash
   # Test PostgreSQL connection
   psql $DATABASE_URL

   # Check PostgreSQL status
   sudo systemctl status postgresql
   ```

3. **Redis Connection Issues**

   ```bash
   # Test Redis connection
   redis-cli ping

   # Check Redis status
   sudo systemctl status redis
   ```

4. **Port Already in Use**

   ```bash
   # Find process using port 3000
   lsof -i :3000

   # Kill process
   kill -9 <PID>
   ```

5. **Permission Issues**

   ```bash
   # Fix npm permissions
   sudo chown -R $(whoami) ~/.npm

   # Fix file permissions
   chmod +x scripts/*.sh
   ```

For more troubleshooting information, see the [main README troubleshooting section](../README.md#troubleshooting-guide).

## Next Steps

After completing the setup:

1. **Explore the API**
   - Visit http://localhost:3000/api/docs
   - Test endpoints with Swagger UI

2. **Run Tests**
   - Execute the test suite to verify everything works
   - Check test coverage

3. **Start Development**
   - Create your first workspace via API
   - Test real-time collaboration features
   - Explore the codebase structure

4. **Deploy to Production**
   - Follow the [Deployment Guide](DEPLOYMENT.md)
   - Set up monitoring and logging
   - Configure CI/CD pipeline
