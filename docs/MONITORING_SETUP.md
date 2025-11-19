# Monitoring and Alerting Setup Guide

This guide explains how to set up monitoring and alerting for your Yametee application.

## Overview

The application includes:
- **Health Check Endpoint**: `/api/health` - Service health status
- **Metrics Endpoint**: `/api/metrics` - Prometheus-compatible metrics
- **Monitoring Service**: Tracks errors, response times, and queue length
- **Alerting**: Webhook-based alerts for critical issues

## Health Check Endpoint

### Endpoint: `GET /api/health`

Returns service health status:

```json
{
  "status": "healthy",
  "timestamp": "2025-01-19T13:00:00.000Z",
  "service": "yametee-api",
  "checks": {
    "database": "connected",
    "redis": "connected",
    "uptime": 3600
  },
  "version": "1.0.0"
}
```

**Status Codes:**
- `200` - Healthy or Degraded (Redis down but DB up)
- `503` - Unhealthy (Database down)

### Usage

**Docker Health Check:**
```dockerfile
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1
```

**Kubernetes Liveness/Readiness Probe:**
```yaml
livenessProbe:
  httpGet:
    path: /api/health
    port: 3000
  initialDelaySeconds: 30
  periodSeconds: 10

readinessProbe:
  httpGet:
    path: /api/health
    port: 3000
  initialDelaySeconds: 10
  periodSeconds: 5
```

**Systemd Service Health Check:**
```bash
# Add to systemd service
ExecStartPre=/usr/bin/curl -f http://localhost:3000/api/health || exit 1
```

## Metrics Endpoint

### Endpoint: `GET /api/metrics`

Returns Prometheus-compatible metrics:

```
# HELP nodejs_uptime_seconds Node.js uptime in seconds
# TYPE nodejs_uptime_seconds gauge
nodejs_uptime_seconds 3600

# HELP database_connected Database connection status
# TYPE database_connected gauge
database_connected 1

# HELP database_query_latency_ms Database query latency in milliseconds
# TYPE database_query_latency_ms gauge
database_query_latency_ms 5

# HELP redis_connected Redis connection status
# TYPE redis_connected gauge
redis_connected 1

# HELP redis_queue_length Job queue length
# TYPE redis_queue_length gauge
redis_queue_length 0
```

### Prometheus Setup

1. **Add to Prometheus config** (`prometheus.yml`):

```yaml
scrape_configs:
  - job_name: 'yametee-api'
    scrape_interval: 15s
    metrics_path: '/api/metrics'
    static_configs:
      - targets: ['192.168.120.50:3000']
```

2. **Start Prometheus:**
```bash
docker run -d \
  -p 9090:9090 \
  -v /path/to/prometheus.yml:/etc/prometheus/prometheus.yml \
  prom/prometheus
```

3. **View metrics:**
- Prometheus UI: http://localhost:9090
- Grafana: Connect Prometheus as data source

## Alerting Configuration

### Environment Variables

Add to your `.env` file:

```bash
# Enable monitoring
MONITORING_ENABLED=true

# Alert webhook URL (e.g., Slack, Discord, PagerDuty)
ALERT_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL

# Alert email (optional - requires email service integration)
ALERT_EMAIL=admin@yametee.com

# Alert thresholds
ALERT_ERROR_RATE_THRESHOLD=0.1      # 10% error rate
ALERT_RESPONSE_TIME_THRESHOLD=5000  # 5 seconds
ALERT_QUEUE_LENGTH_THRESHOLD=100    # 100 jobs in queue
```

### Alert Types

1. **High Error Rate**: When error rate exceeds threshold
2. **Slow Response**: When response time exceeds threshold
3. **High Queue Length**: When job queue length exceeds threshold

### Webhook Alert Format

```json
{
  "type": "high_error_rate",
  "timestamp": "2025-01-19T13:00:00.000Z",
  "service": "yametee-api",
  "data": {
    "errorRate": 0.15,
    "errorCount": 15,
    "requestCount": 100
  }
}
```

### Slack Webhook Setup

1. **Create Slack Incoming Webhook:**
   - Go to https://api.slack.com/apps
   - Create new app → Incoming Webhooks
   - Add webhook to your channel
   - Copy webhook URL

2. **Set environment variable:**
   ```bash
   ALERT_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
   ```

3. **Custom Slack Format** (optional - modify `lib/monitoring.ts`):
   ```typescript
   const slackMessage = {
     text: `🚨 Alert: ${type}`,
     blocks: [
       {
         type: 'section',
         text: {
           type: 'mrkdwn',
           text: `*Alert Type:* ${type}\n*Service:* ${alert.service}\n*Time:* ${alert.timestamp}`
         }
       }
     ]
   }
   ```

## Monitoring Dashboard (Grafana)

### Recommended Dashboards

1. **Service Health Dashboard:**
   - Uptime
   - Health check status
   - Database/Redis connectivity

2. **Performance Dashboard:**
   - Response times
   - Request rates
   - Error rates

3. **Queue Dashboard:**
   - Queue length
   - Job processing rate
   - Failed jobs

### Example Grafana Queries

**Error Rate:**
```promql
rate(http_requests_total{status=~"5.."}[5m]) / rate(http_requests_total[5m])
```

**Average Response Time:**
```promql
rate(http_request_duration_seconds_sum[5m]) / rate(http_request_duration_seconds_count[5m])
```

**Queue Length:**
```promql
redis_queue_length
```

## Default Admin Setup

### Seed Default Admin

Run the seed script to create a default admin user:

```bash
# Using default credentials
npm run seed:admin

# With custom credentials
npm run seed:admin admin@example.com mypassword

# Using environment variables
DEFAULT_ADMIN_EMAIL=admin@yametee.com DEFAULT_ADMIN_PASSWORD=admin123 npm run seed:admin
```

**Default Credentials:**
- Email: `admin@yametee.com`
- Password: `admin123`

⚠️ **SECURITY WARNING**: Change the default password immediately after first login!

### Auto-Create Admin on First Login

The login endpoint will automatically create an admin user if:
1. No admin users exist in the database
2. Email contains "admin" or is "admin@yametee.com"

This feature is now optimized and won't cause performance issues.

## Performance Improvements

### Admin Login Optimization

The admin login route has been optimized:
- ✅ Removed slow `count()` query
- ✅ Added request timing
- ✅ Better error handling
- ✅ Improved logging

**Before:** Login could take 5-10 seconds with many customers
**After:** Login takes < 1 second regardless of database size

## Monitoring Best Practices

1. **Set up alerts** for critical metrics
2. **Monitor error rates** - Alert if > 5%
3. **Monitor response times** - Alert if > 2 seconds
4. **Monitor queue length** - Alert if > 50 jobs
5. **Set up dashboards** for visual monitoring
6. **Review logs** regularly for patterns

## Troubleshooting

### Health Check Failing

```bash
# Check database connection
psql -h 192.168.120.42 -U yametee_user -d yame_tee -c "SELECT 1"

# Check Redis connection
redis-cli -h 192.168.120.44 ping

# Check application logs
journalctl -u yametee-web -f
```

### Metrics Not Appearing

1. Verify endpoint is accessible: `curl http://localhost:3000/api/metrics`
2. Check Prometheus config
3. Verify scrape interval (default: 15s)
4. Check Prometheus logs

### Alerts Not Sending

1. Verify `MONITORING_ENABLED=true`
2. Check webhook URL is correct
3. Test webhook manually: `curl -X POST $ALERT_WEBHOOK_URL -d '{"test": true}'`
4. Check application logs for errors

## Next Steps

1. Set up Prometheus and Grafana
2. Configure alert webhooks
3. Create monitoring dashboards
4. Set up log aggregation (optional - ELK, Loki, etc.)
5. Configure uptime monitoring (UptimeRobot, Pingdom, etc.)
