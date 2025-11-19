# Proxmox Deployment Summary

## Overview

Your Yametee application has been configured for distributed deployment on Proxmox with the following architecture:

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

## What Was Changed

### 1. Added Redis Support

- ✅ Added `redis` package to dependencies
- ✅ Created `lib/redis.ts` with Redis client and cache helpers
- ✅ Updated health check to include Redis connectivity

### 2. Created Background Worker System

- ✅ Created `scripts/worker.ts` for processing background jobs
- ✅ Created `lib/jobs.ts` for queueing jobs from the web application
- ✅ Added `worker` script to package.json

### 3. Direct Installation Configuration

- ✅ Created `proxmox/setup-nodejs.sh` for Node.js installation
- ✅ Created `proxmox/deploy-web-direct.sh` for web platform deployment
- ✅ Created `proxmox/deploy-worker-direct.sh` for background worker deployment
- ✅ Created comprehensive `proxmox/README-DIRECT.md` deployment guide
- ✅ Configured systemd services for process management

### 5. Documentation

- ✅ Updated `.env.example` with Proxmox-specific configuration
- ✅ Updated `docs/ENVIRONMENT_VARIABLES.md` with Redis and distributed setup info
- ✅ Created `PROXMOX_DEPLOYMENT.md` quick start guide
- ✅ Created this summary document

## Key Files Created/Modified

### New Files

- `lib/redis.ts` - Redis client and cache utilities
- `lib/jobs.ts` - Job queueing utilities
- `scripts/worker.ts` - Background worker process
- `proxmox/setup-nodejs.sh` - Node.js installation script
- `proxmox/deploy-web-direct.sh` - Web platform deployment script
- `proxmox/deploy-worker-direct.sh` - Worker deployment script
- `proxmox/README-DIRECT.md` - Direct installation guide
- `proxmox/README.md` - Comprehensive deployment guide
- `PROXMOX_DEPLOYMENT.md` - Quick start guide
- `ecosystem.config.js` - PM2 configuration for process management

### Modified Files

- `package.json` - Added redis dependency and worker script
- `.env.example` - Updated with Proxmox IPs and Redis config
- `app/api/health/route.ts` - Added Redis health check
- `docs/ENVIRONMENT_VARIABLES.md` - Added Redis and Proxmox sections

## Next Steps

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Database (192.168.120.42)

- Install PostgreSQL
- Create database and user
- Configure network access

### 3. Set Up Redis (192.168.120.44)

- Install Redis server directly
- Configure network access

### 4. Deploy Web Platform (192.168.120.50)

```bash
git clone <repo> yametee
cd yametee
cp .env.example .env
# Edit .env with your configuration
./proxmox/deploy-web.sh
```

### 5. Deploy Worker (192.168.120.45)

```bash
git clone <repo> yametee
cd yametee
cp .env.example .env
# Edit .env (same as web platform)
./proxmox/deploy-worker.sh
```

### 6. Configure Tunnel/Proxy (192.168.120.38)

- Set up Cloudflare Tunnel or Nginx reverse proxy
- Point to web platform (192.168.120.50:3000)

## Environment Variables Required

### Web Platform (192.168.120.50)

```bash
DATABASE_URL="postgresql://user:pass@192.168.120.42:5432/yame_tee?schema=public"
REDIS_URL="redis://192.168.120.44:6379"
NEXTAUTH_URL="https://your-domain.com"
NEXTAUTH_SECRET="<generate-secret>"
ADMIN_JWT_SECRET="<generate-secret>"
PAYMONGO_SECRET_KEY="sk_live_..."
PAYMONGO_PUBLIC_KEY="pk_live_..."
PAYMONGO_WEBHOOK_SECRET="whsec_..."
NODE_ENV="production"
```

### Worker (192.168.120.45)

```bash
DATABASE_URL="postgresql://user:pass@192.168.120.42:5432/yame_tee?schema=public"
REDIS_URL="redis://192.168.120.44:6379"
NODE_ENV="production"
```

## Testing the Setup

### 1. Health Check

```bash
curl http://192.168.120.50:3000/api/health
```

Expected:

```json
{
  "status": "healthy",
  "checks": {
    "database": "connected",
    "redis": "connected"
  }
}
```

### 2. Worker Logs

```bash
sudo journalctl -u yametee-worker -f
```

### 3. Queue a Test Job

You can queue jobs from your application code:

```typescript
import { queueEmailJob } from '@/lib/jobs'

await queueEmailJob('user@example.com', 'Test', 'Test email')
```

## Architecture Benefits

1. **Scalability**: Each service can scale independently
2. **Reliability**: Failure of one service doesn't bring down others
3. **Performance**: Dedicated resources for each service
4. **Maintainability**: Clear separation of concerns
5. **Resource Efficiency**: Optimal resource allocation per service

## Monitoring

- **Web Platform**: `http://192.168.120.50:3000/api/health`
- **Worker**: `sudo journalctl -u yametee-worker -f`
- **Database**: PostgreSQL logs and connection monitoring
- **Redis**: Memory usage and connection monitoring

## Security Considerations

1. ✅ Firewall rules between VMs (only necessary ports)
2. ✅ Database access restricted to internal network
3. ✅ Redis access restricted to internal network
4. ✅ Non-root service users (yametee, yametee-worker)
5. ✅ Environment variables for secrets
6. ✅ Systemd security hardening (NoNewPrivileges, PrivateTmp, ProtectSystem)
7. ⚠️ SSL/TLS via Cloudflare Tunnel or Let's Encrypt (configure on proxy)

## Support & Documentation

- **Quick Start**: `PROXMOX_DEPLOYMENT.md`
- **Detailed Guide**: `proxmox/README.md`
- **Environment Variables**: `docs/ENVIRONMENT_VARIABLES.md`
- **General Deployment**: `docs/DEPLOYMENT_RUNBOOK.md`

## Notes

- The worker uses the same codebase as the web platform, which is efficient for your monorepo setup
- Redis is optional - the application will work without it (caching disabled)
- All services communicate over the internal Proxmox network (192.168.120.0/24)
- The tunnel/proxy (192.168.120.38) handles external access and SSL termination
- Services are managed via systemd for better integration with the system
- Application files are located at `/opt/yametee` (web) and `/opt/yametee-worker` (worker)
