import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getRedisClient } from '@/lib/redis'

/**
 * Health check endpoint for monitoring and orchestration
 * Used by Docker health checks, Kubernetes liveness/readiness probes, and load balancers
 */
export async function GET() {
  const checks: Record<string, string> = {}
  let allHealthy = true

  // Check database connectivity
  try {
    await prisma.$queryRaw`SELECT 1`
    checks.database = 'connected'
  } catch (error) {
    checks.database = 'disconnected'
    allHealthy = false
  }

  // Check Redis connectivity (optional - don't fail if Redis is down)
  try {
    const redis = getRedisClient()
    if (redis.isOpen) {
      await redis.ping()
      checks.redis = 'connected'
    } else {
      checks.redis = 'disconnected'
      // Redis is optional, so we don't mark as unhealthy
    }
  } catch (error) {
    checks.redis = 'disconnected'
    // Redis is optional, so we don't mark as unhealthy
  }

  const status = allHealthy ? 'healthy' : 'unhealthy'
  const statusCode = allHealthy ? 200 : 503

  return NextResponse.json(
    {
      status,
      timestamp: new Date().toISOString(),
      service: 'yametee-api',
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      checks,
    },
    { status: statusCode }
  )
}
