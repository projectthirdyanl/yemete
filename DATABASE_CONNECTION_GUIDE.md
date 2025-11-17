# Database Connection Guide: Vercel → Proxmox PostgreSQL

## 🎯 The Problem

Your Next.js app is deployed on **Vercel** (public cloud), but your PostgreSQL database is on a **Proxmox container** with a **private IP** (`192.168.120.6`).

**Architecture:**

```
┌─────────────────┐         ❌ Cannot Connect         ┌──────────────────┐
│   Vercel App    │ ───────────────────────────────> │  Proxmox DB      │
│  (Public Cloud) │                                   │ (192.168.120.6)  │
│                 │                                   │  (Private IP)    │
└─────────────────┘                                   └──────────────────┘
```

**Why it fails:**

- Vercel servers are on the public internet
- `192.168.x.x` is a private/local network IP
- Vercel cannot reach private IPs directly

---

## ✅ Solution Options

### **Option 1: Cloudflare Tunnel (Recommended - Free & Secure)** ⭐

**Best for:** Production apps, free, secure, no port forwarding needed

**How it works:**

- Cloudflare Tunnel creates a secure outbound connection from your Proxmox server
- No need to expose your database publicly
- Free SSL/TLS encryption
- No firewall changes needed

**Steps:**

1. **Install Cloudflare Tunnel on Proxmox server:**

   ```bash
   # On your Proxmox container (192.168.120.6)
   curl -L https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64 -o cloudflared
   chmod +x cloudflared
   sudo mv cloudflared /usr/local/bin/
   ```

2. **Authenticate with Cloudflare:**

   ```bash
   cloudflared tunnel login
   ```

3. **Create a tunnel:**

   ```bash
   cloudflared tunnel create yametee-db
   ```

4. **Create config file** (`/etc/cloudflared/config.yml`):

   ```yaml
   tunnel: <tunnel-id>
   credentials-file: /root/.cloudflared/<tunnel-id>.json

   ingress:
     - hostname: db.yametee.yourdomain.com # Optional: custom domain
       service: tcp://localhost:5432
     - service: http_status:404
   ```

5. **Run the tunnel:**

   ```bash
   cloudflared tunnel run yametee-db
   ```

6. **Get the connection URL:**

   ```bash
   cloudflared tunnel route dns yametee-db db.yametee.yourdomain.com
   ```

7. **Update Vercel DATABASE_URL:**
   ```
   postgresql://itadmin:!admin00@db.yametee.yourdomain.com:5432/yame_tee?schema=public&sslmode=require
   ```

---

### **Option 2: Tailscale VPN (Recommended - Easy Setup)** ⭐

**Best for:** Quick setup, secure, free for personal use

**How it works:**

- Creates a secure mesh VPN network
- Both Vercel (via Tailscale Funnel) and Proxmox join the same network
- Database gets a Tailscale IP address

**Steps:**

1. **Install Tailscale on Proxmox container:**

   ```bash
   curl -fsSL https://tailscale.com/install.sh | sh
   sudo tailscale up
   ```

2. **Get Tailscale IP** (e.g., `100.x.x.x`)

3. **Enable Tailscale Funnel** (for Vercel access):

   ```bash
   sudo tailscale funnel 5432
   ```

4. **Update Vercel DATABASE_URL:**
   ```
   postgresql://itadmin:!admin00@<tailscale-ip>:5432/yame_tee?schema=public
   ```

---

### **Option 3: SSH Tunnel via Public Server**

**Best for:** You have a public VPS/server

**How it works:**

- Use an existing public server as a bridge
- Create SSH tunnel from public server to Proxmox DB
- Vercel connects to public server

**Steps:**

1. **On your public server**, create SSH tunnel:

   ```bash
   ssh -L 5432:192.168.120.6:5432 user@your-public-server.com -N
   ```

2. **Update Vercel DATABASE_URL:**
   ```
   postgresql://itadmin:!admin00@your-public-server.com:5432/yame_tee?schema=public&sslmode=require
   ```

---

### **Option 4: Expose Database Publicly (NOT Recommended)** ⚠️

**Security Risk:** Only use for testing, never production!

**Steps:**

1. **Configure PostgreSQL** (`/etc/postgresql/*/postgresql.conf`):

   ```conf
   listen_addresses = '*'
   ```

2. **Update firewall** (on Proxmox host):

   ```bash
   sudo ufw allow 5432/tcp
   ```

3. **Update pg_hba.conf**:

   ```
   host    all    all    0.0.0.0/0    md5
   ```

4. **Get public IP** of Proxmox server

5. **Update Vercel DATABASE_URL:**
   ```
   postgresql://itadmin:!admin00@<public-ip>:5432/yame_tee?schema=public&sslmode=require
   ```

**⚠️ Security Notes:**

- Use strong passwords
- Enable SSL/TLS (`sslmode=require`)
- Consider IP whitelisting (Vercel IPs)
- Use fail2ban for brute-force protection

---

### **Option 5: Use Managed Database (Easiest)** 🚀

**Best for:** Production apps, no infrastructure management

**Options:**

- **Vercel Postgres** (integrated with Vercel)
- **Supabase** (free tier available)
- **Neon** (serverless Postgres)
- **Railway** (simple setup)

**Migration Steps:**

1. **Export data from Proxmox:**

   ```bash
   pg_dump -h 192.168.120.6 -U itadmin -d yame_tee > backup.sql
   ```

2. **Create new managed database**

3. **Import data:**

   ```bash
   psql -h <managed-db-host> -U <user> -d <database> < backup.sql
   ```

4. **Update Vercel DATABASE_URL** with managed database URL

---

## 🔧 Configuring Vercel Environment Variables

Once you have a working database connection URL:

### **Via Vercel Dashboard:**

1. Go to your project on [vercel.com](https://vercel.com)
2. Click **Settings** → **Environment Variables**
3. Add `DATABASE_URL`:
   - **Key:** `DATABASE_URL`
   - **Value:** `postgresql://itadmin:!admin00@<host>:5432/yame_tee?schema=public`
   - **Environment:** Select all (Production, Preview, Development)
4. Click **Save**
5. **Redeploy** your application

### **Via Vercel CLI:**

```bash
vercel env add DATABASE_URL
# Paste your connection string when prompted
# Select environments: production, preview, development

# Redeploy
vercel --prod
```

---

## 🔒 Security Best Practices

### **1. Use SSL/TLS:**

Always add `?sslmode=require` to your connection string:

```
postgresql://user:pass@host:5432/db?schema=public&sslmode=require
```

### **2. Strong Passwords:**

- Use complex passwords (min 16 characters)
- Consider using password managers
- Rotate passwords regularly

### **3. Connection Pooling:**

Add connection pool settings:

```
postgresql://user:pass@host:5432/db?schema=public&connection_limit=10&pool_timeout=20
```

### **4. IP Whitelisting (if exposing publicly):**

Only allow Vercel IPs:

```sql
-- In pg_hba.conf
host    all    all    <vercel-ip-range>    md5
```

### **5. Use Environment Variables:**

Never commit database credentials to Git!

---

## 🧪 Testing the Connection

### **1. Test from Local Machine:**

```bash
# Test connection
psql "postgresql://itadmin:!admin00@<host>:5432/yame_tee?schema=public"

# Or using Prisma
npx prisma db pull
```

### **2. Test from Vercel:**

Create a test API route (`app/api/test-db/route.ts`):

```typescript
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`
    return NextResponse.json({
      status: 'connected',
      timestamp: new Date().toISOString(),
    })
  } catch (error: any) {
    return NextResponse.json(
      {
        status: 'error',
        error: error.message,
      },
      { status: 500 }
    )
  }
}
```

Visit: `https://your-app.vercel.app/api/test-db`

---

## 📋 Quick Checklist

- [ ] Choose a connection method (Cloudflare Tunnel recommended)
- [ ] Set up tunnel/VPN/public access
- [ ] Test connection from local machine
- [ ] Add `DATABASE_URL` to Vercel environment variables
- [ ] Add `sslmode=require` for SSL
- [ ] Redeploy Vercel application
- [ ] Test connection from Vercel (`/api/test-db`)
- [ ] Verify Prisma migrations are applied
- [ ] Test full application functionality

---

## 🆘 Troubleshooting

### **Error: "Connection refused"**

- Check if database is listening on the correct port
- Verify firewall rules allow connections
- Check if PostgreSQL is running: `sudo systemctl status postgresql`

### **Error: "Authentication failed"**

- Verify username/password are correct
- Check `pg_hba.conf` authentication method
- Ensure user has proper permissions

### **Error: "SSL required"**

- Add `?sslmode=require` to connection string
- Or configure PostgreSQL SSL certificates

### **Error: "Too many connections"**

- Add connection pooling: `?connection_limit=10`
- Check PostgreSQL `max_connections` setting
- Consider using PgBouncer

### **Vercel Build Fails:**

- Ensure `DATABASE_URL` is set in Vercel environment variables
- Check build logs for specific errors
- Verify Prisma Client is generated: `npx prisma generate`

---

## 📚 Additional Resources

- [Cloudflare Tunnel Docs](https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/)
- [Tailscale Docs](https://tailscale.com/kb/)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
- [Prisma Connection Strings](https://www.prisma.io/docs/concepts/database-connectors/postgresql#connection-details)

---

## 💡 Recommendation

For **production**, I recommend **Option 1 (Cloudflare Tunnel)** or **Option 5 (Managed Database)**:

- **Cloudflare Tunnel:** Free, secure, no public exposure
- **Managed Database:** Easiest, reliable, but costs money

For **quick testing**, use **Option 2 (Tailscale)** or **Option 4 (Public IP)** with strong security measures.
