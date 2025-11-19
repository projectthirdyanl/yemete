# Redis Troubleshooting Guide

## Common Issue: Connection Refused

If you see `Could not connect to Redis at 127.0.0.1:6379: Connection refused`, follow these steps:

### Step 1: Check if Redis is Running

```bash
# Check Redis service status
sudo systemctl status redis-server

# If not running, start it
sudo systemctl start redis-server

# Enable Redis to start on boot
sudo systemctl enable redis-server
```

### Step 2: Check Redis Configuration

```bash
# View Redis configuration
sudo cat /etc/redis/redis.conf | grep -E "^bind|^port|^protected-mode"

# Check what Redis is actually listening on
sudo netstat -tlnp | grep redis
# OR
sudo ss -tlnp | grep redis
```

### Step 3: Common Configuration Issues

#### Issue: Redis only bound to 127.0.0.1
If Redis is bound only to `127.0.0.1`, it should still accept local connections. However, if you need external access:

```bash
# Edit Redis config
sudo nano /etc/redis/redis.conf

# Find the bind line and change it to:
bind 0.0.0.0

# Or comment it out entirely (Redis will bind to all interfaces by default)
# bind 127.0.0.1

# Restart Redis
sudo systemctl restart redis-server
```

#### Issue: Protected mode enabled
If protected mode is enabled and Redis has no password, it may reject connections:

```bash
# Edit Redis config
sudo nano /etc/redis/redis.conf

# Set protected mode to no (if you're on a private network)
protected-mode no

# Restart Redis
sudo systemctl restart redis-server
```

### Step 4: Test Redis Connection

```bash
# Test local connection
redis-cli ping

# If that works, test with explicit host
redis-cli -h 127.0.0.1 ping

# Test from another machine (if configured for network access)
redis-cli -h 192.168.120.44 ping
```

### Step 5: Check Redis Logs

```bash
# View Redis logs
sudo journalctl -u redis-server -n 50 --no-pager

# Or check Redis log file (if configured)
sudo tail -f /var/log/redis/redis-server.log
```

### Step 6: Verify Redis Port

```bash
# Check if port 6379 is listening
sudo lsof -i :6379
# OR
sudo netstat -tlnp | grep 6379
```

## Quick Fix Commands

If Redis is not running, use these commands:

```bash
# Start Redis
sudo systemctl start redis-server

# Enable auto-start on boot
sudo systemctl enable redis-server

# Verify it's running
sudo systemctl status redis-server

# Test connection
redis-cli ping
```

## Configuration for Proxmox Setup

For the Proxmox distributed setup (Redis at 192.168.120.44), Redis should be configured to:

1. Accept connections from the internal network (192.168.120.0/24)
2. Still accept localhost connections

Recommended `/etc/redis/redis.conf` settings:

```conf
# Bind to localhost and specific network IP (most secure)
bind 127.0.0.1 192.168.120.44

# Alternative: Bind to all interfaces (less secure, but simpler)
# bind 0.0.0.0

# Port
port 6379

# Protected mode (disable if on private network)
protected-mode no

# Or set a password for security
# requirepass your-secure-password-here
```

**Binding Options Explained:**
- `bind 127.0.0.1 192.168.120.44` - **Recommended**: Accepts connections from localhost AND the specific network IP. More secure.
- `bind 192.168.120.44` - Accepts connections only from the network IP (no localhost access)
- `bind 0.0.0.0` - Accepts connections from all interfaces (less secure, but works for all scenarios)

After making changes:

```bash
sudo systemctl restart redis-server
sudo systemctl status redis-server
redis-cli ping
```

## Firewall Configuration

If using UFW firewall:

```bash
# Allow Redis from internal network
sudo ufw allow from 192.168.120.0/24 to any port 6379

# Allow localhost (usually not needed, but can help)
sudo ufw allow from 127.0.0.1 to any port 6379

# Check firewall status
sudo ufw status
```

## Testing from Application

Once Redis is running, test from your application:

```bash
# From web platform or worker VM
redis-cli -h 192.168.120.44 ping
```

Expected output: `PONG`
