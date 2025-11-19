# Complete Deployment Guide - Multi-VM/CT Setup

This guide provides step-by-step instructions for deploying Yametee across multiple Proxmox VMs/CTs.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    PROXMOX SERVER                        │
│  Processor: 2 x Xeon Gold 6138 40C/80T                  │
│  Memory: 128GB DDR4                                      │
│  Storage: 4 x 4TB SAS 3.5"                              │
└─────────────────────────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
        ▼                   ▼                   ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│ Web Platform │    │ DB Platform  │    │ Cache Redis  │
│ 192.168.120.50│   │ 192.168.120.42│   │ 192.168.120.44│
│              │    │              │    │              │
│ Next.js App  │    │ PostgreSQL   │    │ Redis 7.4   │
└──────────────┘    └──────────────┘    └──────────────┘
        │                   │                   │
        └───────────────────┼───────────────────┘
                            │
                            ▼
                ┌──────────────────────┐
                │ Background Worker    │
                │ 192.168.120.45      │
                │                      │
                │ Job Processor        │
                └──────────────────────┘
                            │
                            ▼
                ┌──────────────────────┐
                │ Tunnel/Proxy          │
                │ 192.168.120.38       │
                │                      │
                │ Cloudflare Tunnel    │
                │ or Reverse Proxy     │
                └──────────────────────┘
```

## Prerequisites

### On Each VM/CT:

1. **Node.js 20.x** installed
2. **Network connectivity** between all VMs (bridge networking)
3. **Firewall rules** configured
4. **Systemd** available for service management
5. **Git** installed (for cloning repository)

### Network Requirements:

- Web Platform → Database (5432)
- Web Platform → Redis (6379)
- Worker → Database (5432)
- Worker → Redis (6379)
- Proxy → Web Platform (3000)

## Step 1: Prepare Environment Variables

### Generate Secrets

```bash
# Generate NEXTAUTH_SECRET
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Generate ADMIN_JWT_SECRET
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### Web Platform VM (.env)

Create `.env` file on **192.168.120.50**:

```bash
# Database
DATABASE_URL="postgresql://yametee_user:your_password@192.168.120.42:5432/yame_tee?schema=public"

# Redis
REDIS_URL="redis://192.168.120.44:6379"

# Payment Processing
PAYMONGO_SECRET_KEY="sk_live_..."
PAYMONGO_PUBLIC_KEY="pk_live_..."
PAYMONGO_WEBHOOK_SECRET="whsec_..."

# Authentication
NEXTAUTH_URL="https://your-domain.com"
NEXTAUTH_SECRET="[generated-secret]"
ADMIN_JWT_SECRET="[generated-secret]"
ADMIN_SESSION_MAX_AGE="28800"

# Application
NODE_ENV="production"
PORT="3000"
HOSTNAME="0.0.0.0"
NEXT_TELEMETRY_DISABLED="1"

# Monitoring (Optional)
MONITORING_ENABLED="true"
ALERT_WEBHOOK_URL="https://hooks.slack.com/services/YOUR/WEBHOOK"
ALERT_ERROR_RATE_THRESHOLD="0.1"
ALERT_RESPONSE_TIME_THRESHOLD="5000"
ALERT_QUEUE_LENGTH_THRESHOLD="100"
```

### Worker VM (.env)

Create `.env` file on **192.168.120.45**:

```bash
# Database
DATABASE_URL="postgresql://yametee_user:your_password@192.168.120.42:5432/yame_tee?schema=public"

# Redis
REDIS_URL="redis://192.168.120.44:6379"

# Application
NODE_ENV="production"

# Monitoring (Optional)
MONITORING_ENABLED="true"
ALERT_WEBHOOK_URL="https://hooks.slack.com/services/YOUR/WEBHOOK"
```

**Note:** Worker doesn't need `NEXTAUTH_URL`, `PAYMONGO_*`, or `ADMIN_JWT_SECRET`.

## Step 2: Database Setup (192.168.120.42)

```bash
# SSH into database VM
ssh user@192.168.120.42

# Install PostgreSQL (if not already installed)
sudo apt update
sudo apt install postgresql postgresql-contrib

# Create database and user
sudo -u postgres psql

-- In PostgreSQL prompt:
CREATE DATABASE yame_tee;
CREATE USER yametee_user WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE yame_tee TO yametee_user;
\q

# Configure PostgreSQL to accept connections
sudo nano /etc/postgresql/*/main/postgresql.conf
# Set: listen_addresses = '*'

sudo nano /etc/postgresql/*/main/pg_hba.conf
# Add: host    all    all    192.168.120.0/24    md5

# Restart PostgreSQL
sudo systemctl restart postgresql

# Test connection
psql -h 192.168.120.42 -U yametee_user -d yame_tee -c "SELECT 1"
```

## Step 3: Redis Setup (192.168.120.44)

```bash
# SSH into Redis VM
ssh user@192.168.120.44

# Install Redis (if not already installed)
sudo apt update
sudo apt install redis-server

# Configure Redis
sudo nano /etc/redis/redis.conf

# Set bind address (allow internal network)
bind 127.0.0.1 192.168.120.44

# Disable protected mode for internal network
protected-mode no

# Save and restart
sudo systemctl restart redis-server
sudo systemctl enable redis-server

# Test connection
redis-cli -h 192.168.120.44 ping
# Should return: PONG

# Configure firewall (if using ufw)
sudo ufw allow from 192.168.120.0/24 to any port 6379
```

## Step 4: Deploy Web Platform (192.168.120.50)

```bash
# SSH into web platform VM
ssh user@192.168.120.50

# Clone repository (or copy files)
git clone <your-repo-url> yametee
cd yametee

# Or if updating existing deployment:
cd /opt/yametee
git pull

# Create .env file (see Step 1)
nano .env

# Make deployment script executable
chmod +x proxmox/deploy-web-direct.sh

# Run deployment script
sudo bash proxmox/deploy-web-direct.sh
```

The script will:
1. Check Node.js installation
2. Create service user (`yametee`)
3. Copy application files to `/opt/yametee`
4. Install dependencies
5. Generate Prisma Client
6. Run database migrations
7. Build Next.js application
8. Create systemd service
9. Start and enable service

### Verify Web Platform

```bash
# Check service status
sudo systemctl status yametee-web

# Check logs
sudo journalctl -u yametee-web -f

# Test health endpoint
curl http://localhost:3000/api/health

# Test metrics endpoint
curl http://localhost:3000/api/metrics
```

Expected health response:
```json
{
  "status": "healthy",
  "timestamp": "2025-01-19T...",
  "service": "yametee-api",
  "checks": {
    "database": "connected",
    "redis": "connected",
    "uptime": 3600
  }
}
```

## Step 5: Deploy Background Worker (192.168.120.45)

```bash
# SSH into worker VM
ssh user@192.168.120.45

# Clone repository (or copy files)
git clone <your-repo-url> yametee
cd yametee

# Or if updating existing deployment:
cd /opt/yametee-worker
git pull

# Create .env file (see Step 1)
nano .env

# Make deployment script executable
chmod +x proxmox/deploy-worker-direct.sh

# Run deployment script
sudo bash proxmox/deploy-worker-direct.sh
```

The script will:
1. Check Node.js installation
2. Create service user (`yametee-worker`)
3. Copy application files to `/opt/yametee-worker`
4. Install dependencies
5. Generate Prisma Client
6. Create systemd service
7. Start and enable service

### Verify Worker

```bash
# Check service status
sudo systemctl status yametee-worker

# Check logs
sudo journalctl -u yametee-worker -f

# Verify Redis connection
redis-cli -h 192.168.120.44 LLEN yametee:jobs

# Test worker (optional - queue a test job)
bash proxmox/queue-test-job.sh
```

## Step 6: Seed Default Admin User

After deploying the web platform, create a default admin:

```bash
# On web platform VM (192.168.120.50)
cd /opt/yametee

# Run seed script
sudo -u yametee npm run seed:admin

# Or with custom credentials
sudo -u yametee npm run seed:admin admin@example.com mypassword
```

**Default Credentials:**
- Email: `admin@yametee.com`
- Password: `admin123`

⚠️ **SECURITY WARNING**: Change the default password immediately after first login!

### Verify Admin Login

```bash
# Test login endpoint
curl -X POST http://localhost:3000/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@yametee.com","password":"admin123"}'
```

## Step 7: Configure Proxy/Tunnel (192.168.120.38)

### Option A: Cloudflare Tunnel

```bash
# SSH into proxy VM
ssh user@192.168.120.38

# Install cloudflared
wget https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
sudo dpkg -i cloudflared-linux-amd64.deb

# Authenticate
cloudflared tunnel login

# Create tunnel
cloudflared tunnel create yametee

# Configure DNS
cloudflared tunnel route dns yametee your-domain.com

# Create config file: ~/.cloudflared/config.yml
tunnel: <tunnel-id>
credentials-file: /home/user/.cloudflared/<tunnel-id>.json

ingress:
  - hostname: your-domain.com
    service: http://192.168.120.50:3000
  - service: http_status:404

# Create systemd service
sudo cloudflared service install

# Start tunnel
sudo systemctl start cloudflared
sudo systemctl enable cloudflared
```

### Option B: Nginx Reverse Proxy

```bash
# SSH into proxy VM
ssh user@192.168.120.38

# Install Nginx
sudo apt update
sudo apt install nginx

# Create site configuration
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
# Enable site
sudo ln -s /etc/nginx/sites-available/yametee /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# Install SSL (Let's Encrypt)
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

## Step 8: Verification Checklist

### ✅ Web Platform

- [ ] Service is running: `systemctl status yametee-web`
- [ ] Health check passes: `curl http://localhost:3000/api/health`
- [ ] Metrics endpoint works: `curl http://localhost:3000/api/metrics`
- [ ] Can access admin login: `curl http://localhost:3000/admin/login`
- [ ] Database connection works
- [ ] Redis connection works

### ✅ Background Worker

- [ ] Service is running: `systemctl status yametee-worker`
- [ ] Can connect to Redis: `redis-cli -h 192.168.120.44 ping`
- [ ] Can connect to database
- [ ] Processing jobs (check logs)

### ✅ Database

- [ ] PostgreSQL is running: `systemctl status postgresql`
- [ ] Database exists: `psql -h 192.168.120.42 -U yametee_user -d yame_tee -c "\l"`
- [ ] Tables created: `psql -h 192.168.120.42 -U yametee_user -d yame_tee -c "\dt"`

### ✅ Redis

- [ ] Redis is running: `systemctl status redis-server`
- [ ] Accepts connections: `redis-cli -h 192.168.120.44 ping`
- [ ] Queue exists: `redis-cli -h 192.168.120.44 LLEN yametee:jobs`

### ✅ Proxy/Tunnel

- [ ] Service is running
- [ ] Domain resolves correctly
- [ ] HTTPS works (if configured)
- [ ] Can access web platform through proxy

### ✅ Admin Access

- [ ] Default admin created: `npm run seed:admin`
- [ ] Can login via admin panel
- [ ] Changed default password

## Step 9: Monitoring Setup (Optional)

### Enable Monitoring

Add to `.env` on both web platform and worker:

```bash
MONITORING_ENABLED=true
ALERT_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK
```

### Set Up Prometheus (Optional)

1. Install Prometheus on monitoring VM
2. Configure scrape config:

```yaml
scrape_configs:
  - job_name: 'yametee-api'
    scrape_interval: 15s
    metrics_path: '/api/metrics'
    static_configs:
      - targets: ['192.168.120.50:3000']
```

3. Set up Grafana dashboard

See [Monitoring Setup Guide](MONITORING_SETUP.md) for details.

## Updating Deployment

### Update Web Platform

```bash
# SSH into web platform VM
ssh user@192.168.120.50
cd /opt/yametee

# Pull latest changes
sudo -u yametee git pull

# Update dependencies (if package.json changed)
sudo -u yametee npm ci --production=false

# Run migrations (if schema changed)
sudo -u yametee npx prisma migrate deploy

# Rebuild application
sudo -u yametee npm run build

# Restart service
sudo systemctl restart yametee-web

# Verify
curl http://localhost:3000/api/health
```

### Update Worker

```bash
# SSH into worker VM
ssh user@192.168.120.45
cd /opt/yametee-worker

# Pull latest changes
sudo -u yametee-worker git pull

# Update dependencies (if package.json changed)
sudo -u yametee-worker npm ci --production=false

# Restart service
sudo systemctl restart yametee-worker

# Verify
sudo journalctl -u yametee-worker -f
```

### Run Database Migrations

```bash
# On web platform VM
cd /opt/yametee
sudo -u yametee npx prisma migrate deploy
```

## Troubleshooting

### Web Platform Won't Start

```bash
# Check logs
sudo journalctl -u yametee-web -n 100

# Check service status
sudo systemctl status yametee-web

# Verify .env file
sudo -u yametee cat /opt/yametee/.env

# Test database connection
sudo -u yametee psql $DATABASE_URL -c "SELECT 1"

# Test Redis connection
redis-cli -h 192.168.120.44 ping

# Check file permissions
ls -la /opt/yametee
```

### Worker Won't Start

```bash
# Check logs
sudo journalctl -u yametee-worker -n 100

# Check service status
sudo systemctl status yametee-worker

# Verify .env file
sudo -u yametee-worker cat /opt/yametee-worker/.env

# Test database connection
sudo -u yametee-worker psql $DATABASE_URL -c "SELECT 1"

# Test Redis connection
redis-cli -h 192.168.120.44 ping
```

### Database Connection Issues

```bash
# Verify PostgreSQL is running
sudo systemctl status postgresql

# Check PostgreSQL logs
sudo journalctl -u postgresql -n 50

# Test connection
psql -h 192.168.120.42 -U yametee_user -d yame_tee

# Check firewall
sudo ufw status
```

### Redis Connection Issues

```bash
# Verify Redis is running
sudo systemctl status redis-server

# Check Redis logs
sudo journalctl -u redis-server -n 50

# Test connection
redis-cli -h 192.168.120.44 ping

# Check bind configuration
sudo cat /etc/redis/redis.conf | grep bind
```

### Health Check Failing

```bash
# Check all services
curl http://localhost:3000/api/health | jq

# Check individual components
psql $DATABASE_URL -c "SELECT 1"
redis-cli -h 192.168.120.44 ping

# Check application logs
sudo journalctl -u yametee-web -n 100
```

## Security Checklist

- [ ] Changed default admin password
- [ ] Firewall rules configured
- [ ] Database only accessible from internal network
- [ ] Redis only accessible from internal network
- [ ] Strong passwords for all services
- [ ] SSL/TLS configured (HTTPS)
- [ ] Secrets stored securely (not in code)
- [ ] Regular backups configured
- [ ] Monitoring and alerting enabled
- [ ] Logs are being monitored

## Backup Strategy

### Database Backup

```bash
# Manual backup
pg_dump -h 192.168.120.42 -U yametee_user yame_tee > backup_$(date +%Y%m%d).sql

# Automated daily backup (add to crontab)
0 2 * * * pg_dump -h 192.168.120.42 -U yametee_user yame_tee > /backups/yametee_$(date +\%Y\%m\%d).sql
```

### Application Backup

```bash
# Backup application files
tar -czf yametee_backup_$(date +%Y%m%d).tar.gz /opt/yametee

# Backup .env files (store securely!)
cp /opt/yametee/.env /backups/yametee_env_$(date +%Y%m%d).env
```

## Support

For issues:
1. Check logs: `journalctl -u yametee-web -f` or `journalctl -u yametee-worker -f`
2. Check health: `curl http://localhost:3000/api/health`
3. Review this guide
4. Check [Monitoring Setup Guide](MONITORING_SETUP.md)
5. Check [Environment Variables Guide](ENVIRONMENT_VARIABLES.md)
