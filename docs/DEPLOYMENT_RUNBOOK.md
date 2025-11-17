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

### Method 2: Docker Container

#### Build Image

```bash
# Build locally
docker build -t yametee:latest .

# Build with specific tag
docker build -t yametee:v1.0.0 .

# Build multi-platform (amd64 + arm64)
docker buildx build --platform linux/amd64,linux/arm64 -t yametee:latest .
```

#### Push to Registry

```bash
# Tag for GitHub Container Registry
docker tag yametee:latest ghcr.io/OWNER/yametee:latest

# Login to GitHub Container Registry
echo $GITHUB_TOKEN | docker login ghcr.io -u USERNAME --password-stdin

# Push image
docker push ghcr.io/OWNER/yametee:latest
```

#### Run Container

```bash
# Run with docker-compose (development)
docker-compose up -d

# Run standalone
docker run -d \
  --name yametee \
  -p 3000:3000 \
  -e DATABASE_URL="postgresql://..." \
  -e PAYMONGO_SECRET_KEY="sk_..." \
  -e PAYMONGO_PUBLIC_KEY="pk_..." \
  -e PAYMONGO_WEBHOOK_SECRET="whsec_..." \
  -e NEXTAUTH_URL="https://yametee.example.com" \
  -e NEXTAUTH_SECRET="..." \
  -e ADMIN_JWT_SECRET="..." \
  yametee:latest
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

### Docker Rollback

```bash
# Stop current container
docker stop yametee

# Start previous version
docker run -d \
  --name yametee \
  -p 3000:3000 \
  [environment-variables] \
  yametee:v0.9.0  # Previous version
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
   - Docker: `docker logs yametee`
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
- `Dockerfile` - Container build instructions
- `docker-compose.yml` - Local development setup
- `k8s/` - Kubernetes manifests
- `.github/workflows/ci-cd.yml` - CI/CD pipeline configuration

### Useful Commands

```bash
# Prisma migrations
npm run db:migrate          # Create migration
npm run db:push             # Push schema changes
npm run db:generate         # Generate Prisma Client

# Docker
docker ps                    # List running containers
docker logs -f yametee       # Follow logs
docker exec -it yametee sh   # Shell into container

# Kubernetes
kubectl get pods -n yametee-staging
kubectl describe pod [pod-name] -n yametee-staging
kubectl logs -f [pod-name] -n yametee-staging
kubectl exec -it [pod-name] -n yametee-staging -- sh
```
