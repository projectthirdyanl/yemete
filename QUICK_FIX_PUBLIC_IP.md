# 🚀 Quick Fix: Expose PostgreSQL Publicly (Testing Only)

## ⚠️ WARNING

**This exposes your database to the internet. Only use for testing!**

For production, use Cloudflare Tunnel or a managed database.

---

## ✅ Quick Setup (5 minutes)

### Step 1: Get Public IP of Proxmox Server

```bash
# On Proxmox host or container
curl ifconfig.me
# OR
curl ipinfo.io/ip
```

Save this IP address (e.g., `203.0.113.45`)

### Step 2: Configure PostgreSQL (On Proxmox Container)

```bash
# Find PostgreSQL version
PG_VERSION=$(ls /etc/postgresql/ | head -1)
echo "PostgreSQL version: $PG_VERSION"

# Update listen_addresses
sudo sed -i "s/#listen_addresses = 'localhost'/listen_addresses = '*'/g" /etc/postgresql/$PG_VERSION/main/postgresql.conf
sudo sed -i "s/listen_addresses = 'localhost'/listen_addresses = '*'/g" /etc/postgresql/$PG_VERSION/main/postgresql.conf

# Add public access to pg_hba.conf (ALLOW ALL - INSECURE!)
echo "host    all    all    0.0.0.0/0    md5" | sudo tee -a /etc/postgresql/$PG_VERSION/main/pg_hba.conf

# Restart PostgreSQL
sudo systemctl restart postgresql

# Verify listening
sudo ss -tlnp | grep 5432
# Should show: 0.0.0.0:5432
```

### Step 3: Configure Firewall (On Proxmox Host)

```bash
# Allow PostgreSQL port
sudo ufw allow 5432/tcp

# Or if using iptables
sudo iptables -A INPUT -p tcp --dport 5432 -j ACCEPT
```

### Step 4: Update Vercel DATABASE_URL

Go to Vercel Dashboard → Settings → Environment Variables

Update `DATABASE_URL`:

```
postgresql://itadmin:!admin00@<PUBLIC-IP>:5432/yame_tee?schema=public&sslmode=require
```

Replace `<PUBLIC-IP>` with your actual public IP.

### Step 5: Redeploy Vercel

After updating `DATABASE_URL`, redeploy your Vercel app.

### Step 6: Test

Visit: `https://your-app.vercel.app/api/test-db`

---

## 🔒 Security Improvements (If Keeping Public)

### 1. Restrict to Vercel IPs Only

```bash
# Get Vercel IP ranges (they change, check regularly)
# Add to pg_hba.conf instead of 0.0.0.0/0
host    all    all    <vercel-ip-range>    md5
```

### 2. Use Strong Password

```bash
# Change PostgreSQL password
sudo -u postgres psql
ALTER USER itadmin WITH PASSWORD 'very-strong-password-here';
\q
```

### 3. Enable SSL/TLS

Already done with `sslmode=require` in connection string.

### 4. Install fail2ban

```bash
sudo apt install fail2ban
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

---

## 🎯 Recommended: Switch to Cloudflare Tunnel

After testing, **switch to Cloudflare Tunnel** for better security:

See: `CLOUDFLARE_TUNNEL_SETUP.md`

---

## 📋 Checklist

- [ ] Got public IP of Proxmox server
- [ ] PostgreSQL listening on all interfaces (`listen_addresses = '*'`)
- [ ] `pg_hba.conf` allows connections (`0.0.0.0/0` or specific IPs)
- [ ] Firewall allows port 5432
- [ ] PostgreSQL restarted
- [ ] Updated Vercel `DATABASE_URL` with public IP
- [ ] Added `&sslmode=require` for SSL
- [ ] Redeployed Vercel app
- [ ] Tested `/api/test-db` endpoint
- [ ] **Plan to switch to Cloudflare Tunnel for production**
