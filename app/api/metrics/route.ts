import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getRedisClient } from '@/lib/redis'
import { logger } from '@/lib/logger'

/**
 * Metrics endpoint for monitoring
 * Returns application metrics in Prometheus-compatible format
 */
export async function GET() {
  try {
    const metrics: string[] = []

    // System metrics
    const uptime = process.uptime()
    const memoryUsage = process.memoryUsage()
    
    metrics.push(`# HELP nodejs_uptime_seconds Node.js uptime in seconds`)
    metrics.push(`# TYPE nodejs_uptime_seconds gauge`)
    metrics.push(`nodejs_uptime_seconds ${uptime}`)

    metrics.push(`# HELP nodejs_memory_heap_used_bytes Heap memory used in bytes`)
    metrics.push(`# TYPE nodejs_memory_heap_used_bytes gauge`)
    metrics.push(`nodejs_memory_heap_used_bytes ${memoryUsage.heapUsed}`)

    metrics.push(`# HELP nodejs_memory_heap_total_bytes Heap memory total in bytes`)
    metrics.push(`# TYPE nodejs_memory_heap_total_bytes gauge`)
    metrics.push(`nodejs_memory_heap_total_bytes ${memoryUsage.heapTotal}`)

    metrics.push(`# HELP nodejs_memory_rss_bytes Resident set size in bytes`)
    metrics.push(`# TYPE nodejs_memory_rss_bytes gauge`)
    metrics.push(`nodejs_memory_rss_bytes ${memoryUsage.rss}`)

    // Database metrics
    try {
      const dbStartTime = Date.now()
      await prisma.$queryRaw`SELECT 1`
      const dbLatency = Date.now() - dbStartTime

      metrics.push(`# HELP database_connected Database connection status`)
      metrics.push(`# TYPE database_connected gauge`)
      metrics.push(`database_connected 1`)

      metrics.push(`# HELP database_query_latency_ms Database query latency in milliseconds`)
      metrics.push(`# TYPE database_query_latency_ms gauge`)
      metrics.push(`database_query_latency_ms ${dbLatency}`)

      // Get counts
      const [orderCount, productCount, customerCount] = await Promise.all([
        prisma.order.count().catch(() => 0),
        prisma.product.count().catch(() => 0),
        prisma.customer.count().catch(() => 0),
      ])

      metrics.push(`# HELP database_orders_total Total number of orders`)
      metrics.push(`# TYPE database_orders_total gauge`)
      metrics.push(`database_orders_total ${orderCount}`)

      metrics.push(`# HELP database_products_total Total number of products`)
      metrics.push(`# TYPE database_products_total gauge`)
      metrics.push(`database_products_total ${productCount}`)

      metrics.push(`# HELP database_customers_total Total number of customers`)
      metrics.push(`# TYPE database_customers_total gauge`)
      metrics.push(`database_customers_total ${customerCount}`)
    } catch (error) {
      logger.error('Database metrics collection failed', error)
      metrics.push(`database_connected 0`)
    }

    // Redis metrics
    try {
      const redis = getRedisClient()
      if (redis.isOpen) {
        await redis.ping()
        metrics.push(`# HELP redis_connected Redis connection status`)
        metrics.push(`# TYPE redis_connected gauge`)
        metrics.push(`redis_connected 1`)

        // Get queue length
        const queueLength = await redis.lLen('yametee:jobs').catch(() => 0)
        metrics.push(`# HELP redis_queue_length Job queue length`)
        metrics.push(`# TYPE redis_queue_length gauge`)
        metrics.push(`redis_queue_length ${queueLength}`)
      } else {
        metrics.push(`redis_connected 0`)
      }
    } catch (error) {
      logger.error('Redis metrics collection failed', error)
      metrics.push(`redis_connected 0`)
    }

    return new NextResponse(metrics.join('\n'), {
      headers: {
        'Content-Type': 'text/plain; version=0.0.4',
      },
    })
  } catch (error) {
    logger.error('Metrics collection error', error)
    return NextResponse.json({ error: 'Failed to collect metrics' }, { status: 500 })
  }
}
