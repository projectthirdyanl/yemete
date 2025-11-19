import { createClient, RedisClientType } from 'redis'

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
          console.error('Redis: Max reconnection attempts reached')
          return new Error('Max reconnection attempts reached')
        }
        // Exponential backoff: 50ms, 100ms, 200ms, 400ms, etc.
        return Math.min(retries * 50, 1000)
      },
      connectTimeout: 5000,
    },
  })

  redisClient.on('error', err => {
    console.error('Redis Client Error:', err)
  })

  redisClient.on('connect', () => {
    console.log('Redis Client Connected')
  })

  redisClient.on('reconnecting', () => {
    console.log('Redis Client Reconnecting...')
  })

  // Connect lazily - don't await here
  redisClient.connect().catch(err => {
    console.error('Failed to connect to Redis:', err)
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
      console.error(`Redis GET error for key ${key}:`, error)
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
      console.error(`Redis SET error for key ${key}:`, error)
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
      console.error(`Redis DEL error for key ${key}:`, error)
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
      console.error(`Redis EXISTS error for key ${key}:`, error)
      return false
    }
  },
}
