# 🚀 Quick Database Setup for Vercel

## The Problem

Your database is on **private IP** `192.168.120.6` - Vercel can't reach it!

```
Vercel (Public) ❌ → 192.168.120.6 (Private Network)
```

---

## ✅ Easiest Solutions (Pick One)

### **Option A: Tailscale (5 minutes) ⭐ RECOMMENDED**

**Why:** Free, secure, easy setup

1. **Install Tailscale on Proxmox container:**

   ```bash
   curl -fsSL https://tailscale.com/install.sh | sh
   sudo tailscale up
   ```

2. **Get your Tailscale IP** (looks like `100.x.x.x`)

3. **Enable Funnel** (allows Vercel to connect):

   ```bash
   sudo tailscale funnel 5432
   ```

4. **Update Vercel DATABASE_URL:**
   ```
   postgresql://itadmin:!admin00@<tailscale-ip>:5432/yame_tee?schema=public&sslmode=require
   ```

**Done!** ✅

---

### **Option B: Cloudflare Tunnel (10 minutes)**

**Why:** Free, secure, no VPN needed

1. **Install on Proxmox:**

   ```bash
   curl -L https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64 -o cloudflared
   chmod +x cloudflared && sudo mv cloudflared /usr/local/bin/
   ```

2. **Login:**

   ```bash
   cloudflared tunnel login
   ```

3. **Create tunnel:**

   ```bash
   cloudflared tunnel create yametee-db
   ```

4. **Run tunnel:**

   ```bash
   cloudflared tunnel run yametee-db
   ```

5. **Get connection URL** and update Vercel `DATABASE_URL`

---

### **Option C: Expose Publicly (Quick Test Only) ⚠️**

**Warning:** Only for testing! Not secure for production!

1. **On Proxmox container**, edit PostgreSQL config:

   ```bash
   sudo nano /etc/postgresql/*/postgresql.conf
   # Change: listen_addresses = '*'
   ```

2. **Edit pg_hba.conf:**

   ```bash
   sudo nano /etc/postgresql/*/main/pg_hba.conf
   # Add: host    all    all    0.0.0.0/0    md5
   ```

3. **Restart PostgreSQL:**

   ```bash
   sudo systemctl restart postgresql
   ```

4. **Open firewall:**

   ```bash
   sudo ufw allow 5432/tcp
   ```

5. **Get public IP** of Proxmox server

6. **Update Vercel DATABASE_URL:**
   ```
   postgresql://itadmin:!admin00@<public-ip>:5432/yame_tee?schema=public&sslmode=require
   ```

---

## 🔧 Update Vercel Environment Variables

1. Go to: https://vercel.com/dashboard
2. Select your project → **Settings** → **Environment Variables**
3. Add/Update `DATABASE_URL`:
   - **Key:** `DATABASE_URL`
   - **Value:** Your new connection string (from Option A, B, or C)
   - **Environment:** Select all (Production, Preview, Development)
4. Click **Save**
5. **Redeploy:** Go to **Deployments** → Click **⋯** → **Redeploy**

---

## 🧪 Test Connection

After updating `DATABASE_URL`, test it:

1. **Visit:** `https://your-app.vercel.app/api/test-db`
2. **Should see:**
   ```json
   {
     "status": "connected",
     "timestamp": "2025-01-XX..."
   }
   ```

If you see an error, check:

- ✅ `DATABASE_URL` is set correctly in Vercel
- ✅ Database is accessible from internet (if using public IP)
- ✅ Firewall allows connections
- ✅ PostgreSQL is running

---

## 📋 Quick Checklist

- [ ] Choose connection method (Tailscale recommended)
- [ ] Set up tunnel/VPN/public access
- [ ] Test connection locally first
- [ ] Update `DATABASE_URL` in Vercel
- [ ] Add `&sslmode=require` for security
- [ ] Redeploy Vercel app
- [ ] Test `/api/test-db` endpoint
- [ ] Verify app works!

---

## 🆘 Need Help?

See full guide: `DATABASE_CONNECTION_GUIDE.md`

**Common Issues:**

- **"Connection refused"** → Database not accessible from internet
- **"Authentication failed"** → Wrong username/password
- **"SSL required"** → Add `&sslmode=require` to connection string
