/**
 * Monitoring and alerting utilities
 */

import { logger } from './logger'

export interface AlertConfig {
  enabled: boolean
  webhookUrl?: string
  email?: string
  threshold?: {
    errorRate?: number
    responseTime?: number
    queueLength?: number
  }
}

const DEFAULT_CONFIG: AlertConfig = {
  enabled: process.env.MONITORING_ENABLED === 'true',
  webhookUrl: process.env.ALERT_WEBHOOK_URL,
  email: process.env.ALERT_EMAIL,
  threshold: {
    errorRate: parseFloat(process.env.ALERT_ERROR_RATE_THRESHOLD || '0.1'),
    responseTime: parseInt(process.env.ALERT_RESPONSE_TIME_THRESHOLD || '5000'),
    queueLength: parseInt(process.env.ALERT_QUEUE_LENGTH_THRESHOLD || '100'),
  },
}

class MonitoringService {
  private config: AlertConfig
  private errorCount = 0
  private requestCount = 0
  private lastAlertTime: Record<string, number> = {}

  constructor(config: AlertConfig = DEFAULT_CONFIG) {
    this.config = config
  }

  /**
   * Track API request
   */
  trackRequest(success: boolean, duration: number, endpoint: string): void {
    this.requestCount++
    if (!success) {
      this.errorCount++
    }

    // Check thresholds
    if (this.config.enabled) {
      const errorRate = this.errorCount / this.requestCount
      if (errorRate > (this.config.threshold?.errorRate || 0.1)) {
        this.sendAlert('high_error_rate', {
          errorRate,
          errorCount: this.errorCount,
          requestCount: this.requestCount,
        })
      }

      if (duration > (this.config.threshold?.responseTime || 5000)) {
        this.sendAlert('slow_response', {
          endpoint,
          duration,
          threshold: this.config.threshold?.responseTime,
        })
      }
    }
  }

  /**
   * Track queue length
   */
  async trackQueueLength(queueLength: number): Promise<void> {
    if (
      this.config.enabled &&
      queueLength > (this.config.threshold?.queueLength || 100)
    ) {
      this.sendAlert('high_queue_length', {
        queueLength,
        threshold: this.config.threshold?.queueLength,
      })
    }
  }

  /**
   * Send alert
   */
  private async sendAlert(type: string, data: Record<string, unknown>): Promise<void> {
    const now = Date.now()
    const lastAlert = this.lastAlertTime[type] || 0
    const cooldown = 5 * 60 * 1000 // 5 minutes cooldown

    // Prevent alert spam
    if (now - lastAlert < cooldown) {
      return
    }

    this.lastAlertTime[type] = now

    const alert = {
      type,
      timestamp: new Date().toISOString(),
      service: 'yametee-api',
      data,
    }

    logger.warn(`Alert: ${type}`, data)

    // Send to webhook if configured
    if (this.config.webhookUrl) {
      try {
        await fetch(this.config.webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(alert),
        })
      } catch (error) {
        logger.error('Failed to send alert webhook', error)
      }
    }

    // TODO: Send email if configured
    // You can integrate with SendGrid, SES, etc.
  }

  /**
   * Reset counters (call periodically)
   */
  resetCounters(): void {
    this.errorCount = 0
    this.requestCount = 0
  }
}

export const monitoring = new MonitoringService()

// Reset counters every hour
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    monitoring.resetCounters()
  }, 60 * 60 * 1000) // 1 hour
}
