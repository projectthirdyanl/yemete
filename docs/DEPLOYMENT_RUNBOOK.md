# Deployment Runbook

**Last Updated:** 2025-01-XX  
**Application:** Yametee E-commerce Platform  
**Version:** 1.0.0

## Overview

This runbook provides step-by-step procedures for deploying, monitoring, and rolling back the Yametee application across different environments.

## Environments

| Environment     | URL                          | Purpose                | Auto-Deploy Trigger        |
| --------------- | ---------------------------- | ---------------------- | -------------------------- |
| **Development** | `localhost:3000`             | Local development      | Manual                     |
| **Staging**     | `yametee-staging.vercel.app` | Pre-production testing | Push to `main`/`master`    |
| **Production**  | `yametee.vercel.app`         | Live production        | Tagged releases (`v*.*.*`) |

## Pre-Deployment Checklist

- [ ] All tests passing (`npm test`)
- [ ] Linting passes (`npm run lint`)
- [ ] Type checking passes (`npm run type-check`)
- [ ] Security scan passes (Trivy, npm audit)
- [ ] Database migrations reviewed and tested
- [ ] Environment variables updated in target environment
- [ ] Backup of production database (if production deployment)
- [ ] Deployment window scheduled (if production)
- [ ] Rollback plan reviewed

## Deployment Methods

### Method 1: Vercel (Recommended for Next.js)

#### Automatic Deployment (CI/CD)

**Staging:**

- Push to `main` or `master` branch triggers automatic staging deployment
- Monitor deployment in GitHub Actions: `.github/workflows/ci-cd.yml`

**Production:**

- Create and push a version tag: `git tag v1.0.0 && git push origin v1.0.0`
- Or use GitHub Actions workflow dispatch with `environment: production`

#### Manual Deployment

```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Link project (first time only)
vercel link

# Deploy to preview/staging
vercel

# Deploy to production
vercel --prod
```

#### Environment Variables Setup

1. Go to Vercel Dashboard → Project → Settings → Environment Variables
2. Add all required variables (see `ENVIRONMENT_VARIABLES.md`)
3. Ensure variables are set for correct environments (Production, Preview, Development)

### Method 2: Direct Installation (Self-Hosted)

#### Prerequisites

- Node.js 20.x installed
- PostgreSQL database accessible
- Redis (optional, for caching and job queue)

#### Installation Steps

```bash
# 1. Clone repository
git clone <your-repo-url> yametee
cd yametee

# 2. Install dependencies
npm ci

# 3. Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# 4. Generate Prisma Client
npx prisma generate

# 5. Run database migrations
npx prisma migrate deploy

# 6. Build application
npm run build
```

#### Process Management Options

**Option A: PM2 (Recommended)**

```bash
# Install PM2 globally (if not already installed)
npm install -g pm2

# Start application
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
# Follow the instructions provided

# Monitor application
pm2 logs yametee-web
pm2 status
```

**Option B: Systemd**

For detailed systemd setup, see `PROXMOX_DEPLOYMENT.md` or `proxmox/README-DIRECT.md`.

```bash
# Create systemd service (example)
sudo nano /etc/systemd/system/yametee-web.service

# Start and enable service
sudo systemctl daemon-reload
sudo systemctl enable yametee-web
sudo systemctl start yametee-web

# Check status
sudo systemctl status yametee-web
sudo journalctl -u yametee-web -f
```

### Method 3: Kubernetes

#### Prerequisites

- Kubernetes cluster configured
- `kubectl` configured with cluster access
- Namespace created: `kubectl create namespace yametee-staging`
- Secrets created (see `k8s/secrets.yaml.example`)

#### Deploy

```bash
# Set image tag
export IMAGE_TAG=ghcr.io/OWNER/yametee:v1.0.0

# Apply manifests
envsubst < k8s/deployment.yaml | kubectl apply -f -

# Watch deployment
kubectl rollout status deployment/yametee -n yametee-staging

# Verify pods
kubectl get pods -n yametee-staging

# Check logs
kubectl logs -f deployment/yametee -n yametee-staging
```

#### Update Deployment

```bash
# Update image
kubectl set image deployment/yametee yametee=$IMAGE_TAG -n yametee-staging

# Rollout update
kubectl rollout status deployment/yametee -n yametee-staging
```

## Post-Deployment Verification

### Health Check

```bash
# Check health endpoint
curl https://yametee-staging.vercel.app/api/health

# Expected response:
# {
#   "status": "healthy",
#   "timestamp": "2025-01-XX...",
#   "service": "yametee-api",
#   "checks": { "database": "connected" }
# }
```

### Smoke Tests

1. **Homepage loads:** `curl -I https://yametee-staging.vercel.app`
2. **API responds:** `curl https://yametee-staging.vercel.app/api/products`
3. **Admin login works:** Test admin authentication
4. **Database connectivity:** Check logs for database connection errors
5. **Payment webhook:** Verify PayMongo webhook endpoint is accessible

### Monitoring

- **Vercel Dashboard:** Check deployment status, logs, and metrics
- **Application Logs:** Monitor for errors or warnings
- **Database:** Check connection pool and query performance
- **Error Tracking:** Review Sentry (if configured) for new errors

## Rollback Procedures

### Vercel Rollback

#### Via Dashboard

1. Go to Vercel Dashboard → Project → Deployments
2. Find previous successful deployment
3. Click "..." → "Promote to Production"

#### Via CLI

```bash
# List deployments
vercel ls

# Rollback to specific deployment
vercel rollback [deployment-url]
```

### Direct Installation Rollback

**PM2:**

```bash
# Stop current process
pm2 stop yametee-web

# Checkout previous version
cd /path/to/yametee
git checkout <previous-commit-or-tag>

# Rebuild and restart
npm ci
npx prisma generate
npm run build
pm2 restart yametee-web
```

**Systemd:**

```bash
# Stop service
sudo systemctl stop yametee-web

# Checkout previous version
cd /opt/yametee
sudo -u yametee git checkout <previous-commit-or-tag>

# Rebuild and restart
sudo -u yametee npm ci
sudo -u yametee npx prisma generate
sudo -u yametee npm run build
sudo systemctl start yametee-web
```

### Kubernetes Rollback

```bash
# View rollout history
kubectl rollout history deployment/yametee -n yametee-staging

# Rollback to previous revision
kubectl rollout undo deployment/yametee -n yametee-staging

# Rollback to specific revision
kubectl rollout undo deployment/yametee --to-revision=2 -n yametee-staging

# Verify rollback
kubectl rollout status deployment/yametee -n yametee-staging
```

### Database Rollback

⚠️ **Warning:** Database rollbacks are destructive. Only perform if absolutely necessary.

```bash
# List migrations
npx prisma migrate status

# Rollback last migration (if using migrate)
# Note: Prisma doesn't support automatic rollback
# You must manually reverse the migration SQL

# Alternative: Restore from backup
pg_restore -d yametee_db backup.dump
```

## Troubleshooting

### Deployment Fails

1. **Check build logs:**
   - Vercel: Dashboard → Deployments → [Failed Deployment] → Build Logs
   - PM2: `pm2 logs yametee-web`
   - Systemd: `journalctl -u yametee-web -n 100`
   - K8s: `kubectl logs deployment/yametee -n yametee-staging`

2. **Common issues:**
   - Missing environment variables
   - Database connection failure
   - Build timeout (increase timeout in CI/CD)
   - Memory limits exceeded

### Application Unhealthy

1. **Check health endpoint:** `curl /api/health`
2. **Review logs:** Check for database connection errors
3. **Verify environment variables:** Ensure all required vars are set
4. **Check resource limits:** CPU/memory constraints in K8s

### Database Connection Issues

1. **Verify DATABASE_URL format:** `postgresql://user:pass@host:port/db`
2. **Check network connectivity:** Ensure database is reachable
3. **Verify credentials:** Test connection with `psql` or Prisma Studio
4. **Check connection pool:** Review Prisma connection pool settings

## Emergency Contacts

- **On-Call Engineer:** [Contact Info]
- **Database Admin:** [Contact Info]
- **Infrastructure Team:** [Contact Info]

## Appendix

### Related Documentation

- `ENVIRONMENT_VARIABLES.md` - Environment variable reference
- `PROXMOX_DEPLOYMENT.md` - Proxmox deployment guide
- `proxmox/README-DIRECT.md` - Direct installation guide
- `ecosystem.config.js` - PM2 configuration
- `k8s/` - Kubernetes manifests
- `.github/workflows/ci-cd.yml` - CI/CD pipeline configuration

### Useful Commands

```bash
# Prisma migrations
npm run db:migrate          # Create migration
npm run db:push             # Push schema changes
npm run db:generate         # Generate Prisma Client

# PM2
pm2 list                     # List running processes
pm2 logs yametee-web         # Follow logs
pm2 restart yametee-web      # Restart process
pm2 stop yametee-web         # Stop process

# Systemd
sudo systemctl status yametee-web  # Check status
sudo journalctl -u yametee-web -f  # Follow logs
sudo systemctl restart yametee-web # Restart service

# Kubernetes
kubectl get pods -n yametee-staging
kubectl describe pod [pod-name] -n yametee-staging
kubectl logs -f [pod-name] -n yametee-staging
kubectl exec -it [pod-name] -n yametee-staging -- sh
```
