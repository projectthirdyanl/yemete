import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyWebhookSignature } from '@/lib/paymongo'

export async function POST(request: NextRequest) {
  try {
    const signature = request.headers.get('paymongo-signature')
    const webhookSecret = process.env.PAYMONGO_WEBHOOK_SECRET

    if (!signature || !webhookSecret) {
      return NextResponse.json({ error: 'Missing signature or secret' }, { status: 401 })
    }

    const body = await request.text()

    // Verify webhook signature
    // In production, implement proper HMAC verification
    // For now, we'll accept the webhook if secret matches
    if (!verifyWebhookSignature(body, signature, webhookSecret)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    const payload = JSON.parse(body)
    const event = payload.data

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
    console.error('Webhook error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Webhook processing failed'
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
