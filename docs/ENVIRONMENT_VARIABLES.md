# Environment Variables Reference

**Last Updated:** 2025-01-XX  
**Application:** Yametee E-commerce Platform

## Overview

This document describes all environment variables required for the Yametee application across different environments.

## Variable Categories

- 🔴 **Required** - Application will not function without this variable
- 🟡 **Optional** - Has sensible defaults but can be customized
- 🔵 **Development** - Only needed in development environment

## Core Variables

### Database

| Variable       | Type        | Description                  | Example                                             |
| -------------- | ----------- | ---------------------------- | --------------------------------------------------- |
| `DATABASE_URL` | 🔴 Required | PostgreSQL connection string | `postgresql://user:pass@host:5432/db?schema=public` |

**Format:** `postgresql://[user]:[password]@[host]:[port]/[database]?schema=public`

**Security Notes:**

- Never commit actual credentials to version control
- Use connection pooling for production (add `?connection_limit=10&pool_timeout=20`)
- Use SSL in production: `?sslmode=require`

### Payment Processing (PayMongo)

| Variable                  | Type        | Description              | Example                        |
| ------------------------- | ----------- | ------------------------ | ------------------------------ |
| `PAYMONGO_SECRET_KEY`     | 🔴 Required | PayMongo secret API key  | `sk_test_...` or `sk_live_...` |
| `PAYMONGO_PUBLIC_KEY`     | 🔴 Required | PayMongo public API key  | `pk_test_...` or `pk_live_...` |
| `PAYMONGO_WEBHOOK_SECRET` | 🔴 Required | Webhook signature secret | `whsec_...`                    |

**Environment-Specific:**

- **Development/Staging:** Use `sk_test_` and `pk_test_` keys
- **Production:** Use `sk_live_` and `pk_live_` keys

### Authentication

| Variable           | Type        | Description                     | Example                      |
| ------------------ | ----------- | ------------------------------- | ---------------------------- |
| `NEXTAUTH_URL`     | 🔴 Required | Base URL of the application     | `https://yametee.vercel.app` |
| `NEXTAUTH_SECRET`  | 🔴 Required | Secret for JWT encryption       | Random 32+ character string  |
| `ADMIN_JWT_SECRET` | 🔴 Required | Secret for admin session tokens | Random 32+ character string  |

**Generation:**

```bash
# Generate NEXTAUTH_SECRET
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Generate ADMIN_JWT_SECRET
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### Application Configuration

| Variable                  | Type        | Description               | Default           |
| ------------------------- | ----------- | ------------------------- | ----------------- |
| `NODE_ENV`                | 🟡 Optional | Node.js environment       | `development`     |
| `PORT`                    | 🟡 Optional | Server port               | `3000`            |
| `HOSTNAME`                | 🟡 Optional | Server hostname           | `0.0.0.0`         |
| `NEXT_TELEMETRY_DISABLED` | 🟡 Optional | Disable Next.js telemetry | `1` (recommended) |

## Environment-Specific Configurations

### Development

```bash
NODE_ENV=development
DATABASE_URL=postgresql://user:pass@localhost:5432/yametee_dev
NEXTAUTH_URL=http://localhost:3000
PAYMONGO_SECRET_KEY=sk_test_...
PAYMONGO_PUBLIC_KEY=pk_test_...
PAYMONGO_WEBHOOK_SECRET=whsec_...
NEXTAUTH_SECRET=dev-secret-key
ADMIN_JWT_SECRET=dev-admin-secret
```

### Staging

```bash
NODE_ENV=production
DATABASE_URL=postgresql://user:pass@staging-db:5432/yametee_staging?sslmode=require
NEXTAUTH_URL=https://yametee-staging.vercel.app
PAYMONGO_SECRET_KEY=sk_test_...
PAYMONGO_PUBLIC_KEY=pk_test_...
PAYMONGO_WEBHOOK_SECRET=whsec_...
NEXTAUTH_SECRET=[generated-secret]
ADMIN_JWT_SECRET=[generated-secret]
```

### Production

```bash
NODE_ENV=production
DATABASE_URL=postgresql://user:pass@prod-db:5432/yametee_prod?sslmode=require&connection_limit=10
NEXTAUTH_URL=https://yametee.vercel.app
PAYMONGO_SECRET_KEY=sk_live_...
PAYMONGO_PUBLIC_KEY=pk_live_...
PAYMONGO_WEBHOOK_SECRET=whsec_...
NEXTAUTH_SECRET=[generated-secret]
ADMIN_JWT_SECRET=[generated-secret]
```

## Platform-Specific Setup

### Vercel

1. Go to Project → Settings → Environment Variables
2. Add each variable for the appropriate environment:
   - **Production:** Production deployments only
   - **Preview:** Staging/preview deployments
   - **Development:** Local development (via Vercel CLI)

**Variable Priority:**

- Production > Preview > Development

### Docker / Docker Compose

**docker-compose.yml:**

```yaml
services:
  app:
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - PAYMONGO_SECRET_KEY=${PAYMONGO_SECRET_KEY}
      # ... other variables
```

**Or use .env file:**

```bash
# .env (DO NOT COMMIT)
DATABASE_URL=postgresql://...
PAYMONGO_SECRET_KEY=sk_...
# ...
```

### Kubernetes

Use Secrets and ConfigMaps (see `k8s/secrets.yaml.example`):

```yaml
env:
  - name: DATABASE_URL
    valueFrom:
      secretKeyRef:
        name: yametee-secrets
        key: database-url
```

## Security Best Practices

1. **Never commit secrets:**
   - Use `.env` files locally (already in `.gitignore`)
   - Use platform secret management (Vercel, K8s Secrets, etc.)

2. **Rotate secrets regularly:**
   - JWT secrets: Every 90 days
   - Database passwords: Every 180 days
   - API keys: As needed (when compromised)

3. **Use different secrets per environment:**
   - Never reuse production secrets in staging/development

4. **Limit access:**
   - Only grant access to secrets to authorized personnel
   - Use least-privilege principle

5. **Monitor for exposure:**
   - Regularly scan repositories for accidentally committed secrets
   - Use tools like `git-secrets` or GitHub secret scanning

## Validation

### Check Required Variables

```bash
# Check if all required variables are set
node -e "
const required = ['DATABASE_URL', 'PAYMONGO_SECRET_KEY', 'NEXTAUTH_URL', 'NEXTAUTH_SECRET', 'ADMIN_JWT_SECRET'];
const missing = required.filter(v => !process.env[v]);
if (missing.length) {
  console.error('Missing required variables:', missing);
  process.exit(1);
}
console.log('All required variables are set');
"
```

### Test Database Connection

```bash
# Using Prisma
npx prisma db pull

# Using psql
psql $DATABASE_URL -c "SELECT 1"
```

## Troubleshooting

### Variable Not Found

- **Symptom:** `process.env.VARIABLE_NAME` is `undefined`
- **Solution:**
  1. Verify variable is set in environment
  2. Restart application after setting variables
  3. Check for typos in variable names

### Database Connection Failed

- **Symptom:** `Can't reach database server`
- **Solution:**
  1. Verify `DATABASE_URL` format is correct
  2. Check network connectivity to database
  3. Verify credentials are correct
  4. Check firewall rules

### Authentication Errors

- **Symptom:** `Invalid token` or `Unauthorized`
- **Solution:**
  1. Verify `NEXTAUTH_SECRET` and `ADMIN_JWT_SECRET` are set
  2. Ensure secrets match across all instances (if load-balanced)
  3. Check `NEXTAUTH_URL` matches actual application URL

## Related Documentation

- `.env.example` - Example environment file
- `DEPLOYMENT_RUNBOOK.md` - Deployment procedures
- `k8s/secrets.yaml.example` - Kubernetes secrets example
