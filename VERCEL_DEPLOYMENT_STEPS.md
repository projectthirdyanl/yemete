# 🚀 Vercel Deployment Steps

## Generated Secrets (Save These!)

**NEXTAUTH_SECRET:**

```
500722c6227d4f29aa57eaf11f72153852b6652e81b80e32b03ad35c39088ed0e0b1246bc4e0cdae28f6eff26f3bd1186db2b521842672ca1b4df7a651eaa2a1
```

**ADMIN_JWT_SECRET:**

```
776e946196b60b30022af132649038e6a469092b31aea45cbd922d6d81961f7554998b2eb1fb3a5732424f65c7d7de1376885b15609a6154ae89a8fa4770a168
```

⚠️ **IMPORTANT:** Save these secrets securely! You'll need them for Vercel environment variables.

---

## Step-by-Step Deployment

### Step 1: Login to Vercel

```bash
vercel login
```

This will:

- Open your browser
- Ask you to authenticate with GitHub/Email
- Link your local CLI to your Vercel account

---

### Step 2: Deploy to Preview (Staging)

```bash
vercel
```

**First time prompts:**

- **Set up and deploy?** → Yes
- **Which scope?** → Select your account/team
- **Link to existing project?** → No (for first deployment)
- **Project name?** → `yametee` (or press Enter for default)
- **Directory?** → `.` (current directory)
- **Override settings?** → No (we have `vercel.json`)

This creates a **preview deployment** (staging environment).

---

### Step 3: Set Environment Variables

After deployment, you'll get a URL like: `https://yametee-xxxxx.vercel.app`

**Option A: Via Vercel Dashboard (Recommended)**

1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Click on your project (`yametee`)
3. Go to **Settings** → **Environment Variables**
4. Add each variable:

| Variable                  | Value                                                                                                                              | Environment                      |
| ------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- | -------------------------------- |
| `DATABASE_URL`            | `postgresql://itadmin:!admin00@192.168.120.6:5432/yame_tee?schema=public`                                                          | Production, Preview, Development |
| `PAYMONGO_SECRET_KEY`     | Your PayMongo secret key                                                                                                           | Production, Preview, Development |
| `PAYMONGO_PUBLIC_KEY`     | Your PayMongo public key                                                                                                           | Production, Preview, Development |
| `PAYMONGO_WEBHOOK_SECRET` | Your PayMongo webhook secret                                                                                                       | Production, Preview, Development |
| `NEXTAUTH_URL`            | `https://yametee-xxxxx.vercel.app` (your Vercel URL)                                                                               | Production, Preview              |
| `NEXTAUTH_SECRET`         | `500722c6227d4f29aa57eaf11f72153852b6652e81b80e32b03ad35c39088ed0e0b1246bc4e0cdae28f6eff26f3bd1186db2b521842672ca1b4df7a651eaa2a1` | Production, Preview, Development |
| `ADMIN_JWT_SECRET`        | `776e946196b60b30022af132649038e6a469092b31aea45cbd922d6d81961f7554998b2eb1fb3a5732424f65c7d7de1376885b15609a6154ae89a8fa4770a168` | Production, Preview, Development |
| `NODE_ENV`                | `production`                                                                                                                       | Production, Preview              |

**Note:** For `NEXTAUTH_URL`, use your actual Vercel deployment URL (you'll get this after first deploy).

**Option B: Via CLI**

```bash
# Set each variable (replace with your actual values)
vercel env add DATABASE_URL production
# Paste: postgresql://itadmin:!admin00@192.168.120.6:5432/yame_tee?schema=public

vercel env add PAYMONGO_SECRET_KEY production
# Paste your PayMongo secret key

vercel env add PAYMONGO_PUBLIC_KEY production
# Paste your PayMongo public key

vercel env add PAYMONGO_WEBHOOK_SECRET production
# Paste your PayMongo webhook secret

vercel env add NEXTAUTH_URL production
# Paste your Vercel URL (e.g., https://yametee-xxxxx.vercel.app)

vercel env add NEXTAUTH_SECRET production
# Paste: 500722c6227d4f29aa57eaf11f72153852b6652e81b80e32b03ad35c39088ed0e0b1246bc4e0cdae28f6eff26f3bd1186db2b521842672ca1b4df7a651eaa2a1

vercel env add ADMIN_JWT_SECRET production
# Paste: 776e946196b60b30022af132649038e6a469092b31aea45cbd922d6d81961f7554998b2eb1fb3a5732424f65c7d7de1376885b15609a6154ae89a8fa4770a168

# Repeat for "preview" and "development" environments if needed
```

---

### Step 4: Redeploy with Environment Variables

After setting environment variables, redeploy:

```bash
# For preview/staging
vercel

# For production (when ready)
vercel --prod
```

---

### Step 5: Verify Deployment

1. **Check Health Endpoint:**

   ```bash
   curl https://your-app.vercel.app/api/health
   ```

   Expected response:

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

2. **Test Homepage:**
   - Visit: `https://your-app.vercel.app`
   - Should load without errors

3. **Test Admin Login:**
   - Visit: `https://your-app.vercel.app/admin/login`
   - Should show login page

---

## 🎯 Quick Commands Reference

```bash
# Login to Vercel
vercel login

# Deploy to preview
vercel

# Deploy to production
vercel --prod

# List deployments
vercel ls

# View logs
vercel logs

# List environment variables
vercel env ls

# Remove environment variable
vercel env rm VARIABLE_NAME

# Open project dashboard
vercel open
```

---

## ⚠️ Important Notes

1. **Database Access:** Your database at `192.168.120.6` is on a private network. Vercel deployments won't be able to access it unless:
   - You set up a VPN/tunnel
   - You use a publicly accessible database
   - You configure network access rules

2. **NEXTAUTH_URL:** Must match your actual Vercel deployment URL exactly (including `https://`)

3. **Webhook URL:** Update PayMongo webhook to point to:

   ```
   https://your-app.vercel.app/api/webhooks/paymongo
   ```

4. **Environment Variables:** Set them for all environments (Production, Preview, Development) if you want them available everywhere.

---

## 🆘 Troubleshooting

### Deployment Fails

- Check build logs in Vercel dashboard
- Verify all environment variables are set
- Check database connectivity (if database is public)

### Database Connection Error

- Verify `DATABASE_URL` is correct
- Check if database allows connections from Vercel IPs
- Consider using a publicly accessible database or VPN

### Environment Variables Not Working

- Redeploy after adding variables: `vercel --prod`
- Check variable names match exactly (case-sensitive)
- Verify variables are set for correct environment (Production/Preview)

---

## ✅ Deployment Checklist

- [ ] Vercel CLI installed
- [ ] Logged in to Vercel (`vercel login`)
- [ ] Initial deployment successful (`vercel`)
- [ ] Got deployment URL
- [ ] Set all environment variables in Vercel dashboard
- [ ] Updated `NEXTAUTH_URL` to match Vercel URL
- [ ] Redeployed with environment variables
- [ ] Health check passes (`/api/health`)
- [ ] Homepage loads
- [ ] Admin login works

**Ready to deploy? Run: `vercel login` to get started!** 🚀
