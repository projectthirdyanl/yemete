# 🔧 Cloudflare Tunnel Setup for PostgreSQL

## Why Cloudflare Tunnel?

Tailscale Funnel only supports HTTP/HTTPS, not raw TCP connections like PostgreSQL. Cloudflare Tunnel supports TCP, making it perfect for database connections.

---

## ✅ Step-by-Step Setup

### Step 1: Install Cloudflared on Proxmox Container

```bash
# Download and install cloudflared
curl -L https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64 -o cloudflared
chmod +x cloudflared
sudo mv cloudflared /usr/local/bin/

# Verify installation
cloudflared --version
```

### Step 2: Login to Cloudflare

```bash
cloudflared tunnel login
```

This will:

- Open your browser
- Ask you to select a domain from your Cloudflare account
- Authenticate and save credentials

**Note:** You need a domain managed by Cloudflare. If you don't have one:

- Register a domain at Cloudflare (or transfer existing domain)
- Or use a free subdomain service

### Step 3: Create a Tunnel

```bash
cloudflared tunnel create yametee-db
```

This will output a **Tunnel ID** (save this!)

### Step 4: Create Config File

```bash
# Create config directory
sudo mkdir -p /etc/cloudflared

# Create config file
sudo nano /etc/cloudflared/config.yml
```

**Paste this configuration:**

```yaml
tunnel: <TUNNEL-ID> # Replace with your tunnel ID from Step 3
credentials-file: /root/.cloudflared/<TUNNEL-ID>.json

ingress:
  - hostname: db.yametee.yourdomain.com # Replace with your domain
    service: tcp://localhost:5432
  - service: http_status:404
```

**Save and exit** (Ctrl+X, Y, Enter)

### Step 5: Create DNS Record

```bash
cloudflared tunnel route dns yametee-db db.yametee.yourdomain.com
```

This creates a DNS record pointing to your tunnel.

### Step 6: Run the Tunnel

**Option A: Run manually (for testing)**

```bash
cloudflared tunnel run yametee-db
```

**Option B: Install as a service (for production)**

```bash
# Install as systemd service
sudo cloudflared service install

# Start the service
sudo systemctl start cloudflared
sudo systemctl enable cloudflared

# Check status
sudo systemctl status cloudflared
```

### Step 7: Update Vercel DATABASE_URL

Go to Vercel Dashboard → Settings → Environment Variables

Update `DATABASE_URL`:

```
postgresql://itadmin:!admin00@db.yametee.yourdomain.com:5432/yame_tee?schema=public&sslmode=require
```

**Note:** Use port `5432` (Cloudflare Tunnel preserves the original port)

### Step 8: Redeploy Vercel

After updating `DATABASE_URL`, redeploy your Vercel app.

---

## 🧪 Test Connection

1. **Test locally** (if you have Cloudflare WARP installed):

   ```bash
   psql "postgresql://itadmin:!admin00@db.yametee.yourdomain.com:5432/yame_tee"
   ```

2. **Test from Vercel:**
   - Visit: `https://your-app.vercel.app/api/test-db`
   - Should show: `{"status": "connected", ...}`

---

## 🔍 Troubleshooting

### Error: "Can't reach database server"

**Check 1:** Is the tunnel running?

```bash
sudo systemctl status cloudflared
# OR
ps aux | grep cloudflared
```

**Check 2:** Check tunnel logs

```bash
sudo journalctl -u cloudflared -f
```

**Check 3:** Verify DNS record

```bash
nslookup db.yametee.yourdomain.com
```

### Error: "Connection refused"

- PostgreSQL must be listening on `localhost:5432`
- Check: `sudo ss -tlnp | grep 5432`

### Error: "Authentication failed"

- Verify PostgreSQL `pg_hba.conf` allows connections
- Test locally: `psql -h localhost -U itadmin -d yame_tee`

---

## 📋 Quick Checklist

- [ ] Cloudflared installed
- [ ] Logged in: `cloudflared tunnel login`
- [ ] Tunnel created: `cloudflared tunnel create yametee-db`
- [ ] Config file created at `/etc/cloudflared/config.yml`
- [ ] DNS record created: `cloudflared tunnel route dns`
- [ ] Tunnel running (as service or manually)
- [ ] PostgreSQL listening on `localhost:5432`
- [ ] Updated Vercel `DATABASE_URL`
- [ ] Redeployed Vercel app
- [ ] Tested `/api/test-db` endpoint

---

## 🔄 Alternative: Use Public IP (Quick Test)

If Cloudflare Tunnel setup is too complex, you can temporarily expose PostgreSQL publicly:

**⚠️ WARNING: Only for testing! Not secure for production!**

1. **Get public IP** of your Proxmox server
2. **Configure firewall** to allow port 5432
3. **Update PostgreSQL** to listen on all interfaces
4. **Use public IP** in Vercel `DATABASE_URL`

See `DATABASE_CONNECTION_GUIDE.md` for details.
