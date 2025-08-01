# FoodTracker Deployment Guide

Complete guide for deploying the FoodTracker application using the automated CD pipeline.

## 🚀 Deployment Overview

The FoodTracker application uses a comprehensive CI/CD pipeline with the following deployment strategies:

- **Staging**: Automatic deployment on push to `main` branch
- **Production**: Deployment on version tags (`v*`) or manual dispatch with approval
- **Docker**: Multi-stage builds with GitHub Container Registry
- **Health Checks**: Automated health verification and rollback
- **Monitoring**: Prometheus, Grafana, and Loki integration
- **Notifications**: Slack, Discord, and email alerts

## 📋 Prerequisites

### Repository Setup
1. **GitHub Secrets**: Configure all required secrets (see [DEPLOYMENT_SECRETS.md](./DEPLOYMENT_SECRETS.md))
2. **Environments**: Set up staging and production environments with protection rules
3. **Container Registry**: GitHub Container Registry is used by default (no setup needed)

### Infrastructure Requirements
- **Staging Server**: Minimum 2GB RAM, 2 CPU cores, 50GB storage
- **Production Server**: Minimum 4GB RAM, 4 CPU cores, 100GB storage
- **Docker**: Version 20.10+ with Docker Compose v2
- **Domain**: Configured domains for staging and production
- **SSL Certificates**: Let's Encrypt or custom certificates

## 🔄 Deployment Workflows

### Automatic Staging Deployment

**Trigger**: Push to `main` branch

```bash
# Developer workflow
git checkout main
git pull origin main
git checkout -b feature/new-feature
# ... make changes ...
git add .
git commit -m "feat: add new feature"
git push origin feature/new-feature

# Create PR and merge to main
# 🚀 Automatic staging deployment starts
```

**Pipeline Steps**:
1. ✅ Pre-deployment validation
2. ✅ Run tests and linting
3. ✅ Build and push Docker images
4. ✅ Deploy to staging environment
5. ✅ Health checks and smoke tests
6. ✅ Notification to team

### Production Deployment

**Trigger**: Version tag or manual dispatch

#### Method 1: Version Tag (Recommended)
```bash
# Create and push version tag
git checkout main
git pull origin main
git tag v1.2.3
git push origin v1.2.3

# 🚀 Production deployment starts (requires approval)
```

#### Method 2: Manual Dispatch
1. Go to **Actions** → **Continuous Deployment**
2. Click **Run workflow**
3. Select **production** environment
4. Click **Run workflow**
5. Approve deployment in **Environments** tab

**Pipeline Steps**:
1. ✅ Pre-deployment validation and security audit
2. ✅ Manual approval (2 reviewers required)
3. ✅ Database backup creation
4. ✅ Blue-green deployment strategy
5. ✅ Comprehensive health checks
6. ✅ Traffic switch and monitoring
7. ✅ Success notifications

### Emergency Deployment

For critical hotfixes that need to skip tests:

1. Go to **Actions** → **Continuous Deployment**
2. Click **Run workflow**
3. Select environment (staging/production)
4. ✅ Check **Skip tests (emergency deployment)**
5. Click **Run workflow**

⚠️ **Use only for critical security fixes or outages**

## 🏗️ Deployment Architecture

### Staging Environment
```
┌─────────────────────────────────────────────────────────────┐
│                    Staging Environment                       │
├─────────────────────────────────────────────────────────────┤
│ Load Balancer (Traefik)                                    │
│ ├── staging.foodtracker.com → Frontend (Nginx)             │
│ └── api-staging.foodtracker.com → Backend (Node.js)        │
├─────────────────────────────────────────────────────────────┤
│ Services:                                                   │
│ ├── PostgreSQL (with backups)                              │
│ ├── Redis (caching)                                        │
│ ├── Node Exporter (metrics)                                │
│ └── Health Monitoring                                       │
└─────────────────────────────────────────────────────────────┘
```

### Production Environment
```
┌─────────────────────────────────────────────────────────────┐
│                   Production Environment                     │
├─────────────────────────────────────────────────────────────┤
│ Load Balancer (Traefik)                                    │
│ ├── foodtracker.com → Frontend (Nginx) x2 replicas        │
│ └── api.foodtracker.com → Backend (Node.js) x2 replicas   │
├─────────────────────────────────────────────────────────────┤
│ Services:                                                   │
│ ├── PostgreSQL (HA with backups)                           │
│ ├── Redis (persistence enabled)                            │
│ ├── Prometheus (metrics collection)                        │
│ ├── Grafana (dashboards)                                   │
│ ├── Loki (log aggregation)                                 │
│ └── Automated Backup Service                               │
└─────────────────────────────────────────────────────────────┘
```

## 🔧 Server Setup

### Initial Server Preparation

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Create application directories
sudo mkdir -p /var/lib/foodtracker/{postgres-data,redis-data,backend-data,prometheus-data,grafana-data,loki-data}
sudo mkdir -p /var/log/foodtracker/{backend,nginx}
sudo mkdir -p /opt/foodtracker/{backups,scripts}

# Set permissions
sudo chown -R $USER:$USER /var/lib/foodtracker /var/log/foodtracker /opt/foodtracker
```

### Environment Configuration

#### Staging Server (`/opt/foodtracker/.env.staging`)
```bash
# Copy from DEPLOYMENT_SECRETS.md
# Configure staging-specific values
```

#### Production Server (`/opt/foodtracker/.env.production`)
```bash
# Copy from DEPLOYMENT_SECRETS.md
# Configure production-specific values
```

### Reverse Proxy Setup (Traefik)

Create `/opt/foodtracker/traefik.yml`:
```yaml
api:
  dashboard: true
  insecure: false

entryPoints:
  web:
    address: ":80"
    http:
      redirections:
        entrypoint:
          to: websecure
          scheme: https
  websecure:
    address: ":443"

certificatesResolvers:
  letsencrypt:
    acme:
      email: admin@yourcompany.com
      storage: /letsencrypt/acme.json
      httpChallenge:
        entryPoint: web

providers:
  docker:
    exposedByDefault: false
    network: foodtracker-production
```

## 📊 Monitoring Setup

### Health Check Endpoints

The deployment pipeline monitors these endpoints:

#### Backend Health Check
```bash
curl -f https://api.foodtracker.com/health
# Expected: {"status":"ok","timestamp":"2024-01-01T12:00:00Z"}
```

#### Frontend Health Check
```bash
curl -f https://foodtracker.com/
# Expected: 200 OK with HTML content
```

#### Database Health Check
```bash
docker exec foodtracker-db pg_isready -U foodtracker_prod -d foodtracker_production
# Expected: foodtracker_production - accepting connections
```

### Monitoring Dashboard Access

- **Grafana**: `https://your-domain:3000` (admin/password from secrets)
- **Prometheus**: `https://your-domain:9090` (metrics)
- **Container Stats**: `docker stats` (live resource usage)

### Key Metrics to Monitor

1. **Response Time**: < 500ms for API endpoints
2. **Error Rate**: < 1% for all requests
3. **Memory Usage**: < 80% for all containers
4. **Database Connections**: < 80% of max connections
5. **Disk Usage**: < 85% for all volumes

## 🚨 Rollback Procedures

### Automatic Rollback

The CD pipeline automatically triggers rollback if:
- Health checks fail after deployment
- Critical errors detected within 5 minutes
- Manual rollback initiated via GitHub Actions

### Manual Rollback

#### Via GitHub Actions
1. Go to **Actions** → **Continuous Deployment**
2. Find failed deployment run
3. Click **Re-run failed jobs** → **Rollback**

#### Direct Server Rollback
```bash
# 1. Find previous version
docker images | grep foodtracker | head -5

# 2. Set rollback version
export ROLLBACK_VERSION=v1.2.2

# 3. Update docker-compose with previous images
export BACKEND_IMAGE=ghcr.io/yourorg/foodtracker-backend:$ROLLBACK_VERSION
export FRONTEND_IMAGE=ghcr.io/yourorg/foodtracker-frontend:$ROLLBACK_VERSION

# 4. Deploy previous version
docker-compose -f docker-compose.yml -f docker-compose.production.yml up -d

# 5. Verify rollback
curl -f https://api.foodtracker.com/health
```

### Database Rollback

⚠️ **Database rollbacks require extreme caution**

```bash
# 1. Stop application
docker-compose stop backend

# 2. Create current backup
./scripts/backup.sh

# 3. Restore from previous backup
gunzip -c /opt/foodtracker/backups/foodtracker_backup_YYYYMMDD_HHMMSS.sql.gz | \
  docker exec -i foodtracker-db psql -U foodtracker_prod -d foodtracker_production

# 4. Restart application
docker-compose start backend

# 5. Verify data integrity
docker exec foodtracker-db psql -U foodtracker_prod -d foodtracker_production -c "SELECT COUNT(*) FROM users;"
```

## 🔐 Security Considerations

### SSL/TLS Configuration
- Use Let's Encrypt for automatic certificate renewal
- Implement HSTS headers for security
- Configure secure cipher suites

### Network Security
- Use Docker networks for service isolation
- Implement firewall rules (UFW/iptables)
- Restrict database access to application only

### Container Security
- Run containers as non-root users
- Use minimal base images (Alpine Linux)
- Scan images for vulnerabilities
- Keep base images updated

### Access Control
- Use SSH key authentication only
- Implement sudo access controls
- Regular security audit and updates
- Monitor access logs

## 📋 Maintenance Procedures

### Daily Tasks (Automated)
- ✅ Database backups
- ✅ Log rotation
- ✅ Health check monitoring
- ✅ Security scan alerts

### Weekly Tasks
- [ ] Review deployment logs
- [ ] Check backup integrity
- [ ] Monitor resource usage trends
- [ ] Update security patches

### Monthly Tasks
- [ ] Rotate secrets and passwords
- [ ] Review and update monitoring alerts
- [ ] Audit user access permissions
- [ ] Performance optimization review

### Quarterly Tasks
- [ ] Disaster recovery testing
- [ ] Security audit and penetration testing
- [ ] Backup restoration testing
- [ ] Infrastructure scaling review

## 🆘 Troubleshooting

### Common Issues

#### Deployment Fails at Health Check
```bash
# Check container logs
docker logs foodtracker-backend --tail 50
docker logs foodtracker-frontend --tail 50

# Check container status
docker ps -a

# Verify network connectivity  
docker exec foodtracker-backend curl -f http://localhost:3001/health
```

#### Database Connection Issues
```bash
# Check database status
docker exec foodtracker-db pg_isready -U foodtracker_prod

# Check connection from backend
docker exec foodtracker-backend nc -zv postgres 5432

# Review database logs
docker logs foodtracker-db --tail 100
```

#### Memory/Resource Issues
```bash
# Check resource usage
docker stats

# Check disk space
df -h

# Check system resources
htop
free -h
```

### Emergency Contacts

- **DevOps Team**: devops@yourcompany.com
- **On-Call Engineer**: +1-XXX-XXX-XXXX
- **Slack Channel**: #foodtracker-alerts
- **Status Page**: https://status.foodtracker.com

### Log Locations

- **Application Logs**: `/var/log/foodtracker/backend/`
- **Nginx Logs**: `/var/log/foodtracker/nginx/`
- **Docker Logs**: `docker logs <container-name>`
- **System Logs**: `/var/log/syslog`

This comprehensive deployment guide ensures reliable, secure, and monitored deployments of the FoodTracker application.