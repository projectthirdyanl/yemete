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
import { logger } from '../lib/logger'
import { NotFoundError, DatabaseError, ValidationError } from '../lib/errors'

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
    logger.error(`Missing required environment variables: ${missing.join(', ')}`)
    process.exit(1)
  }

  logger.info('Environment validation passed')
}

/**
 * Test database connection
 */
async function testDatabaseConnection(): Promise<boolean> {
  try {
    await prisma.$connect()
    logger.info('Database connection successful')
    return true
  } catch (error) {
    logger.error('Database connection failed', error)
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
    logger.info('Redis connection successful')
    return true
  } catch (error) {
    logger.error('Redis connection failed', error)
    logger.warn('Worker will continue but Redis operations will fail')
    return false
  }
}

/**
 * Process a single job
 */
async function processJob(job: Job): Promise<void> {
  logger.info(`Processing job ${job.id} of type ${job.type}`, { jobId: job.id, jobType: job.type })

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
        logger.warn(`Unknown job type: ${job.type}`, { jobId: job.id, jobType: job.type })
    }
  } catch (error) {
    logger.error(`Error processing job ${job.id}`, error, { jobId: job.id, jobType: job.type })
    // In production, you might want to retry failed jobs or send to dead letter queue
    throw error // Re-throw to allow retry logic if needed
  }
}

/**
 * Process order-related jobs
 */
async function processOrderJob(data: { orderId: string }): Promise<void> {
  const { orderId } = data

  if (!orderId || typeof orderId !== 'string') {
    throw new ValidationError('Invalid orderId in job data')
  }

  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        customer: true,
        items: true,
      },
    })

    if (!order) {
      throw new NotFoundError('Order', orderId)
    }

    logger.info(`Order ${orderId} processed`, { orderId, status: order.status })
    
    // Add your order processing logic here
    // Example: Send confirmation emails, update inventory, etc.
  } catch (error) {
    if (error instanceof NotFoundError) {
      throw error
    }
    throw new DatabaseError(`Failed to process order ${orderId}`, error)
  }
}

/**
 * Process email jobs
 */
async function processEmailJob(data: { to: string; subject: string; body: string }): Promise<void> {
  const { to, subject, body } = data

  if (!to || !subject || !body) {
    throw new ValidationError('Missing required email fields')
  }

  // Validate email format
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
    throw new ValidationError(`Invalid email address: ${to}`)
  }

  logger.info(`Sending email to ${to}`, { to, subject })
  
  // In production, integrate with your email service (SendGrid, SES, etc.)
  // Add your email sending logic here
  // Example:
  // await sendEmail({ to, subject, body })
}

/**
 * Process webhook jobs
 */
async function processWebhookJob(data: { event: string; payload: unknown }): Promise<void> {
  const { event, payload } = data

  if (!event || typeof event !== 'string') {
    throw new ValidationError('Invalid webhook event data')
  }

  logger.info(`Processing webhook event: ${event}`, { event })
  // Add your webhook processing logic here
}

/**
 * Process cache warming jobs
 */
async function processCacheWarmJob(data: { keys: string[] }): Promise<void> {
  const { keys } = data

  if (!Array.isArray(keys) || keys.length === 0) {
    throw new ValidationError('Invalid cache keys array')
  }

  logger.info(`Warming cache for ${keys.length} keys`, { keyCount: keys.length })
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
    logger.error('Error getting next job', error)
    return null
  }
}

/**
 * Main worker loop
 */
async function workerLoop(): Promise<void> {
  logger.info(`Worker ${WORKER_NAME} started`)

  // Test connections before starting
  const dbConnected = await testDatabaseConnection()
  if (!dbConnected) {
    logger.error('Cannot start worker: Database connection failed')
    process.exit(1)
  }

  // Redis is optional for now, but log a warning
  const redisConnected = await testRedisConnection()
  if (!redisConnected) {
    logger.warn('Redis connection failed. Worker will continue but job processing will fail.')
  }

  logger.info(`Worker ${WORKER_NAME} ready and waiting for jobs`)

  while (true) {
    try {
      const job = await getNextJob()

      if (job) {
        await processJob(job)
      }

      // Small delay to prevent tight loop
      await new Promise(resolve => setTimeout(resolve, 100))
    } catch (error) {
      logger.error('Worker loop error', error)
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, WORKER_INTERVAL))
    }
  }
}

/**
 * Graceful shutdown handler
 */
async function shutdown(): Promise<void> {
  logger.info('Shutting down worker...')
  try {
    await closeRedis()
    await prisma.$disconnect()
    logger.info('Worker shutdown complete')
  } catch (error) {
    logger.error('Error during worker shutdown', error)
  }
  process.exit(0)
}

process.on('SIGTERM', shutdown)
process.on('SIGINT', shutdown)

// Handle uncaught errors
process.on('uncaughtException', error => {
  logger.error('Uncaught exception', error)
  shutdown().finally(() => process.exit(1))
})

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled rejection', reason instanceof Error ? reason : new Error(String(reason)), { promise: String(promise) })
})

// Validate environment and start worker
try {
  validateEnvironment()
  workerLoop().catch(error => {
    logger.error('Fatal worker error', error)
    shutdown().finally(() => process.exit(1))
  })
} catch (error) {
  logger.error('Failed to start worker', error)
  process.exit(1)
}
