#!/bin/bash
# Fix merge conflicts on server
# Run this on the web platform VM

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}Fixing merge conflicts...${NC}"

# Detect app directory
if [ -d "/opt/apps/yemete" ]; then
    APP_DIR="/opt/apps/yemete"
elif [ -d "/opt/yametee" ]; then
    APP_DIR="/opt/yametee"
else
    echo -e "${RED}Error: Could not find application directory${NC}"
    exit 1
fi

cd "$APP_DIR"

echo -e "${GREEN}Checking for merge conflicts...${NC}"

# Check for conflict markers
CONFLICTS=$(grep -r "<<<<<<< HEAD\|=======\|>>>>>>>" . --include="*.ts" --include="*.tsx" --include="*.js" 2>/dev/null | wc -l || echo "0")

if [ "$CONFLICTS" -gt 0 ]; then
    echo -e "${YELLOW}Found merge conflicts. Resolving...${NC}"
    
    # Fix redis.ts
    if grep -q "<<<<<<< HEAD" lib/redis.ts 2>/dev/null; then
        echo -e "${GREEN}Fixing lib/redis.ts...${NC}"
        cat > lib/redis.ts << 'EOF'
import { createClient, RedisClientType } from 'redis'
import { logger } from './logger'

let redisClient: RedisClientType | null = null

/**
 * Redis client singleton for caching and session storage
 * Connects to external Redis server (192.168.120.44)
 */
export function getRedisClient(): RedisClientType {
  if (redisClient && redisClient.isOpen) {
    return redisClient
  }

  const redisUrl = process.env.REDIS_URL || 'redis://192.168.120.44:6379'

  redisClient = createClient({
    url: redisUrl,
    socket: {
      reconnectStrategy: retries => {
        if (retries > 10) {
          logger.error('Redis: Max reconnection attempts reached', new Error('Max reconnection attempts reached'), { retries })
          return new Error('Max reconnection attempts reached')
        }
        // Exponential backoff: 50ms, 100ms, 200ms, 400ms, etc.
        const delay = Math.min(retries * 50, 1000)
        logger.debug('Redis reconnecting', { retry: retries, delay })
        return delay
      },
      connectTimeout: 5000,
    },
  })

  redisClient.on('error', err => {
    logger.error('Redis Client Error', err)
  })

  redisClient.on('connect', () => {
    logger.info('Redis Client Connected')
  })

  redisClient.on('reconnecting', () => {
    logger.info('Redis Client Reconnecting...')
  })

  // Connect lazily - don't await here
  redisClient.connect().catch(err => {
    logger.error('Failed to connect to Redis', err)
  })

  return redisClient
}

/**
 * Gracefully close Redis connection
 */
export async function closeRedis(): Promise<void> {
  if (redisClient && redisClient.isOpen) {
    await redisClient.quit()
    redisClient = null
  }
}

/**
 * Cache helper functions
 */
export const cache = {
  /**
   * Get value from cache
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      const client = getRedisClient()
      if (!client.isOpen) {
        await client.connect()
      }
      const value = await client.get(key)
      return value ? (JSON.parse(value) as T) : null
    } catch (error) {
      logger.error(`Redis GET error for key ${key}`, error, { key })
      return null
    }
  },

  /**
   * Set value in cache with optional TTL (time to live in seconds)
   */
  async set(key: string, value: unknown, ttl?: number): Promise<boolean> {
    try {
      const client = getRedisClient()
      if (!client.isOpen) {
        await client.connect()
      }
      const serialized = JSON.stringify(value)
      if (ttl) {
        await client.setEx(key, ttl, serialized)
      } else {
        await client.set(key, serialized)
      }
      return true
    } catch (error) {
      logger.error(`Redis SET error for key ${key}`, error, { key })
      return false
    }
  },

  /**
   * Delete value from cache
   */
  async del(key: string): Promise<boolean> {
    try {
      const client = getRedisClient()
      if (!client.isOpen) {
        await client.connect()
      }
      await client.del(key)
      return true
    } catch (error) {
      logger.error(`Redis DEL error for key ${key}`, error, { key })
      return false
    }
  },

  /**
   * Check if key exists
   */
  async exists(key: string): Promise<boolean> {
    try {
      const client = getRedisClient()
      if (!client.isOpen) {
        await client.connect()
      }
      const result = await client.exists(key)
      return result > 0
    } catch (error) {
      logger.error(`Redis EXISTS error for key ${key}`, error, { key })
      return false
    }
  },
}
EOF
    fi
    
    # Check webhook file for git commit messages
    if grep -q "b45eee5\|Server changes" app/api/webhooks/paymongo/route.ts 2>/dev/null; then
        echo -e "${GREEN}Cleaning app/api/webhooks/paymongo/route.ts...${NC}"
        # Remove any lines with git commit hashes or merge messages
        sed -i '/b45eee5/d; /Server changes/d; /^[[:space:]]*$/d' app/api/webhooks/paymongo/route.ts 2>/dev/null || true
    fi
    
    echo -e "${GREEN}Merge conflicts resolved${NC}"
else
    echo -e "${GREEN}No merge conflicts found${NC}"
fi

# Clean .next cache
echo -e "${GREEN}Cleaning build cache...${NC}"
rm -rf .next

echo -e "${GREEN}=========================================="
echo "Merge conflicts fixed!"
echo ""
echo "Next steps:"
echo "  1. Pull latest changes: git pull"
echo "  2. Rebuild: npm run build"
echo "  3. Restart service: systemctl restart yametee-web"
echo "==========================================${NC}"
