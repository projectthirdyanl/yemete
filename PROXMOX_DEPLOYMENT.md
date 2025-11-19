# Proxmox Deployment Quick Start

This guide provides a quick reference for deploying Yametee on your Proxmox server with distributed architecture.

## Architecture

- **Web Platform**: `192.168.120.50` - Next.js application
- **Database**: `192.168.120.42` - PostgreSQL
- **Cache**: `192.168.120.44` - Redis
- **Background Jobs**: `192.168.120.45` - Worker process
- **Tunnel/Proxy**: `192.168.120.38` - Cloudflare Tunnel or Nginx

## Deployment Method

This guide uses **Direct Installation** with systemd for process management. No Docker required.

## Direct Installation Method

This method installs the application directly on the system without Docker, using systemd for process management.

### Prerequisites

- Ubuntu/Debian-based CT or VM
- Root or sudo access
- Network connectivity between all VMs

### Step 1: Setup Node.js (Run on Web Platform and Worker VMs)

```bash
# On web-platform VM (192.168.120.50) and worker VM (192.168.120.45)
cd yametee
sudo bash proxmox/setup-nodejs.sh
```

This script will:

- Install Node.js 20.x
- Install npm and required build tools
- Install global packages (tsx, prisma, pm2)

### Step 2: Database Setup (192.168.120.42)

```bash
# Install PostgreSQL
sudo apt update
sudo apt install postgresql postgresql-contrib

# Create database and user
sudo -u postgres psql
```

```sql
CREATE DATABASE yame_tee;
CREATE USER yametee_user WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE yame_tee TO yametee_user;
\q
```

```bash
# Configure PostgreSQL to accept connections
sudo nano /etc/postgresql/*/main/postgresql.conf
# Set: listen_addresses = '*'

sudo nano /etc/postgresql/*/main/pg_hba.conf
# Add: host    all    all    192.168.120.0/24    md5

sudo systemctl restart postgresql
```

### Step 3: Redis Setup (192.168.120.44)

```bash
# Install Redis directly (no Docker)
sudo apt install redis-server

# Configure Redis to accept connections from internal network
sudo nano /etc/redis/redis.conf
# Comment out: bind 127.0.0.1
# Or set: bind 0.0.0.0

# Restart Redis
sudo systemctl enable redis-server
sudo systemctl restart redis-server

# Configure firewall (if using ufw)
sudo ufw allow from 192.168.120.0/24 to any port 6379
```

### Step 4: Web Platform Deployment (192.168.120.50)

```bash
# Clone repository
git clone <your-repo> yametee
cd yametee

# Create .env file
cp .env.example .env
nano .env
```

Update `.env` with your configuration:

```bash
DATABASE_URL="postgresql://yametee_user:your_password@192.168.120.42:5432/yame_tee?schema=public"
REDIS_URL="redis://192.168.120.44:6379"
NEXTAUTH_URL="https://your-domain.com"  # Or http://192.168.120.50:3000
NODE_ENV="production"
# ... other variables (see .env.example)
```

```bash
# Deploy web platform (run as root or with sudo)
sudo bash proxmox/deploy-web-direct.sh
```

This script will:

- Install dependencies
- Generate Prisma Client
- Run database migrations
- Build the Next.js application
- Create and start systemd service

### Step 5: Background Worker Deployment (192.168.120.45)

```bash
# Clone same repository
git clone <your-repo> yametee
cd yametee

# Create .env file (same as web platform, but NEXTAUTH_URL not needed)
cp .env.example .env
nano .env

# Deploy worker (run as root or with sudo)
sudo bash proxmox/deploy-worker-direct.sh
```

### Step 6: Configure Tunnel/Proxy (192.168.120.38)

See [Tunnel/Proxy Setup](#5-tunnelproxy-setup-19216812038) section below.

### Managing Services

```bash
# Web Platform
sudo systemctl status yametee-web
sudo systemctl restart yametee-web
sudo journalctl -u yametee-web -f

# Worker
sudo systemctl status yametee-worker
sudo systemctl restart yametee-worker
sudo journalctl -u yametee-worker -f
```

### Updating Application

```bash
# On web-platform VM
cd yametee
git pull
sudo bash proxmox/deploy-web-direct.sh

# On worker VM
cd yametee
git pull
sudo bash proxmox/deploy-worker-direct.sh
```

### 5. Tunnel/Proxy Setup (192.168.120.38)

#### Option A: Cloudflare Tunnel

```bash
# Install cloudflared
wget https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
sudo dpkg -i cloudflared-linux-amd64.deb

# Login and create tunnel
cloudflared tunnel login
cloudflared tunnel create yametee
cloudflared tunnel route dns yametee your-domain.com

# Create config: ~/.cloudflared/config.yml
tunnel: <tunnel-id>
credentials-file: /home/user/.cloudflared/<tunnel-id>.json

ingress:
  - hostname: your-domain.com
    service: http://192.168.120.50:3000
  - service: http_status:404

# Run tunnel
cloudflared tunnel run yametee
```

#### Option B: Nginx Reverse Proxy

```bash
sudo apt install nginx
sudo nano /etc/nginx/sites-available/yametee
```

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://192.168.120.50:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/yametee /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## Verification

### Check Web Platform

```bash
curl http://192.168.120.50:3000/api/health
```

### Check Worker

```bash
# On worker VM
sudo systemctl status yametee-worker
sudo journalctl -u yametee-worker -f
```

### Check Database Connection

```bash
psql -h 192.168.120.42 -U yametee_user -d yame_tee
```

### Check Redis Connection

```bash
redis-cli -h 192.168.120.44 ping
```

## Common Issues

### Database Connection Failed

1. Check PostgreSQL is running: `sudo systemctl status postgresql`
2. Check firewall: `sudo ufw allow from 192.168.120.0/24 to any port 5432`
3. Verify credentials: `psql -h 192.168.120.42 -U yametee_user -d yame_tee`

### Redis Connection Failed

1. Check Redis is running: `sudo systemctl status redis-server` or `redis-cli ping`
2. Check firewall: `sudo ufw allow from 192.168.120.0/24 to any port 6379`
3. Test connection: `redis-cli -h 192.168.120.44 ping`

### Worker Not Processing Jobs

1. Check logs: `sudo journalctl -u yametee-worker -f`
2. Verify Redis connection
3. Check if jobs are queued: `redis-cli -h 192.168.120.44 LLEN yametee:jobs`

## Updates

### Update Web Platform

```bash
cd yametee
git pull
sudo bash proxmox/deploy-web-direct.sh
```

### Update Worker

```bash
cd yametee
git pull
sudo bash proxmox/deploy-worker-direct.sh
```

### Database Migrations

```bash
# On web platform VM
cd /opt/yametee
sudo -u yametee git pull
sudo -u yametee npx prisma migrate deploy
```

## Monitoring

- **Health Check**: `http://192.168.120.50:3000/api/health`
- **Service Logs**: `sudo journalctl -u yametee-web -f` or `sudo journalctl -u yametee-worker -f`
- **Service Status**: `sudo systemctl status yametee-web` or `sudo systemctl status yametee-worker`
- **Database**: Monitor PostgreSQL logs and connections
- **Redis**: Monitor memory usage and connection count

## Security Checklist

- [ ] Firewall rules configured (only allow necessary ports)
- [ ] Database access restricted to internal network
- [ ] Redis access restricted to internal network
- [ ] Strong passwords for database and secrets
- [ ] SSL/TLS configured (via Cloudflare Tunnel or Let's Encrypt)
- [ ] Regular backups scheduled
- [ ] Environment variables secured (not committed to git)

## Support

For detailed documentation, see:

- `proxmox/README.md` - Comprehensive deployment guide
- `docs/ENVIRONMENT_VARIABLES.md` - Environment variable reference
- `docs/DEPLOYMENT_RUNBOOK.md` - General deployment procedures
