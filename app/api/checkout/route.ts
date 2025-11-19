import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'
import { generateOrderNumber } from '@/lib/utils'
import { createPayMongoCheckout, PaymentMethod } from '@/lib/paymongo'
import { getCartSessionId, getOrCreateCart } from '@/lib/cart'
import { queueOrderJob } from '@/lib/jobs'
import { logger } from '@/lib/logger'
import { ValidationError, DatabaseError, ExternalServiceError, formatErrorResponse } from '@/lib/errors'
import type { CartItemResponse } from '@yametee/types'

interface CheckoutCartItem {
  productId: string
  variantId: string
  size: string
  color: string
  quantity: number
  price: number | string
  productName: string
  imageUrl?: string
}

interface CheckoutCustomer {
  email?: string
  name: string
  phone: string
  line1: string
  line2?: string
  city: string
  province: string
  postalCode: string
}

interface CheckoutRequestBody {
  cart: CheckoutCartItem[]
  customer: CheckoutCustomer
  paymentMethod: PaymentMethod
}

export async function POST(request: NextRequest) {
  try {
    let body: CheckoutRequestBody
    try {
      body = await request.json()
    } catch (error) {
      throw new ValidationError('Invalid request body')
    }

    const { cart, customer, paymentMethod } = body

    // Validate payment method
    const validPaymentMethods: PaymentMethod[] = ['gcash', 'paymaya', 'card', 'bank_transfer']
    if (!paymentMethod || !validPaymentMethods.includes(paymentMethod)) {
      throw new ValidationError('Please select a valid payment method')
    }

    if (!cart || !Array.isArray(cart) || cart.length === 0) {
      throw new ValidationError('Cart is empty')
    }

    // Validate customer data
    if (!customer || !customer.name || !customer.phone || !customer.line1 || !customer.city || !customer.province || !customer.postalCode) {
      throw new ValidationError('Missing required customer information')
    }

    // Validate email format if provided
    if (customer.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer.email)) {
      throw new ValidationError('Invalid email format')
    }

    // Validate stock availability
    for (const item of cart) {
      const variant = await prisma.variant.findUnique({
        where: { id: item.variantId },
      })

      if (!variant) {
        return NextResponse.json({ error: `Variant not found: ${item.variantId}` }, { status: 400 })
      }

      if (variant.stockQuantity < item.quantity) {
        return NextResponse.json(
          { error: `Insufficient stock for ${item.productName}` },
          { status: 400 }
        )
      }
    }

    // Calculate totals
    const subtotal = cart.reduce((sum: number, item: CheckoutCartItem) => {
      const price = typeof item.price === 'string' ? parseFloat(item.price) : item.price
      return sum + price * item.quantity
    }, 0)
    const shippingFee = 100
    const grandTotal = subtotal + shippingFee

    // Create or find customer
    let customerRecord = null
    if (customer.email) {
      customerRecord = await prisma.customer.upsert({
        where: { email: customer.email },
        update: {
          name: customer.name,
          phone: customer.phone,
        },
        create: {
          email: customer.email,
          name: customer.name,
          phone: customer.phone,
        },
      })
    }

    // Create address
    const address = await prisma.address.create({
      data: {
        customerId: customerRecord?.id,
        fullName: customer.name,
        phone: customer.phone,
        line1: customer.line1,
        line2: customer.line2 || null,
        city: customer.city,
        province: customer.province,
        postalCode: customer.postalCode,
        country: 'Philippines',
      },
    })

    // Create order
    const orderNumber = generateOrderNumber()
    const order = await prisma.order.create({
      data: {
        orderNumber,
        customerId: customerRecord?.id || null,
        addressId: address.id,
        status: 'PENDING',
        paymentStatus: 'UNPAID',
        paymentProvider: 'PAYMONGO',
        subtotal,
        shippingFee,
        discountTotal: 0,
        grandTotal,
        items: {
          create: cart.map((item: CheckoutCartItem) => {
            const price = typeof item.price === 'string' ? parseFloat(item.price) : item.price
            return {
              productId: item.productId,
              variantId: item.variantId,
              quantity: item.quantity,
              unitPrice: price,
              totalPrice: price * item.quantity,
            }
          }),
        },
      },
    })

    // Queue order processing job for background worker
    try {
      await queueOrderJob(order.id)
      logger.info('Order processing job queued', { orderId: order.id })
    } catch (error) {
      // Log error but don't fail checkout if job queueing fails
      logger.error('Failed to queue order processing job', error, { orderId: order.id })
    }

    // Create PayMongo checkout session with selected payment method
    const baseUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'

    if (process.env.NODE_ENV === 'production' && (!baseUrl || baseUrl === 'http://localhost:3000')) {
      logger.warn('Using default localhost URL in production. Set NEXTAUTH_URL or NEXT_PUBLIC_URL.')
    }

    let checkoutSession
    try {
      logger.info('Creating PayMongo checkout session', {
        amount: Math.round(grandTotal * 100),
        orderNumber,
        paymentMethod,
        baseUrl,
      })

      checkoutSession = await createPayMongoCheckout({
        amount: Math.round(grandTotal * 100), // Convert to centavos
        description: `Yametee Order ${orderNumber}`,
        success_url: `${baseUrl}/order/${orderNumber}?status=success`,
        failed_url: `${baseUrl}/checkout?status=failed`,
        paymentMethod: paymentMethod as PaymentMethod,
      })

      logger.info('PayMongo checkout session created', {
        sessionId: checkoutSession?.data?.id,
        orderId: order.id,
      })

      if (!checkoutSession?.data?.attributes?.checkout_url) {
        throw new ExternalServiceError('PayMongo', 'Did not return a checkout URL')
      }
    } catch (error) {
      logger.error('PayMongo checkout session creation failed', error, {
        orderId: order.id,
        orderNumber,
        grandTotal,
      })
      
      // Update order status to indicate payment setup failed
      try {
        await prisma.order.update({
          where: { id: order.id },
          data: { status: 'CANCELLED' },
        })
      } catch (updateError) {
        logger.error('Failed to update order status after payment failure', updateError, { orderId: order.id })
      }
      
      if (error instanceof ExternalServiceError) {
        throw error
      }
      throw new ExternalServiceError('PayMongo', 'Failed to create payment session', error)
    }

    // Create payment record with payment method
    try {
      await prisma.payment.create({
        data: {
          orderId: order.id,
          provider: 'PAYMONGO',
          providerPaymentId: checkoutSession.data.id,
          amount: grandTotal,
          status: 'PENDING',
          rawPayload: {
            paymentMethod,
            checkoutSessionId: checkoutSession.data.id,
          } as Prisma.InputJsonValue,
        },
      })
    } catch (error) {
      logger.error('Failed to create payment record', error, { orderId: order.id })
      // Don't fail checkout if payment record creation fails, but log it
    }

    // Clear the cart after successful order creation
    try {
      const sessionId = await getCartSessionId()
      const cart = await getOrCreateCart(sessionId)

      // Delete all cart items
      await prisma.cartItem.deleteMany({
        where: { cartId: cart.id },
      })
    } catch (error) {
      // Log error but don't fail checkout if cart clearing fails
      logger.error('Failed to clear cart after checkout', error)
    }

    const checkoutUrl = checkoutSession.data.attributes.checkout_url

    if (!checkoutUrl) {
      logger.error('No checkout URL in PayMongo response', undefined, { checkoutSession })
      throw new ExternalServiceError('PayMongo', 'Failed to get payment checkout URL')
    }

    return NextResponse.json({
      orderNumber,
      checkoutUrl,
    })
  } catch (error) {
    logger.error('Checkout error', error)
    const errorResponse = formatErrorResponse(error)
    const statusCode = error instanceof ValidationError || error instanceof ExternalServiceError 
      ? error.statusCode 
      : 500
    
    return NextResponse.json(errorResponse, { status: statusCode })
  }
}
