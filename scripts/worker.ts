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
      await redis.connect()
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

// Start worker
workerLoop().catch(error => {
  console.error('Fatal worker error:', error)
  process.exit(1)
})
