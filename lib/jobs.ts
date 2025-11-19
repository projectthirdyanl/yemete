import { getRedisClient } from './redis'
import { logger } from './logger'

export interface Job {
  id: string
  type: string
  data: unknown
  createdAt: Date
}

/**
 * Queue a background job for processing by the worker
 *
 * @param type - Job type (e.g., 'order:process', 'email:send')
 * @param data - Job data payload
 * @returns Job ID if successful, null otherwise
 */
export async function queueJob(type: string, data: unknown): Promise<string | null> {
  try {
    if (!type || typeof type !== 'string') {
      logger.error('Invalid job type', undefined, { type })
      return null
    }

    const redis = getRedisClient()
    if (!redis.isOpen) {
      await redis.connect()
    }

    const job: Job = {
      id: `${type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      data,
      createdAt: new Date(),
    }

    // Push job to Redis queue (RPUSH adds to end of list)
    await redis.rPush('yametee:jobs', JSON.stringify(job))
    
    logger.debug('Job queued successfully', { jobId: job.id, jobType: type })
    return job.id
  } catch (error) {
    logger.error('Error queueing job', error, { jobType: type })
    return null
  }
}

/**
 * Queue an order processing job
 */
export async function queueOrderJob(orderId: string): Promise<string | null> {
  return queueJob('order:process', { orderId })
}

/**
 * Queue an email sending job
 */
export async function queueEmailJob(
  to: string,
  subject: string,
  body: string
): Promise<string | null> {
  return queueJob('email:send', { to, subject, body })
}

/**
 * Queue a webhook processing job
 */
export async function queueWebhookJob(event: string, payload: unknown): Promise<string | null> {
  return queueJob('webhook:process', { event, payload })
}

/**
 * Queue a cache warming job
 */
export async function queueCacheWarmJob(keys: string[]): Promise<string | null> {
  return queueJob('cache:warm', { keys })
}
