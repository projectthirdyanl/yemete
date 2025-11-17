# 🚀 Quick Test Deployment Guide

## Choose Your Deployment Method

### 🎯 Option 1: Vercel (Easiest - Recommended for Testing)

**Time:** ~5 minutes | **Difficulty:** ⭐ Easy

#### Steps:

1. **Install Vercel CLI** (if not installed):

   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**:

   ```bash
   vercel login
   ```

3. **Deploy to Preview/Staging**:

   ```bash
   vercel
   ```

   - Follow prompts (link project if first time)
   - This creates a preview deployment

4. **Set Environment Variables** (if not set):

   ```bash
   vercel env add DATABASE_URL
   vercel env add PAYMONGO_SECRET_KEY
   vercel env add PAYMONGO_PUBLIC_KEY
   vercel env add PAYMONGO_WEBHOOK_SECRET
   vercel env add NEXTAUTH_URL
   vercel env add NEXTAUTH_SECRET
   vercel env add ADMIN_JWT_SECRET
   ```

5. **Deploy to Production** (when ready):
   ```bash
   vercel --prod
   ```

**✅ Done!** Your app will be live at the URL Vercel provides.

---

### 🐳 Option 2: Docker (Local Testing)

**Time:** ~10 minutes | **Difficulty:** ⭐⭐ Medium

#### Steps:

1. **Generate Secrets** (if not already done):

   ```bash
   # Generate NEXTAUTH_SECRET
   node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

   # Generate ADMIN_JWT_SECRET
   node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
   ```

2. **Build Docker Image**:

   ```bash
   docker build -t yametee:test .
   ```

3. **Run Container**:

   ```bash
   docker run -d \
     --name yametee-test \
     -p 3000:3000 \
     -e DATABASE_URL="your-database-url" \
     -e PAYMONGO_SECRET_KEY="sk_test_..." \
     -e PAYMONGO_PUBLIC_KEY="pk_test_..." \
     -e PAYMONGO_WEBHOOK_SECRET="whsec_..." \
     -e NEXTAUTH_URL="http://localhost:3000" \
     -e NEXTAUTH_SECRET="your-generated-secret" \
     -e ADMIN_JWT_SECRET="your-generated-secret" \
     yametee:test
   ```

4. **Check Health**:

   ```bash
   curl http://localhost:3000/api/health
   ```

5. **View Logs**:
   ```bash
   docker logs -f yametee-test
   ```

**✅ Done!** App running at http://localhost:3000

---

### ☸️ Option 3: Kubernetes (Advanced)

**Time:** ~15 minutes | **Difficulty:** ⭐⭐⭐ Advanced

See `docs/DEPLOYMENT_RUNBOOK.md` for detailed K8s deployment steps.

---

## ⚡ Quick Pre-Deployment Check

Run these commands to verify everything is ready:

```bash
# 1. Check build works
npm run build

# 2. Check linting
npm run lint

# 3. Check types
npm run type-check

# 4. Verify environment variables are set
# (Check your .env file or deployment platform)
```

---

## 🔍 Post-Deployment Verification

After deploying, test these endpoints:

```bash
# Health check
curl https://your-deployment-url/api/health

# Products API
curl https://your-deployment-url/api/products

# Homepage
curl -I https://your-deployment-url/
```

**Expected Health Response:**

```json
{
  "status": "healthy",
  "timestamp": "2025-01-XX...",
  "service": "yametee-api",
  "checks": {
    "database": "connected"
  }
}
```

---

## 🆘 Troubleshooting

### Build Fails

- Check Node.js version: `node --version` (should be 20+)
- Clear cache: `rm -rf .next node_modules && npm install`
- Check for TypeScript errors: `npm run type-check`

### Database Connection Fails

- Verify `DATABASE_URL` format: `postgresql://user:pass@host:port/db`
- Check database is accessible from deployment environment
- Verify firewall rules allow connection

### Environment Variables Missing

- Check deployment platform (Vercel/Docker/K8s) has all required vars
- Verify variable names match exactly (case-sensitive)
- Restart deployment after adding variables

### Health Check Fails

- Check application logs for errors
- Verify database connection
- Ensure port 3000 is accessible

---

## 📚 Need More Help?

- **Full Runbook:** `docs/DEPLOYMENT_RUNBOOK.md`
- **Environment Variables:** `docs/ENVIRONMENT_VARIABLES.md`
- **Checklist:** `TEST_DEPLOYMENT_CHECKLIST.md`

---

## ✅ Deployment Checklist

- [ ] Build succeeds locally
- [ ] All environment variables configured
- [ ] Database is accessible
- [ ] Secrets generated (NEXTAUTH_SECRET, ADMIN_JWT_SECRET)
- [ ] Deployment executed
- [ ] Health check passes
- [ ] Homepage loads
- [ ] Admin login works

**Good luck with your deployment! 🚀**
