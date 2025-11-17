# Test Deployment Checklist

**Date:** ******\_\_\_******  
**Deployment Method:** [ ] Vercel [ ] Docker [ ] Kubernetes  
**Environment:** [ ] Staging [ ] Production

## Pre-Deployment

### Environment Variables Check

- [ ] `DATABASE_URL` - PostgreSQL connection string configured
- [ ] `PAYMONGO_SECRET_KEY` - PayMongo secret key set
- [ ] `PAYMONGO_PUBLIC_KEY` - PayMongo public key set
- [ ] `PAYMONGO_WEBHOOK_SECRET` - Webhook secret set
- [ ] `NEXTAUTH_URL` - Base URL matches deployment target
- [ ] `NEXTAUTH_SECRET` - Generated secure random string (64+ chars)
- [ ] `ADMIN_JWT_SECRET` - Generated secure random string (64+ chars)

### Code Quality

- [ ] Local build succeeds: `npm run build`
- [ ] Linting passes: `npm run lint`
- [ ] Type checking passes: `npm run type-check`
- [ ] No console errors in browser

### Database

- [ ] Database is accessible from deployment environment
- [ ] Prisma migrations are up to date
- [ ] Database schema matches current codebase

### Secrets Generation

```bash
# Generate NEXTAUTH_SECRET
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Generate ADMIN_JWT_SECRET
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

## Deployment Steps

### Option A: Vercel Deployment

- [ ] Vercel account created/connected
- [ ] GitHub repository connected to Vercel
- [ ] Environment variables added in Vercel dashboard
- [ ] Deployed via push to `main` branch OR manual deploy
- [ ] Deployment URL received: **********\_\_\_**********

### Option B: Docker Deployment

- [ ] Docker image built successfully
- [ ] Container runs locally without errors
- [ ] Environment variables passed to container
- [ ] Container accessible on port 3000
- [ ] Health check endpoint responds: `/api/health`

### Option C: Kubernetes Deployment

- [ ] Kubernetes cluster accessible
- [ ] Namespace created: `kubectl create namespace yametee-staging`
- [ ] Secrets created from `k8s/secrets.yaml.example`
- [ ] ConfigMap created
- [ ] Deployment applied successfully
- [ ] Pods running: `kubectl get pods -n yametee-staging`

## Post-Deployment Verification

### Health Check

- [ ] Health endpoint responds: `GET /api/health`
- [ ] Response shows `"status": "healthy"`
- [ ] Database connectivity confirmed in response

### Functional Tests

- [ ] Homepage loads: `/`
- [ ] Products page loads: `/products`
- [ ] Product detail page loads: `/products/[slug]`
- [ ] Cart functionality works: `/cart`
- [ ] Admin login works: `/admin/login`
- [ ] Admin dashboard accessible: `/admin`

### API Tests

- [ ] Products API: `GET /api/products`
- [ ] Cart API: `POST /api/cart`
- [ ] Health API: `GET /api/health`

### Payment Integration

- [ ] PayMongo webhook endpoint accessible: `/api/webhooks/paymongo`
- [ ] Webhook secret matches PayMongo configuration

## Issues Found

| Issue | Severity | Status | Notes |
| ----- | -------- | ------ | ----- |
|       |          |        |       |
|       |          |        |       |

## Rollback Plan

If deployment fails:

- [ ] Rollback procedure documented: `docs/DEPLOYMENT_RUNBOOK.md`
- [ ] Previous version identified
- [ ] Rollback executed
- [ ] Previous version verified working

## Sign-Off

**Deployed By:** ******\_\_\_******  
**Deployment Time:** ******\_\_\_******  
**Status:** [ ] Success [ ] Failed [ ] Partial  
**Notes:** ************************\_************************
