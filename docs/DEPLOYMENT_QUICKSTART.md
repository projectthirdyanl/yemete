# Deployment Quick Start Guide

**For:** Yametee E-commerce Platform  
**Last Updated:** 2025-01-XX

## 🚀 Quick Deploy Options

### Option 1: Vercel (Recommended - Easiest)

**Time:** ~5 minutes

1. **Connect Repository:**
   - Go to [vercel.com](https://vercel.com)
   - Import GitHub repository
   - Vercel auto-detects Next.js

2. **Configure Environment Variables:**

   ```
   DATABASE_URL=postgresql://...
   PAYMONGO_SECRET_KEY=sk_test_...
   PAYMONGO_PUBLIC_KEY=pk_test_...
   PAYMONGO_WEBHOOK_SECRET=whsec_...
   NEXTAUTH_URL=https://your-app.vercel.app
   NEXTAUTH_SECRET=[generate-random-string]
   ADMIN_JWT_SECRET=[generate-random-string]
   ```

3. **Deploy:**
   - Push to `main` → Auto-deploys to staging
   - Create tag `v1.0.0` → Auto-deploys to production

**Done!** ✅

---

### Option 2: Direct Installation (Self-Hosted)

**Time:** ~15 minutes

```bash
# 1. Install Node.js (if not already installed)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# 2. Clone repository
git clone <your-repo> yametee
cd yametee

# 3. Install dependencies
npm ci

# 4. Set up environment variables
cp .env.example .env
nano .env  # Edit with your configuration

# 5. Generate Prisma Client and run migrations
npx prisma generate
npx prisma migrate deploy

# 6. Build application
npm run build

# 7. Start with PM2 (recommended) or systemd
pm2 start ecosystem.config.js
pm2 save
pm2 startup  # Follow instructions to enable on boot

# Or use systemd (see PROXMOX_DEPLOYMENT.md for details)

# 8. Check health
curl http://localhost:3000/api/health
```

**Done!** ✅

---

### Option 3: Kubernetes

**Time:** ~15 minutes

```bash
# 1. Create namespace
kubectl create namespace yametee-staging

# 2. Create secrets (see k8s/secrets.yaml.example)
kubectl create secret generic yametee-secrets \
  --from-literal=database-url="postgresql://..." \
  --from-literal=paymongo-secret-key="sk_..." \
  --from-literal=paymongo-public-key="pk_..." \
  --from-literal=paymongo-webhook-secret="whsec_..." \
  --from-literal=nextauth-secret="..." \
  --from-literal=admin-jwt-secret="..." \
  -n yametee-staging

# 3. Create config map
kubectl create configmap yametee-config \
  --from-literal=nextauth-url="https://yametee.example.com" \
  -n yametee-staging

# 4. Set image tag and deploy
export IMAGE_TAG=ghcr.io/OWNER/yametee:latest
envsubst < k8s/deployment.yaml | kubectl apply -f -

# 5. Check status
kubectl get pods -n yametee-staging
kubectl rollout status deployment/yametee -n yametee-staging
```

**Done!** ✅

---

## 🔐 Generate Secrets

```bash
# Generate NEXTAUTH_SECRET
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Generate ADMIN_JWT_SECRET
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

---

## ✅ Verify Deployment

```bash
# Health check
curl https://your-app.vercel.app/api/health

# Expected response:
# {"status":"healthy","timestamp":"...","service":"yametee-api"}
```

---

## 📚 Need More Help?

- **Full Runbook:** `docs/DEPLOYMENT_RUNBOOK.md`
- **Environment Variables:** `docs/ENVIRONMENT_VARIABLES.md`
- **Complete Summary:** `docs/DEPLOYMENT_SUMMARY.md`

---

## 🆘 Troubleshooting

**Deployment fails?**

- Check environment variables are set
- Verify database is accessible
- Review logs: `pm2 logs` or `journalctl -u yametee-web -f` or Vercel dashboard

**Health check fails?**

- Verify database connection string
- Check application logs for errors
- Ensure port 3000 is accessible

**Need to rollback?**

- Vercel: Dashboard → Deployments → Promote previous deployment
- PM2: `pm2 restart yametee-web` or `git checkout <previous-commit> && pm2 restart yametee-web`
- Systemd: `systemctl restart yametee-web` or restore from backup
- K8s: `kubectl rollout undo deployment/yametee -n yametee-staging`
