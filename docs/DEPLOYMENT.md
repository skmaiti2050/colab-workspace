# Deployment Guide

This guide covers deploying the Collaborative Workspace Backend to various environments.

## Table of Contents

- [Cloud Deployment (Render)](#cloud-deployment-render)
- [Docker Deployment](#docker-deployment)
- [Local Production Setup](#local-production-setup)
- [Environment Configuration](#environment-configuration)
- [Database Setup](#database-setup)
- [Monitoring and Maintenance](#monitoring-and-maintenance)

## Cloud Deployment (Render)

### Prerequisites

1. **GitHub Repository:** Fork or clone this repository
2. **Render Account:** Sign up at [render.com](https://render.com)
3. **NeonDB Account:** Sign up at [neon.tech](https://neon.tech)
4. **Redis Cloud Account:** Sign up at [redis.com](https://redis.com)

### Step 1: Set Up Database (NeonDB)

1. **Create NeonDB Database**
   - Go to [neon.tech](https://neon.tech)
   - Create a new project
   - Create a database named `collaborative_workspace`
   - Copy the connection string

2. **Connection String Format**
   ```
   postgresql://username:password@hostname:port/database?sslmode=require
   ```

### Step 2: Set Up Redis (Redis Cloud)

1. **Create Redis Database**
   - Go to [redis.com](https://redis.com)
   - Create a new subscription (free tier available)
   - Create a database
   - Note the host, port, and password

### Step 3: Deploy to Render

1. **Connect Repository**
   - Go to Render dashboard
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Render will detect the `render.yaml` file

2. **Configure Environment Variables**

   In the Render dashboard, add these environment variables:

   ```bash
   # Database
   DATABASE_URL=postgresql://username:password@hostname:port/database?sslmode=require

   # Redis
   REDIS_HOST=your-redis-host.redis.cloud
   REDIS_PORT=6379
   REDIS_PASSWORD=your-redis-password

   # JWT Secrets (generate secure random strings)
   JWT_SECRET=your-super-secure-jwt-secret-min-32-chars
   JWT_REFRESH_SECRET=your-super-secure-refresh-secret-min-32-chars

   # Application
   NODE_ENV=production
   PORT=10000

   # Security
   THROTTLE_TTL=60
   THROTTLE_LIMIT=100
   CORS_ORIGIN=https://your-frontend-domain.com

   # Logging
   LOG_LEVEL=info
   ```

3. **Deploy**
   - Click "Create Web Service"
   - Render will automatically build and deploy your application
   - The build process includes running migrations

### Step 4: Verify Deployment

1. **Check Health Endpoint**

   ```bash
   curl https://your-app.onrender.com/api/v1/health
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

## Docker Deployment

### Local Docker Development

1. **Using Docker Compose (Recommended)**

   ```bash
   # Start all services
   npm run docker:up

   # View logs
   npm run docker:logs

   # Stop services
   npm run docker:down
   ```

2. **Manual Docker Build**

   ```bash
   # Build image
   docker build -t collaborative-workspace .

   # Run container
   docker run -p 3000:3000 \
     -e DATABASE_URL=postgresql://user:pass@host:port/db \
     -e REDIS_HOST=redis-host \
     -e JWT_SECRET=your-secret \
     collaborative-workspace
   ```

### Production Docker Deployment

1. **Multi-stage Build**

   ```dockerfile
   # Build stage
   FROM node:22-alpine AS builder
   WORKDIR /app
   COPY package*.json ./
   RUN npm ci --only=production

   # Production stage
   FROM node:22-alpine AS production
   WORKDIR /app
   COPY --from=builder /app/node_modules ./node_modules
   COPY dist ./dist
   EXPOSE 3000
   CMD ["node", "dist/main"]
   ```

2. **Docker Compose for Production**

   ```yaml
   version: '3.8'
   services:
     app:
       build: .
       ports:
         - '3000:3000'
       environment:
         - NODE_ENV=production
         - DATABASE_URL=${DATABASE_URL}
         - REDIS_HOST=${REDIS_HOST}
       depends_on:
         - postgres
         - redis

     postgres:
       image: postgres:17-alpine
       environment:
         POSTGRES_DB: collaborative_workspace
         POSTGRES_USER: ${DB_USER}
         POSTGRES_PASSWORD: ${DB_PASSWORD}
       volumes:
         - postgres_data:/var/lib/postgresql/data

     redis:
       image: redis:alpine
       command: redis-server --requirepass ${REDIS_PASSWORD}

   volumes:
     postgres_data:
   ```

## Local Production Setup

### Prerequisites

- Node.js 22+
- PostgreSQL 17+
- Redis 6+

### Setup Steps

1. **Install Dependencies**

   ```bash
   npm ci --only=production
   ```

2. **Build Application**

   ```bash
   npm run build
   ```

3. **Set Environment Variables**

   ```bash
   export NODE_ENV=production
   export DATABASE_URL=postgresql://user:pass@localhost:5432/db
   export REDIS_HOST=localhost
   export JWT_SECRET=your-secure-secret
   export JWT_REFRESH_SECRET=your-secure-refresh-secret
   ```

4. **Run Migrations**

   ```bash
   npm run migration:run
   ```

5. **Start Application**
   ```bash
   npm run start:prod
   ```

## Environment Configuration

### Required Environment Variables

| Variable             | Description                  | Example                               |
| -------------------- | ---------------------------- | ------------------------------------- |
| `NODE_ENV`           | Environment mode             | `production`                          |
| `PORT`               | Server port                  | `3000`                                |
| `DATABASE_URL`       | PostgreSQL connection string | `postgresql://user:pass@host:port/db` |
| `REDIS_HOST`         | Redis host                   | `localhost`                           |
| `REDIS_PORT`         | Redis port                   | `6379`                                |
| `REDIS_PASSWORD`     | Redis password               | `your-password`                       |
| `JWT_SECRET`         | JWT signing secret           | `your-secure-secret-min-32-chars`     |
| `JWT_REFRESH_SECRET` | Refresh token secret         | `your-secure-refresh-secret`          |

### Optional Environment Variables

| Variable                 | Description                 | Default |
| ------------------------ | --------------------------- | ------- |
| `JWT_EXPIRES_IN`         | Access token expiration     | `15m`   |
| `JWT_REFRESH_EXPIRES_IN` | Refresh token expiration    | `7d`    |
| `THROTTLE_TTL`           | Rate limit window (seconds) | `60`    |
| `THROTTLE_LIMIT`         | Requests per window         | `100`   |
| `CORS_ORIGIN`            | Allowed CORS origins        | `*`     |
| `LOG_LEVEL`              | Logging level               | `info`  |

### Security Considerations

1. **JWT Secrets**
   - Use cryptographically secure random strings
   - Minimum 32 characters
   - Different secrets for access and refresh tokens

2. **Database Security**
   - Use SSL connections in production
   - Restrict database access to application servers
   - Regular security updates

3. **Redis Security**
   - Use password authentication
   - Restrict network access
   - Enable SSL/TLS if available

## Database Setup

### PostgreSQL Setup

1. **Create Database**

   ```sql
   CREATE DATABASE collaborative_workspace;
   CREATE USER app_user WITH PASSWORD 'secure_password';
   GRANT ALL PRIVILEGES ON DATABASE collaborative_workspace TO app_user;
   ```

2. **Run Migrations**

   ```bash
   npm run migration:run
   ```

3. **Verify Schema**
   ```sql
   \c collaborative_workspace
   \dt
   ```

### Redis Setup

1. **Install Redis**

   ```bash
   # Ubuntu/Debian
   sudo apt install redis-server

   # macOS
   brew install redis

   # Docker
   docker run -d -p 6379:6379 redis:alpine
   ```

2. **Configure Redis**

   ```bash
   # Edit redis.conf
   requirepass your-secure-password
   maxmemory 256mb
   maxmemory-policy allkeys-lru
   ```

3. **Test Connection**
   ```bash
   redis-cli ping
   # Should return: PONG
   ```

## Monitoring and Maintenance

### Health Monitoring

1. **Health Check Endpoint**

   ```bash
   curl https://your-app.onrender.com/api/v1/health
   ```

2. **Automated Monitoring**

   ```bash
   # Set up monitoring script
   #!/bin/bash
   HEALTH_URL="https://your-app.onrender.com/api/v1/health"

   if curl -f $HEALTH_URL > /dev/null 2>&1; then
     echo "Service is healthy"
   else
     echo "Service is unhealthy"
     # Send alert
   fi
   ```

### Log Management

1. **Application Logs**

   ```bash
   # View logs in production
   tail -f logs/combined.log
   tail -f logs/error.log
   ```

2. **Log Rotation**
   ```bash
   # Set up logrotate
   /path/to/app/logs/*.log {
     daily
     rotate 30
     compress
     delaycompress
     missingok
     notifempty
   }
   ```

### Database Maintenance

1. **Backup Database**

   ```bash
   pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql
   ```

2. **Monitor Database Performance**

   ```sql
   -- Check active connections
   SELECT count(*) FROM pg_stat_activity;

   -- Check slow queries
   SELECT query, mean_time, calls
   FROM pg_stat_statements
   ORDER BY mean_time DESC
   LIMIT 10;
   ```

### Performance Optimization

1. **Database Optimization**
   - Monitor query performance
   - Add indexes for frequently queried columns
   - Use connection pooling

2. **Redis Optimization**
   - Monitor memory usage
   - Set appropriate TTL for cached data
   - Use Redis clustering for high availability

3. **Application Optimization**
   - Monitor memory usage
   - Profile CPU usage
   - Optimize database queries

### Scaling Considerations

1. **Horizontal Scaling**
   - Use stateless application design
   - Implement Redis for session storage
   - Use load balancers

2. **Database Scaling**
   - Read replicas for read-heavy workloads
   - Connection pooling
   - Query optimization

3. **Caching Strategy**
   - Implement multi-layer caching
   - Use CDN for static assets
   - Cache frequently accessed data

## Troubleshooting

### Common Deployment Issues

1. **Build Failures**

   ```bash
   # Check Node.js version
   node --version  # Should be 22+

   # Clear cache and reinstall
   rm -rf node_modules package-lock.json
   npm install
   ```

2. **Database Connection Issues**

   ```bash
   # Test connection
   psql $DATABASE_URL

   # Check SSL requirements
   psql "$DATABASE_URL?sslmode=require"
   ```

3. **Redis Connection Issues**
   ```bash
   # Test Redis connection
   redis-cli -h $REDIS_HOST -p $REDIS_PORT -a $REDIS_PASSWORD ping
   ```

### Performance Issues

1. **High Memory Usage**
   - Monitor Node.js heap usage
   - Check for memory leaks
   - Optimize database queries

2. **Slow Response Times**
   - Enable query logging
   - Monitor database performance
   - Implement caching

3. **High CPU Usage**
   - Profile application performance
   - Optimize algorithms
   - Scale horizontally

For more troubleshooting information, see the main [README.md](../README.md#troubleshooting-guide).
