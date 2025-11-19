#!/usr/bin/env tsx
/**
 * Background Worker Process
 *
 * This worker handles background jobs such as:
 * - Order processing
 * - Email notifications
 * - Webhook processing
 * - Cache warming
 * - Scheduled tasks
 *
 * Run this on the background-job VM (192.168.120.45)
 */

import { getRedisClient, closeRedis } from '../lib/redis'
import { prisma } from '../lib/prisma'

const WORKER_NAME = 'yametee-worker'
const WORKER_INTERVAL = 5000 // 5 seconds

interface Job {
  id: string
  type: string
  data: unknown
  createdAt: Date
}

/**
 * Validate required environment variables
 */
function validateEnvironment(): void {
  const required = ['DATABASE_URL']
  const missing: string[] = []

  for (const key of required) {
    if (!process.env[key]) {
      missing.push(key)
    }
  }

  if (missing.length > 0) {
    console.error(`Missing required environment variables: ${missing.join(', ')}`)
    process.exit(1)
  }

  console.log('Environment validation passed')
}

/**
 * Test database connection
 */
async function testDatabaseConnection(): Promise<boolean> {
  try {
    await prisma.$connect()
    console.log('Database connection successful')
    return true
  } catch (error) {
    console.error('Database connection failed:', error)
    return false
  }
}

/**
 * Test Redis connection
 */
async function testRedisConnection(): Promise<boolean> {
  try {
    const redis = getRedisClient()
    await redis.connect()
    await redis.ping()
    console.log('Redis connection successful')
    return true
  } catch (error) {
    console.error('Redis connection failed:', error)
    console.warn('Worker will continue but Redis operations will fail')
    return false
  }
}

/**
 * Process a single job
 */
async function processJob(job: Job): Promise<void> {
  console.log(`[${new Date().toISOString()}] Processing job ${job.id} of type ${job.type}`)

  try {
    switch (job.type) {
      case 'order:process':
        await processOrderJob(job.data as { orderId: string })
        break
      case 'email:send':
        await processEmailJob(job.data as { to: string; subject: string; body: string })
        break
      case 'webhook:process':
        await processWebhookJob(job.data as { event: string; payload: unknown })
        break
      case 'cache:warm':
        await processCacheWarmJob(job.data as { keys: string[] })
        break
      default:
        console.warn(`Unknown job type: ${job.type}`)
    }
  } catch (error) {
    console.error(`Error processing job ${job.id}:`, error)
    // In production, you might want to retry failed jobs
  }
}

/**
 * Process order-related jobs
 */
async function processOrderJob(data: { orderId: string }): Promise<void> {
  const { orderId } = data

  // Example: Update order status, send confirmation emails, etc.
  const order = await prisma.order.findUnique({
    where: { id: orderId },
  })

  if (!order) {
    throw new Error(`Order ${orderId} not found`)
  }

  console.log(`Order ${orderId} processed: ${order.status}`)
  // Add your order processing logic here
}

/**
 * Process email jobs
 */
async function processEmailJob(data: { to: string; subject: string; body: string }): Promise<void> {
  const { to, subject, body } = data

  // In production, integrate with your email service (SendGrid, SES, etc.)
  console.log(`Sending email to ${to}: ${subject}`)
  // Add your email sending logic here
}

/**
 * Process webhook jobs
 */
async function processWebhookJob(data: { event: string; payload: unknown }): Promise<void> {
  const { event, payload } = data

  console.log(`Processing webhook event: ${event}`)
  // Add your webhook processing logic here
}

/**
 * Process cache warming jobs
 */
async function processCacheWarmJob(data: { keys: string[] }): Promise<void> {
  const { keys } = data

  console.log(`Warming cache for ${keys.length} keys`)
  // Add your cache warming logic here
}

/**
 * Get next job from Redis queue
 */
async function getNextJob(): Promise<Job | null> {
  try {
    const redis = getRedisClient()
    if (!redis.isOpen) {
      try {
        await redis.connect()
      } catch (error) {
        console.error('Failed to connect to Redis:', error)
        return null
      }
    }

    // Use Redis LIST as a simple queue (BLPOP for blocking pop)
    const result = await redis.blPop(['yametee:jobs'], 1)

    if (!result) {
      return null
    }

    return JSON.parse(result.element) as Job
  } catch (error) {
    console.error('Error getting next job:', error)
    return null
  }
}

/**
 * Main worker loop
 */
async function workerLoop(): Promise<void> {
  console.log(`[${new Date().toISOString()}] Worker ${WORKER_NAME} started`)

  // Test connections before starting
  const dbConnected = await testDatabaseConnection()
  if (!dbConnected) {
    console.error('Cannot start worker: Database connection failed')
    process.exit(1)
  }

  // Redis is optional for now, but log a warning
  await testRedisConnection()

  console.log(`[${new Date().toISOString()}] Worker ${WORKER_NAME} ready and waiting for jobs`)

  while (true) {
    try {
      const job = await getNextJob()

      if (job) {
        await processJob(job)
      }

      // Small delay to prevent tight loop
      await new Promise(resolve => setTimeout(resolve, 100))
    } catch (error) {
      console.error('Worker loop error:', error)
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, WORKER_INTERVAL))
    }
  }
}

/**
 * Graceful shutdown handler
 */
async function shutdown(): Promise<void> {
  console.log('Shutting down worker...')
  await closeRedis()
  await prisma.$disconnect()
  process.exit(0)
}

process.on('SIGTERM', shutdown)
process.on('SIGINT', shutdown)

// Handle uncaught errors
process.on('uncaughtException', error => {
  console.error('Uncaught exception:', error)
  shutdown().finally(() => process.exit(1))
})

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled rejection at:', promise, 'reason:', reason)
})

// Validate environment and start worker
try {
  validateEnvironment()
  workerLoop().catch(error => {
    console.error('Fatal worker error:', error)
    shutdown().finally(() => process.exit(1))
  })
} catch (error) {
  console.error('Failed to start worker:', error)
  process.exit(1)
}
