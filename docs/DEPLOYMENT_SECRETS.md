# Deployment Secrets Configuration

This document outlines all the secrets and environment variables required for the FoodTracker CD pipeline and deployment environments.

## GitHub Secrets Configuration

### Required Secrets

Navigate to your GitHub repository → Settings → Secrets and variables → Actions, then add these secrets:

#### Database Configuration
```bash
# Staging Database
STAGING_DATABASE_URL=postgresql://user:password@staging-db.host:5432/foodtracker_staging
STAGING_POSTGRES_USER=foodtracker_staging
STAGING_POSTGRES_PASSWORD=your_staging_secure_password

# Production Database
PRODUCTION_DATABASE_URL=postgresql://user:password@prod-db.host:5432/foodtracker_production
PRODUCTION_POSTGRES_USER=foodtracker_prod
PRODUCTION_POSTGRES_PASSWORD=your_production_secure_password
```

#### Application Configuration
```bash
# JWT Secret (32+ characters)
JWT_SECRET=your_super_secure_jwt_secret_32_characters_minimum

# Redis Password
REDIS_PASSWORD=your_redis_secure_password

# Grafana Admin Password
GRAFANA_PASSWORD=your_grafana_admin_password
```

#### Domain Configuration
```bash
# Staging URLs
STAGING_URL=https://staging.foodtracker.com
STAGING_API_URL=https://api-staging.foodtracker.com
STAGING_FRONTEND_URL=https://staging.foodtracker.com
STAGING_DOMAIN=staging.foodtracker.com
STAGING_API_DOMAIN=api-staging.foodtracker.com

# Production URLs
PRODUCTION_URL=https://foodtracker.com
PRODUCTION_API_URL=https://api.foodtracker.com
PRODUCTION_FRONTEND_URL=https://foodtracker.com
PRODUCTION_DOMAIN=foodtracker.com
PRODUCTION_API_DOMAIN=api.foodtracker.com
```

#### Notification Configuration
```bash
# Slack Integration
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK
SLACK_CHANNEL=#deployments

# Discord Integration (optional)
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/YOUR/DISCORD/WEBHOOK

# Email Notifications
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-app-password
NOTIFICATION_EMAIL=devops@yourcompany.com
```

#### Optional Security Configuration
```bash
# Basic Auth for Staging API (optional)
STAGING_API_AUTH=username:$2y$10$hashedpassword

# API Keys for external services
OPENFOODFACTS_API_KEY=your_optional_api_key
```

## Environment Files

### `.env.staging` (for local staging testing)
```bash
# Database
POSTGRES_USER=foodtracker_staging
POSTGRES_PASSWORD=staging_secure_password
DATABASE_URL=postgresql://foodtracker_staging:staging_secure_password@localhost:5432/foodtracker_staging

# Application
NODE_ENV=staging
JWT_SECRET=staging_jwt_secret_32_chars_long
FRONTEND_URL=http://localhost:3003
CORS_ORIGIN=http://localhost:3003

# External APIs
OPENFOODFACTS_API_URL=https://world.openfoodfacts.org/api/v0

# Rate Limiting
THROTTLE_TTL=60000
THROTTLE_LIMIT=1000
DISABLE_RATE_LIMITING=false

# Logging
LOG_LEVEL=debug
DB_LOGGING=true

# Redis
REDIS_PASSWORD=staging_redis_password
```

### `.env.production` (for production deployment reference)
```bash
# Database
POSTGRES_USER=foodtracker_prod
POSTGRES_PASSWORD=your_production_secure_password
DATABASE_URL=postgresql://foodtracker_prod:your_production_secure_password@postgres:5432/foodtracker_production

# Application
NODE_ENV=production
JWT_SECRET=your_super_secure_jwt_secret_32_characters_minimum
FRONTEND_URL=https://foodtracker.com
CORS_ORIGIN=https://foodtracker.com

# External APIs
OPENFOODFACTS_API_URL=https://world.openfoodfacts.org/api/v0

# Rate Limiting
THROTTLE_TTL=60000
THROTTLE_LIMIT=100
DISABLE_RATE_LIMITING=false

# Logging
LOG_LEVEL=warn
DB_LOGGING=false

# Redis
REDIS_PASSWORD=your_redis_secure_password

# Monitoring
GRAFANA_PASSWORD=your_grafana_admin_password
```

## Security Best Practices

### Secret Generation
```bash
# Generate secure JWT secret (32+ characters)
openssl rand -base64 32

# Generate secure database password
openssl rand -base64 24

# Generate secure Redis password
openssl rand -base64 16
```

### Environment Security Checklist

- [ ] **Never commit secrets to version control**
- [ ] **Use different secrets for staging and production**
- [ ] **Rotate secrets regularly (every 90 days minimum)**
- [ ] **Use strong, unique passwords for each service**
- [ ] **Enable 2FA on all service accounts**
- [ ] **Use environment-specific database credentials**
- [ ] **Implement secret scanning in CI/CD**
- [ ] **Use managed secrets services when available**

### GitHub Environments Protection

#### Staging Environment
- **Required reviewers**: 0 (auto-deploy)
- **Wait timer**: 0 minutes
- **Deployment branches**: `main` branch only
- **Environment secrets**: Staging-specific values

#### Production Environment
- **Required reviewers**: 2 (manual approval required)
- **Wait timer**: 5 minutes
- **Deployment branches**: Tags (`v*`) and `main` with manual dispatch
- **Environment secrets**: Production-specific values

## Docker Registry Configuration

### GitHub Container Registry (GHCR)
The workflow automatically uses GitHub's container registry. No additional configuration needed.

### Alternative Registries
If using a different container registry, add these secrets:

```bash
# Docker Hub
DOCKER_USERNAME=your-docker-username
DOCKER_PASSWORD=your-docker-password-or-token

# AWS ECR
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_REGION=us-east-1
ECR_REGISTRY=123456789.dkr.ecr.us-east-1.amazonaws.com

# Google Container Registry
GCR_SERVICE_ACCOUNT_KEY=your-service-account-json-key
GCR_REGISTRY=gcr.io/your-project-id
```

## Health Check Endpoints

The CD pipeline relies on these health check endpoints:

### Backend Health Check
- **Endpoint**: `/health`
- **Expected Response**: `200 OK`
- **Response Body**: `{"status": "ok", "timestamp": "..."}`

### Frontend Health Check
- **Endpoint**: `/` (root)
- **Expected Response**: `200 OK`
- **Content**: Valid HTML page

### Database Health Check
- **Internal**: Automatic via Docker Compose health checks
- **Command**: `pg_isready -U username -d database`

## Monitoring Configuration

### Prometheus Metrics
- **Backend metrics**: `/metrics` endpoint
- **System metrics**: Node Exporter on port 9100
- **Database metrics**: PostgreSQL Exporter (optional)

### Grafana Dashboards
- **Default admin user**: `admin`
- **Password**: Set via `GRAFANA_PASSWORD` secret
- **URL**: `http://your-domain:3000`

### Log Aggregation
- **Loki endpoint**: `http://your-domain:3100`
- **Log retention**: 30 days (configurable)
- **Log levels**: Staging (debug), Production (warn)

## Troubleshooting

### Common Issues

1. **Secret not found**: Ensure secret names match exactly in GitHub settings
2. **Database connection failed**: Check database URL format and credentials
3. **Health check timeout**: Verify services are running and endpoints are accessible
4. **Notification not sent**: Check webhook URLs and permissions

### Verification Commands
```bash
# Test database connection
docker exec -it foodtracker-db psql -U username -d database -c "SELECT version();"

# Test Redis connection
docker exec -it foodtracker-redis redis-cli ping

# Test health endpoints
curl -f http://localhost:3001/health
curl -f http://localhost:3003/
```

### Logs Access
```bash
# View deployment logs
docker logs foodtracker-backend
docker logs foodtracker-frontend

# View database logs
docker logs foodtracker-db

# View all service logs
docker-compose logs -f
```

## Emergency Procedures

### Manual Rollback
```bash
# 1. Identify previous version
docker images | grep foodtracker

# 2. Set previous version
export PREVIOUS_VERSION=v1.2.3

# 3. Deploy previous version
docker-compose -f docker-compose.yml -f docker-compose.production.yml pull
docker-compose -f docker-compose.yml -f docker-compose.production.yml up -d

# 4. Verify health
curl -f https://api.foodtracker.com/health
```

### Database Restore
```bash
# 1. Stop application
docker-compose stop backend

# 2. Restore from backup
gunzip -c /backups/foodtracker_backup_YYYYMMDD_HHMMSS.sql.gz | \
  docker exec -i foodtracker-db psql -U username -d database

# 3. Restart application
docker-compose start backend
```

This configuration ensures secure, automated deployments with proper monitoring and rollback capabilities.