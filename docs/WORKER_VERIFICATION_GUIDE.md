# Background Worker Verification Guide

## How the Background Worker Works

### Architecture Overview

```
┌─────────────────┐         ┌──────────────┐         ┌─────────────────┐
│  Web Platform   │         │    Redis    │         │ Background      │
│ 192.168.120.50  │────────▶│192.168.120.44│◀───────│ Worker          │
│                 │ Queue   │             │ Consume │ 192.168.120.45  │
│  Next.js App    │ Jobs    │  Queue:     │ Jobs    │                 │
│                 │         │ yametee:jobs│         │ worker.ts       │
└─────────────────┘         └──────────────┘         └─────────────────┘
```

### How It Works

1. **Web Platform (192.168.120.50)**:
   - When certain actions occur (order creation, email sending, etc.), the web app queues jobs to Redis
   - Uses `lib/jobs.ts` functions like `queueOrderJob()`, `queueEmailJob()`, etc.
   - Jobs are pushed to Redis list: `yametee:jobs`

2. **Redis (192.168.120.44)**:
   - Acts as a message queue
   - Stores jobs in a Redis LIST data structure (`yametee:jobs`)
   - Jobs are stored as JSON strings

3. **Background Worker (192.168.120.45)**:
   - Continuously polls Redis for new jobs using `BLPOP` (blocking pop)
   - Processes jobs one at a time
   - Handles different job types:
     - `order:process` - Process orders
     - `email:send` - Send emails
     - `webhook:process` - Process webhooks
     - `cache:warm` - Warm cache

### Job Flow

```
1. Web App → queueJob() → Redis RPUSH yametee:jobs
2. Worker → BLPOP yametee:jobs → Get job
3. Worker → processJob() → Execute job logic
4. Worker → Loop back to step 2
```

## Verification Steps

### Step 1: Check Worker Service Status

**On Worker VM (192.168.120.45):**

```bash
# Check if worker service is running
sudo systemctl status yametee-worker

# Expected output: "active (running)"
```

### Step 2: Check Worker Logs

**On Worker VM (192.168.120.45):**

```bash
# View real-time logs
sudo journalctl -u yametee-worker -f

# View last 50 lines
sudo journalctl -u yametee-worker -n 50 --no-pager

# Expected log output when worker starts:
# - "Environment validation passed"
# - "Database connection successful"
# - "Redis connection successful"
# - "Worker yametee-worker started"
# - "Worker yametee-worker ready and waiting for jobs"
```

### Step 3: Verify Worker Can Connect to Redis

**On Worker VM (192.168.120.45):**

```bash
# Test Redis connection from worker VM
redis-cli -h 192.168.120.44 ping

# Expected output: PONG
```

### Step 4: Verify Worker Can Connect to Database

**On Worker VM (192.168.120.45):**

```bash
# Test database connection (adjust connection string as needed)
psql -h 192.168.120.42 -U yametee_user -d yame_tee -c "SELECT 1;"

# Expected output: Shows "1" row
```

### Step 5: Check Redis Queue Status

**On Redis VM (192.168.120.44) or any VM with redis-cli:**

```bash
# Connect to Redis
redis-cli -h 192.168.120.44

# Check queue length (should be 0 if no pending jobs)
LLEN yametee:jobs

# View jobs in queue (if any)
LRANGE yametee:jobs 0 -1

# Exit Redis CLI
exit
```

### Step 6: Test Job Queueing (Manual Test)

**On Web Platform VM (192.168.120.50):**

You can manually test job queueing using Redis CLI:

```bash
# Connect to Redis
redis-cli -h 192.168.120.44

# Manually add a test job to the queue
RPUSH yametee:jobs '{"id":"test-123","type":"order:process","data":{"orderId":"test-order-123"},"createdAt":"2025-01-01T00:00:00.000Z"}'

# Check if job was added
LLEN yametee:jobs

# Exit Redis CLI
exit
```

**Then check Worker VM logs:**

```bash
# On Worker VM (192.168.120.45)
sudo journalctl -u yametee-worker -f

# You should see:
# - "Processing job test-123 of type order:process"
# - "Order test-order-123 processed: [status]"
```

### Step 7: Monitor Job Processing

**On Worker VM (192.168.120.45):**

```bash
# Watch logs in real-time
sudo journalctl -u yametee-worker -f

# Look for:
# - Job processing messages
# - Any error messages
# - Connection status messages
```

**On Redis VM (192.168.120.44):**

```bash
# Monitor queue length
watch -n 1 'redis-cli -h 192.168.120.44 LLEN yametee:jobs'

# This will show queue length updating every second
# Jobs should be consumed quickly (within seconds)
```

## Integration Testing

### Test Complete Flow

1. **Create a test job from web platform:**

```bash
# On Web Platform VM (192.168.120.50)
# You can create a simple test script or use Redis directly

redis-cli -h 192.168.120.44 RPUSH yametee:jobs '{"id":"integration-test","type":"email:send","data":{"to":"test@example.com","subject":"Test","body":"Test email"},"createdAt":"2025-01-01T00:00:00.000Z"}'
```

2. **Verify job appears in queue:**

```bash
redis-cli -h 192.168.120.44 LLEN yametee:jobs
# Should show: (integer) 1
```

3. **Check worker processes it:**

```bash
# On Worker VM
sudo journalctl -u yametee-worker -f
# Should see job processing within 1-5 seconds
```

4. **Verify job was consumed:**

```bash
redis-cli -h 192.168.120.44 LLEN yametee:jobs
# Should show: (integer) 0 (job was processed)
```

## Common Issues and Solutions

### Issue 1: Worker Not Running

**Symptoms:**
- `systemctl status yametee-worker` shows inactive
- No logs appearing

**Solution:**
```bash
sudo systemctl start yametee-worker
sudo systemctl enable yametee-worker
sudo systemctl status yametee-worker
```

### Issue 2: Worker Can't Connect to Redis

**Symptoms:**
- Logs show "Redis connection failed"
- Worker continues but can't process jobs

**Solution:**
```bash
# Test Redis connection
redis-cli -h 192.168.120.44 ping

# Check Redis is listening on network interface
ss -tlnp | grep redis

# Verify firewall allows connection
sudo ufw status
sudo ufw allow from 192.168.120.45 to any port 6379
```

### Issue 3: Worker Can't Connect to Database

**Symptoms:**
- Logs show "Database connection failed"
- Worker exits immediately

**Solution:**
```bash
# Test database connection
psql -h 192.168.120.42 -U yametee_user -d yame_tee

# Check PostgreSQL is accepting connections
sudo systemctl status postgresql

# Verify firewall allows connection
sudo ufw allow from 192.168.120.45 to any port 5432
```

### Issue 4: Jobs Not Being Processed

**Symptoms:**
- Jobs accumulate in queue
- Worker logs show no job processing

**Solution:**
```bash
# Check worker is actually running
sudo systemctl status yametee-worker

# Check worker logs for errors
sudo journalctl -u yametee-worker -n 100

# Verify Redis connection
redis-cli -h 192.168.120.44 ping

# Check queue length
redis-cli -h 192.168.120.44 LLEN yametee:jobs
```

### Issue 5: Jobs Being Queued But Not Consumed

**Symptoms:**
- Queue length increases
- Worker logs show "ready and waiting for jobs"
- No job processing messages

**Solution:**
```bash
# Check Redis connection from worker VM
redis-cli -h 192.168.120.44 ping

# Verify worker can read from queue
# Manually test BLPOP from worker VM
redis-cli -h 192.168.120.44 BLPOP yametee:jobs 5

# Check worker logs for Redis errors
sudo journalctl -u yametee-worker | grep -i redis
```

## Health Check Script

Create a simple health check script:

```bash
#!/bin/bash
# worker-health-check.sh

echo "=== Worker Health Check ==="
echo ""

echo "1. Worker Service Status:"
sudo systemctl is-active yametee-worker && echo "✓ Running" || echo "✗ Not Running"

echo ""
echo "2. Redis Connection:"
redis-cli -h 192.168.120.44 ping && echo "✓ Connected" || echo "✗ Failed"

echo ""
echo "3. Database Connection:"
psql -h 192.168.120.42 -U yametee_user -d yame_tee -c "SELECT 1;" > /dev/null 2>&1 && echo "✓ Connected" || echo "✗ Failed"

echo ""
echo "4. Queue Length:"
QUEUE_LEN=$(redis-cli -h 192.168.120.44 LLEN yametee:jobs)
echo "Jobs in queue: $QUEUE_LEN"

echo ""
echo "5. Recent Worker Logs (last 5 lines):"
sudo journalctl -u yametee-worker -n 5 --no-pager | tail -5
```

Save as `worker-health-check.sh`, make executable, and run:
```bash
chmod +x worker-health-check.sh
./worker-health-check.sh
```

## Monitoring Commands Summary

### Quick Status Check
```bash
# Worker status
sudo systemctl status yametee-worker

# Queue length
redis-cli -h 192.168.120.44 LLEN yametee:jobs

# Recent logs
sudo journalctl -u yametee-worker -n 20
```

### Real-time Monitoring
```bash
# Watch worker logs
sudo journalctl -u yametee-worker -f

# Watch queue length
watch -n 1 'redis-cli -h 192.168.120.44 LLEN yametee:jobs'
```

### Connection Tests
```bash
# Redis
redis-cli -h 192.168.120.44 ping

# Database
psql -h 192.168.120.42 -U yametee_user -d yame_tee -c "SELECT 1;"
```

## Expected Behavior

### Normal Operation

1. **Worker starts successfully:**
   - Service status: `active (running)`
   - Logs show: Database connected, Redis connected, Worker ready

2. **When jobs are queued:**
   - Jobs appear in Redis queue (`LLEN yametee:jobs` increases)
   - Worker logs show job processing within seconds
   - Queue length decreases as jobs are processed

3. **When no jobs:**
   - Queue length: 0
   - Worker logs show: "ready and waiting for jobs"
   - Worker continues polling (no errors)

### Performance Expectations

- **Job processing time:** < 1 second for simple jobs
- **Queue consumption:** Jobs should be picked up within 1-5 seconds
- **Worker memory:** Typically 50-200MB
- **Worker CPU:** Low usage when idle, spikes during job processing

## Next Steps

Once verified, you can:

1. **Integrate job queueing** in your web application:
   ```typescript
   import { queueOrderJob, queueEmailJob } from '@/lib/jobs'
   
   // Example: Queue job when order is created
   await queueOrderJob(orderId)
   ```

2. **Set up monitoring** (optional):
   - Add monitoring alerts for queue length
   - Monitor worker service health
   - Track job processing times

3. **Scale workers** (if needed):
   - Deploy multiple worker instances
   - Each worker will consume jobs from the same queue
   - Redis handles job distribution automatically
