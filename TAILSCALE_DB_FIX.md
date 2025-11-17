# 🔧 Fixing Tailscale Database Connection

## Current Status

✅ Tailscale installed: `100.117.39.63`  
❌ PostgreSQL not accessible via Tailscale IP

## The Problem

PostgreSQL is probably only listening on `localhost` or `192.168.120.6`, not on the Tailscale interface.

---

## ✅ Solution: Configure PostgreSQL for Tailscale

### Step 1: Check PostgreSQL Listen Address

On your **Proxmox container** (where PostgreSQL runs):

```bash
# Check current PostgreSQL config
sudo grep "listen_addresses" /etc/postgresql/*/postgresql.conf
```

**Expected output:** `listen_addresses = 'localhost'` or `listen_addresses = '192.168.120.6'`

### Step 2: Update PostgreSQL to Listen on All Interfaces

```bash
# Edit PostgreSQL config (replace * with your version number, e.g., 14, 15, 16)
sudo nano /etc/postgresql/*/postgresql.conf
```

**Find this line:**

```conf
listen_addresses = 'localhost'
```

**Change to:**

```conf
listen_addresses = '*'
```

**Save and exit** (Ctrl+X, then Y, then Enter)

### Step 3: Update pg_hba.conf (Authentication)

```bash
# Edit pg_hba.conf
sudo nano /etc/postgresql/*/main/pg_hba.conf
```

**Add these lines at the top** (before other rules):

```conf
# Tailscale network (100.x.x.x/8)
host    all    all    100.0.0.0/8    md5

# Allow local connections
local   all    all                  peer
host    all    all    127.0.0.1/32  md5
host    all    all    ::1/128       md5
```

**Save and exit**

### Step 4: Restart PostgreSQL

```bash
sudo systemctl restart postgresql
```

### Step 5: Verify PostgreSQL is Listening

```bash
# Check if PostgreSQL is listening on all interfaces
sudo netstat -tlnp | grep 5432
# OR
sudo ss -tlnp | grep 5432
```

**You should see:**

```
0.0.0.0:5432  (listening on all interfaces)
```

### Step 6: Test Connection Locally (from Proxmox container)

```bash
# Test connection using Tailscale IP
psql -h 100.117.39.63 -U itadmin -d yame_tee -c "SELECT 1;"
```

If this works, PostgreSQL is configured correctly!

---

## 🔓 Enable Tailscale Funnel (For Vercel Access)

Vercel needs to access your database through Tailscale. You have two options:

### Option A: Tailscale Funnel (Easiest)

```bash
# Enable funnel for port 5432
sudo tailscale funnel 5432
```

This will give you a public URL that forwards to your database.

**Update Vercel DATABASE_URL:**

```
postgresql://itadmin:!admin00@<funnel-url>:5432/yame_tee?schema=public&sslmode=require
```

### Option B: Join Vercel to Your Tailscale Network (Not Possible)

Vercel servers can't join Tailscale networks, so you **must use Funnel** for Vercel to connect.

---

## 🧪 Test Connection from Vercel

After enabling Funnel, update your Vercel `DATABASE_URL` and test:

1. **Get Funnel URL:**

   ```bash
   sudo tailscale funnel 5432
   # Output: https://xxxxx.ts.net:5432
   ```

2. **Update Vercel Environment Variable:**
   - Go to Vercel Dashboard → Settings → Environment Variables
   - Update `DATABASE_URL`:
     ```
     postgresql://itadmin:!admin00@xxxxx.ts.net:5432/yame_tee?schema=public&sslmode=require
     ```

3. **Redeploy** your Vercel app

4. **Test:** Visit `https://your-app.vercel.app/api/test-db`

---

## 🔍 Troubleshooting

### Error: "Can't reach database server"

**Check 1:** Is PostgreSQL listening?

```bash
sudo ss -tlnp | grep 5432
```

**Check 2:** Is Tailscale Funnel enabled?

```bash
sudo tailscale funnel status
```

**Check 3:** Test from local machine (if you have Tailscale):

```bash
psql "postgresql://itadmin:!admin00@100.117.39.63:5432/yame_tee"
```

### Error: "Authentication failed"

**Fix:** Check `pg_hba.conf` has the Tailscale network rule:

```conf
host    all    all    100.0.0.0/8    md5
```

### Error: "Connection refused"

**Fix:** PostgreSQL not listening on all interfaces:

```bash
# Edit postgresql.conf
sudo nano /etc/postgresql/*/postgresql.conf
# Set: listen_addresses = '*'
sudo systemctl restart postgresql
```

---

## 📋 Quick Checklist

- [ ] PostgreSQL `listen_addresses = '*'` in `postgresql.conf`
- [ ] `pg_hba.conf` has `100.0.0.0/8` rule for Tailscale
- [ ] PostgreSQL restarted: `sudo systemctl restart postgresql`
- [ ] Verified listening: `sudo ss -tlnp | grep 5432`
- [ ] Tailscale Funnel enabled: `sudo tailscale funnel 5432`
- [ ] Updated Vercel `DATABASE_URL` with Funnel URL
- [ ] Redeployed Vercel app
- [ ] Tested `/api/test-db` endpoint

---

## 🎯 Alternative: Use Direct Tailscale IP (If Vercel Can Join)

**Note:** Vercel servers **cannot** join Tailscale networks directly. You **must** use Funnel.

If you want to test locally first (from a machine with Tailscale):

```bash
# Test connection
psql "postgresql://itadmin:!admin00@100.117.39.63:5432/yame_tee"
```

This should work once PostgreSQL is configured correctly!
