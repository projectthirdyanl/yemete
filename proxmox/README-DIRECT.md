# Direct Installation Guide (No Docker)

This guide explains how to deploy Yametee directly on Proxmox CTs/VMs without Docker.

## Overview

The direct installation method:

- Installs Node.js directly on the system
- Uses systemd for process management
- Runs the application as a system service
- No Docker required

## Quick Start

### 1. Setup Node.js (First Time Only)

Run this on both the web platform VM and worker VM:

```bash
cd yametee
sudo bash proxmox/setup-nodejs.sh
```

### 2. Deploy Web Platform

```bash
cd yametee
# Edit .env file first
cp .env.example .env
nano .env

# Deploy
sudo bash proxmox/deploy-web-direct.sh
```

### 3. Deploy Worker

```bash
cd yametee
# Edit .env file first
cp .env.example .env
nano .env

# Deploy
sudo bash proxmox/deploy-worker-direct.sh
```

## Scripts Overview

### `setup-nodejs.sh`

- Installs Node.js 20.x from NodeSource
- Installs build tools and dependencies
- Installs global packages (tsx, prisma, pm2)
- Run once per VM/CT

### `deploy-web-direct.sh`

- Creates service user (`yametee`)
- Copies application files to `/opt/yametee`
- Installs npm dependencies
- Generates Prisma Client
- Runs database migrations
- Builds Next.js application
- Creates systemd service (`yametee-web`)
- Starts and enables the service

### `deploy-worker-direct.sh`

- Creates service user (`yametee-worker`)
- Copies application files to `/opt/yametee-worker`
- Installs npm dependencies
- Generates Prisma Client
- Creates systemd service (`yametee-worker`)
- Starts and enables the service

## Service Management

### Web Platform Service

```bash
# Check status
sudo systemctl status yametee-web

# Start service
sudo systemctl start yametee-web

# Stop service
sudo systemctl stop yametee-web

# Restart service
sudo systemctl restart yametee-web

# View logs
sudo journalctl -u yametee-web -f

# View recent logs
sudo journalctl -u yametee-web -n 100
```

### Worker Service

```bash
# Check status
sudo systemctl status yametee-worker

# Start service
sudo systemctl start yametee-worker

# Stop service
sudo systemctl stop yametee-worker

# Restart service
sudo systemctl restart yametee-worker

# View logs
sudo journalctl -u yametee-worker -f

# View recent logs
sudo journalctl -u yametee-worker -n 100
```

## Application Directories

- **Web Platform**: `/opt/yametee`
- **Worker**: `/opt/yametee-worker`
- **Service User**: `yametee` (web), `yametee-worker` (worker)
- **Systemd Services**: `yametee-web.service`, `yametee-worker.service`

## Updating the Application

### Update Web Platform

```bash
cd /opt/yametee
sudo -u yametee git pull
sudo bash proxmox/deploy-web-direct.sh
```

Or from your working directory:

```bash
cd yametee
git pull
sudo bash proxmox/deploy-web-direct.sh
```

### Update Worker

```bash
cd /opt/yametee-worker
sudo -u yametee-worker git pull
sudo bash proxmox/deploy-worker-direct.sh
```

Or from your working directory:

```bash
cd yametee
git pull
sudo bash proxmox/deploy-worker-direct.sh
```

## Troubleshooting

### Service Won't Start

1. Check service status:

   ```bash
   sudo systemctl status yametee-web
   ```

2. Check logs:

   ```bash
   sudo journalctl -u yametee-web -n 50
   ```

3. Verify .env file exists and is readable:

   ```bash
   sudo -u yametee cat /opt/yametee/.env
   ```

4. Check Node.js installation:
   ```bash
   node -v
   npm -v
   ```

### Build Failures

1. Check if dependencies are installed:

   ```bash
   cd /opt/yametee
   sudo -u yametee npm ci
   ```

2. Check Prisma generation:

   ```bash
   cd /opt/yametee
   sudo -u yametee npx prisma generate
   ```

3. Check build output:
   ```bash
   cd /opt/yametee
   sudo -u yametee npm run build
   ```

### Database Connection Issues

1. Verify database is accessible:

   ```bash
   psql -h 192.168.120.42 -U yametee_user -d yame_tee
   ```

2. Check .env file has correct DATABASE_URL:
   ```bash
   sudo -u yametee grep DATABASE_URL /opt/yametee/.env
   ```

### Redis Connection Issues

1. Verify Redis is accessible:

   ```bash
   redis-cli -h 192.168.120.44 ping
   ```

2. Check .env file has correct REDIS_URL:
   ```bash
   sudo -u yametee grep REDIS_URL /opt/yametee/.env
   ```

## Security Considerations

- Service users (`yametee`, `yametee-worker`) run with minimal privileges
- .env files are readable only by the service user (chmod 600)
- Systemd services use security hardening options:
  - `NoNewPrivileges=true`
  - `PrivateTmp=true`
  - `ProtectSystem=strict`
  - `ProtectHome=true`

## Performance Tuning

### Resource Limits

Edit systemd service files to adjust resource limits:

```bash
sudo systemctl edit yametee-web
```

Add:

```ini
[Service]
LimitNOFILE=65536
LimitNPROC=4096
MemoryLimit=2G
CPUQuota=200%
```

Then reload:

```bash
sudo systemctl daemon-reload
sudo systemctl restart yametee-web
```

### Process Management

For more advanced process management, consider using PM2 instead of systemd:

```bash
# Install PM2 globally (already done by setup-nodejs.sh)
pm2 start npm --name yametee-web -- start
pm2 save
pm2 startup
```

However, systemd is recommended for better integration with the system.

## Migration from Docker

If you're migrating from Docker to direct installation:

1. Stop Docker containers:

   ```bash
   docker-compose down
   ```

2. Backup your .env file:

   ```bash
   cp .env .env.backup
   ```

3. Run direct installation scripts:

   ```bash
   sudo bash proxmox/setup-nodejs.sh
   sudo bash proxmox/deploy-web-direct.sh
   ```

4. Verify services are running:

   ```bash
   sudo systemctl status yametee-web
   ```

5. Remove Docker (optional):
   ```bash
   sudo apt remove docker.io docker-compose
   ```
