import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getRedisClient } from '@/lib/redis'
import { logger } from '@/lib/logger'

interface HealthCheck {
  status: 'healthy' | 'unhealthy' | 'degraded'
  timestamp: string
  service: string
  checks: {
    database: 'connected' | 'disconnected' | 'error'
    redis: 'connected' | 'disconnected' | 'error'
    uptime: number
  }
  version?: string
}

/**
 * Health check endpoint for monitoring
 * Returns service health status
 */
export async function GET() {
  const startTime = Date.now()
  const checks: HealthCheck['checks'] = {
    database: 'disconnected',
    redis: 'disconnected',
    uptime: process.uptime(),
  }

  try {
    // Check database connection
    try {
      await prisma.$queryRaw`SELECT 1`
      checks.database = 'connected'
    } catch (error) {
      logger.error('Database health check failed', error)
      checks.database = 'error'
    }

    // Check Redis connection
    try {
      const redis = getRedisClient()
      if (redis.isOpen) {
        await redis.ping()
        checks.redis = 'connected'
      } else {
        try {
          await redis.connect()
          await redis.ping()
          checks.redis = 'connected'
        } catch (error) {
          logger.error('Redis health check failed', error)
          checks.redis = 'error'
        }
      }
    } catch (error) {
      logger.error('Redis health check failed', error)
      checks.redis = 'error'
    }

    // Determine overall status
    const isHealthy = checks.database === 'connected'
    const isDegraded = checks.database === 'connected' && checks.redis === 'error'
    
    const status: HealthCheck['status'] = isHealthy
      ? isDegraded
        ? 'degraded'
        : 'healthy'
      : 'unhealthy'

    const healthCheck: HealthCheck = {
      status,
      timestamp: new Date().toISOString(),
      service: 'yametee-api',
      checks,
      version: process.env.npm_package_version || '1.0.0',
    }

    const statusCode = status === 'healthy' ? 200 : status === 'degraded' ? 200 : 503

    return NextResponse.json(healthCheck, { status: statusCode })
  } catch (error) {
    logger.error('Health check error', error)
    
    const healthCheck: HealthCheck = {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      service: 'yametee-api',
      checks,
    }

    return NextResponse.json(healthCheck, { status: 503 })
  }
}
