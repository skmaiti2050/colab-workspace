# Deployment Guide

## GitHub Actions CI/CD Setup

This project uses GitHub Actions for continuous integration and deployment to Render.com.

### Required Secrets

Configure the following secrets in your GitHub repository settings (`Settings > Secrets and variables > Actions`):

#### Render Deployment Secrets

- `RENDER_SERVICE_ID`: Your Render service ID (found in Render dashboard)
- `RENDER_API_KEY`: Your Render API key (generate in Render account settings)
- `RENDER_APP_URL`: Your deployed application URL (e.g., `https://your-app.onrender.com`)

#### Optional Secrets

- `CODECOV_TOKEN`: Token for code coverage reporting (if using Codecov)

### Environment Variables

The following environment variables are configured in `render.yaml` and should be set in your Render service:

#### Required Production Variables

```bash
NODE_ENV=production
PORT=10000
DATABASE_URL=postgresql://username:password@host:port/database
JWT_SECRET=your-super-secure-jwt-secret-key
JWT_REFRESH_SECRET=your-super-secure-refresh-secret-key
REDIS_HOST=your-redis-host
REDIS_PORT=6379
REDIS_PASSWORD=your-redis-password
```

#### Optional Configuration Variables

```bash
THROTTLE_TTL=60
THROTTLE_LIMIT=100
CORS_ORIGIN=*
LOG_LEVEL=info
```

### Workflow Overview

#### 1. Main CI/CD Pipeline (`ci-cd.yml`)

Triggers on:

- Push to `main` or `develop` branches
- Pull requests to `main` branch

Jobs:

1. **Lint**: ESLint and Prettier formatting checks
2. **Security**: npm audit for vulnerability scanning
3. **Test**: Unit and E2E tests with PostgreSQL and Redis services
4. **Build**: Application build and artifact upload
5. **Deploy**: Automatic deployment to Render (main branch only)
6. **Health Check**: Post-deployment health verification

#### 2. Security Monitoring (`security-monitoring.yml`)

Triggers on:

- Daily schedule (2 AM UTC)
- Manual dispatch

Jobs:

- Daily security audits
- Dependency vulnerability scanning
- Dependency review for pull requests

#### 3. Manual Deployment (`manual-deployment.yml`)

Triggers on:

- Manual workflow dispatch

Features:

- Environment selection (production/staging)
- Optional test skipping for emergencies
- Deployment reason tracking
- Actor identification

### Dependabot Configuration

Automated dependency updates are configured for:

- npm packages (weekly, grouped by type)
- GitHub Actions (weekly)
- Docker images (weekly)

### Setting Up Deployment

1. **Create Render Service**:

   ```bash
   # Deploy using render.yaml
   # Connect your GitHub repository to Render
   # Render will automatically use the render.yaml configuration
   ```

2. **Configure GitHub Secrets**:

   ```bash
   # In GitHub repository settings
   RENDER_SERVICE_ID=srv-xxxxxxxxxxxxx
   RENDER_API_KEY=rnd_xxxxxxxxxxxxx
   RENDER_APP_URL=https://your-app.onrender.com
   ```

3. **Set Environment Variables in Render**:
   - Go to your Render service dashboard
   - Navigate to "Environment" tab
   - Add all required environment variables

4. **Test Deployment**:

   ```bash
   # Push to main branch to trigger automatic deployment
   git push origin main

   # Or use manual deployment workflow
   # Go to Actions tab > Manual Deployment > Run workflow
   ```

### Monitoring and Troubleshooting

#### Health Check Endpoint

The application provides a health check endpoint at `/api/v1/health`:

```json
{
  "status": "healthy",
  "timestamp": "2025-01-01T00:00:00.000Z",
  "services": {
    "database": { "status": "healthy" },
    "redis": { "status": "healthy" },
    "jobQueue": { "status": "healthy" }
  },
  "uptime": 3600,
  "memory": {
    "rss": 52428800,
    "heapTotal": 29360128,
    "heapUsed": 20971520
  }
}
```

#### Common Issues

1. **Build Failures**:
   - Check Node.js version compatibility (requires Node 22+)
   - Verify all dependencies are properly installed
   - Review TypeScript compilation errors

2. **Test Failures**:
   - Ensure PostgreSQL and Redis services are running
   - Check environment variable configuration
   - Review test database connection settings

3. **Deployment Failures**:
   - Verify Render secrets are correctly configured
   - Check Render service logs for detailed error messages
   - Ensure environment variables are set in Render dashboard

4. **Health Check Failures**:
   - Verify database connection string
   - Check Redis connectivity
   - Review application logs for startup errors

### Security Best Practices

1. **Secrets Management**:
   - Never commit secrets to version control
   - Use GitHub Secrets for sensitive data
   - Rotate API keys and tokens regularly

2. **Dependency Security**:
   - Dependabot automatically creates PRs for security updates
   - Review and merge security updates promptly
   - Monitor daily security audit results

3. **Access Control**:
   - Limit repository access to necessary team members
   - Use branch protection rules for main branch
   - Require PR reviews for sensitive changes

### Performance Optimization

1. **Build Optimization**:
   - Dependencies are cached between builds
   - Build artifacts are uploaded for reuse
   - Multi-stage Docker builds reduce image size

2. **Test Optimization**:
   - Tests run in parallel where possible
   - Database and Redis services use health checks
   - Coverage reports are generated efficiently

3. **Deployment Optimization**:
   - Zero-downtime deployments with health checks
   - Automatic rollback on health check failures
   - Build artifacts are reused across jobs
