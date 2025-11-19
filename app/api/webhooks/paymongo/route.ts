import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyWebhookSignature } from '@/lib/paymongo'
import { queueOrderJob, queueEmailJob, queueWebhookJob } from '@/lib/jobs'
import { logger } from '@/lib/logger'
import { UnauthorizedError, ValidationError, formatErrorResponse } from '@/lib/errors'

export async function POST(request: NextRequest) {
  try {
    const signature = request.headers.get('paymongo-signature')
    const webhookSecret = process.env.PAYMONGO_WEBHOOK_SECRET

    if (!signature || !webhookSecret) {
      throw new UnauthorizedError('Missing signature or secret')
    }

    let body: string
    try {
      body = await request.text()
    } catch (error) {
      throw new ValidationError('Failed to read request body')
    }

    // Verify webhook signature
    if (!verifyWebhookSignature(body, signature, webhookSecret)) {
      logger.warn('Invalid webhook signature', { signature })
      throw new UnauthorizedError('Invalid signature')
    }

    let payload: unknown
    try {
      payload = JSON.parse(body)
    } catch (error) {
      throw new ValidationError('Invalid JSON payload')
    }

    if (!payload || typeof payload !== 'object' || !('data' in payload)) {
      throw new ValidationError('Invalid webhook payload structure')
    }

    const event = (payload as { data: unknown }).data

    // Handle payment.paid event
    if (event.type === 'payment.paid' || event.attributes.type === 'payment.paid') {
      const paymentId = event.id || event.attributes.id
      const amount = event.attributes?.amount
        ? event.attributes.amount / 100
        : event.attributes?.data?.attributes?.amount / 100

      // Find payment by provider payment ID
      const payment = await prisma.payment.findFirst({
        where: {
          providerPaymentId: paymentId,
        },
        include: {
          order: {
            include: {
              items: true,
              customer: {
                select: {
                  email: true,
                  name: true,
                },
              },
            },
          },
        },
      })

      if (payment && payment.status === 'PENDING') {
        // Update payment status
        await prisma.payment.update({
          where: { id: payment.id },
          data: {
            status: 'PAID',
            rawPayload: payload,
          },
        })

        // Update order status
        await prisma.order.update({
          where: { id: payment.orderId },
          data: {
            paymentStatus: 'PAID',
            status: 'PAID',
          },
        })

        // Decrease stock quantities
        for (const item of payment.order.items) {
          await prisma.variant.update({
            where: { id: item.variantId },
            data: {
              stockQuantity: {
                decrement: item.quantity,
              },
            },
          })
        }

        // Queue background jobs for order processing and notifications
        try {
          // Queue order processing job
          await queueOrderJob(payment.orderId)
          logger.info('Order processing job queued', { orderId: payment.orderId })

          // Queue email notification if customer email exists
          if (payment.order.customer?.email) {
            await queueEmailJob(
              payment.order.customer.email,
              `Order ${payment.order.orderNumber} Confirmed`,
              `Your order ${payment.order.orderNumber} has been confirmed and payment received.`
            )
            logger.info('Email notification queued', { orderId: payment.orderId, email: payment.order.customer.email })
          }

          // Queue webhook processing job
          await queueWebhookJob('payment.paid', payload)
          logger.info('Webhook processing job queued', { paymentId })
        } catch (error) {
          // Log error but don't fail webhook processing if job queueing fails
          logger.error('Failed to queue background jobs', error, { orderId: payment.orderId, paymentId })
        }
      }
    }

    // Handle payment.failed event
    if (event.type === 'payment.failed' || event.attributes.type === 'payment.failed') {
      const paymentId = event.id || event.attributes.id

      const payment = await prisma.payment.findFirst({
        where: {
          providerPaymentId: paymentId,
        },
      })

      if (payment) {
        await prisma.payment.update({
          where: { id: payment.id },
          data: {
            status: 'FAILED',
            rawPayload: payload,
          },
        })

        await prisma.order.update({
          where: { id: payment.orderId },
          data: {
            paymentStatus: 'FAILED',
          },
        })
      }
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    logger.error('Webhook error', error)
    const errorResponse = formatErrorResponse(error)
    const statusCode = error instanceof UnauthorizedError || error instanceof ValidationError
      ? error.statusCode
      : 500
    
    return NextResponse.json(errorResponse, { status: statusCode })
  }
}
