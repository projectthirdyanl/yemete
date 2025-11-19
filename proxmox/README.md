# Proxmox Deployment Guide

This directory contains deployment scripts and configurations for deploying Yametee on a distributed Proxmox infrastructure.

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

### On Each VM/Container:

1. **Docker** installed and running
2. **Docker Compose** installed
3. **Network connectivity** between all VMs (bridge networking)
4. **Firewall rules** configured to allow:
   - Web Platform → Database (5432)
   - Web Platform → Redis (6379)
   - Worker → Database (5432)
   - Worker → Redis (6379)
   - Proxy → Web Platform (3000)

### Database VM (192.168.120.42)

PostgreSQL should be installed and configured:

```bash
# Example PostgreSQL setup
sudo apt update
sudo apt install postgresql postgresql-contrib

# Create database and user
sudo -u postgres psql
CREATE DATABASE yame_tee;
CREATE USER yametee_user WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE yame_tee TO yametee_user;
```

### Redis VM/Container (192.168.120.44)

Redis should be installed and running:

```bash
# Example Redis setup (if using container)
docker run -d \
  --name redis \
  -p 6379:6379 \
  --restart unless-stopped \
  redis:7-alpine
```

## Deployment Steps

### 1. Prepare Environment Variables

Create `.env` file on each VM with the following variables:

```bash
# Database connection (pointing to 192.168.120.42)
DATABASE_URL="postgresql://yametee_user:your_password@192.168.120.42:5432/yame_tee?schema=public"

# Redis connection (pointing to 192.168.120.44)
REDIS_URL="redis://192.168.120.44:6379"

# Payment processing
PAYMONGO_SECRET_KEY="sk_live_..."
PAYMONGO_PUBLIC_KEY="pk_live_..."
PAYMONGO_WEBHOOK_SECRET="whsec_..."

# Authentication
NEXTAUTH_URL="https://your-domain.com"  # Or http://192.168.120.38 if using proxy
NEXTAUTH_SECRET="generate-with: node -e \"console.log(require('crypto').randomBytes(64).toString('hex'))\""
ADMIN_JWT_SECRET="generate-with: node -e \"console.log(require('crypto').randomBytes(64).toString('hex'))\""

# Application
NODE_ENV="production"
```

### 2. Deploy Web Platform (192.168.120.50)

```bash
# SSH into web-platform VM
ssh user@192.168.120.50

# Clone or copy the repository
git clone <your-repo-url> yametee
cd yametee

# Create .env file (see above)
nano .env

# Run deployment script
./proxmox/deploy-web.sh
```

### 3. Deploy Background Worker (192.168.120.45)

```bash
# SSH into background-job VM
ssh user@192.168.120.45

# Clone or copy the repository (same codebase)
git clone <your-repo-url> yametee
cd yametee

# Create .env file (same as web platform, but NEXTAUTH_URL not needed)
nano .env

# Run deployment script
./proxmox/deploy-worker.sh
```

### 4. Configure Tunnel/Proxy (192.168.120.38)

#### Option A: Cloudflare Tunnel

```bash
# Install cloudflared
wget https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
sudo dpkg -i cloudflared-linux-amd64.deb

# Authenticate
cloudflared tunnel login

# Create tunnel
cloudflared tunnel create yametee

# Configure tunnel
cloudflared tunnel route dns yametee your-domain.com

# Create config file: ~/.cloudflared/config.yml
tunnel: <tunnel-id>
credentials-file: /home/user/.cloudflared/<tunnel-id>.json

ingress:
  - hostname: your-domain.com
    service: http://192.168.120.50:3000
  - service: http_status:404
```

#### Option B: Nginx Reverse Proxy

```nginx
# /etc/nginx/sites-available/yametee
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

## Monitoring

### Check Web Platform Health

```bash
curl http://192.168.120.50:3000/api/health
```

Expected response:

```json
{
  "status": "healthy",
  "timestamp": "2025-01-XX...",
  "service": "yametee-api",
  "checks": {
    "database": "connected",
    "redis": "connected"
  }
}
```

### Check Worker Status

```bash
# On background-job VM
docker logs yametee-worker
```

### Check Container Status

```bash
# On web-platform VM
docker ps
docker logs yametee-web

# On background-job VM
docker ps
docker logs yametee-worker
```

## Troubleshooting

### Database Connection Issues

1. Verify PostgreSQL is running: `sudo systemctl status postgresql`
2. Check firewall: `sudo ufw status`
3. Test connection: `psql -h 192.168.120.42 -U yametee_user -d yame_tee`
4. Check PostgreSQL config: `/etc/postgresql/*/main/postgresql.conf` (listen_addresses)

### Redis Connection Issues

1. Verify Redis is running: `docker ps | grep redis` or `redis-cli ping`
2. Check firewall: Ensure port 6379 is open
3. Test connection: `redis-cli -h 192.168.120.44 ping`

### Worker Not Processing Jobs

1. Check worker logs: `docker logs yametee-worker`
2. Verify Redis connection
3. Check if jobs are being queued (check Redis: `redis-cli -h 192.168.120.44 LLEN yametee:jobs`)

### Network Connectivity

Test connectivity between VMs:

```bash
# From web-platform to database
ping 192.168.120.42
telnet 192.168.120.42 5432

# From web-platform to redis
ping 192.168.120.44
telnet 192.168.120.44 6379

# From worker to database
ping 192.168.120.42
telnet 192.168.120.42 5432

# From worker to redis
ping 192.168.120.44
telnet 192.168.120.44 6379
```

## Updates and Maintenance

### Update Web Platform

```bash
# On web-platform VM
cd yametee
git pull
./proxmox/deploy-web.sh
```

### Update Worker

```bash
# On background-job VM
cd yametee
git pull
./proxmox/deploy-worker.sh
```

### Database Migrations

Run migrations from web-platform VM:

```bash
cd yametee
docker-compose -f docker-compose.web.yml exec web npx prisma migrate deploy
```

## Security Considerations

1. **Firewall Rules**: Only allow necessary ports between VMs
2. **Database Access**: Restrict PostgreSQL to internal network only
3. **Redis Access**: Restrict Redis to internal network only
4. **Secrets Management**: Use environment variables, never commit secrets
5. **SSL/TLS**: Use HTTPS via Cloudflare Tunnel or SSL termination at proxy
6. **Regular Updates**: Keep Docker images and system packages updated

## Backup Strategy

### Database Backup

```bash
# On database VM or backup server
pg_dump -h 192.168.120.42 -U yametee_user yame_tee > backup_$(date +%Y%m%d).sql
```

### Automated Backups

Set up cron job for daily backups:

```bash
# Add to crontab
0 2 * * * pg_dump -h 192.168.120.42 -U yametee_user yame_tee > /backups/yametee_$(date +\%Y\%m\%d).sql
```

## Performance Tuning

### Database Connection Pooling

Consider using PgBouncer on database VM for connection pooling:

```bash
# Install PgBouncer
sudo apt install pgbouncer

# Configure: /etc/pgbouncer/pgbouncer.ini
[databases]
yame_tee = host=localhost port=5432 dbname=yame_tee

[pgbouncer]
listen_addr = 0.0.0.0
listen_port = 6432
auth_type = md5
auth_file = /etc/pgbouncer/userlist.txt
```

Then update DATABASE_URL to use port 6432.

### Redis Persistence

Configure Redis persistence if needed:

```bash
# In redis.conf or docker run command
redis-server --appendonly yes --appendfsync everysec
```

## Support

For issues or questions:

1. Check logs: `docker logs <container-name>`
2. Check health endpoint: `curl http://192.168.120.50:3000/api/health`
3. Review this documentation
4. Check main README.md for application-specific issues
