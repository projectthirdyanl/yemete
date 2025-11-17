import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'
import { generateOrderNumber } from '@/lib/utils'
import { createPayMongoCheckout, PaymentMethod } from '@/lib/paymongo'
import { getCartSessionId, getOrCreateCart } from '@/lib/cart'
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
    const body: CheckoutRequestBody = await request.json()
    const { cart, customer, paymentMethod } = body

    // Validate payment method
    const validPaymentMethods: PaymentMethod[] = ['gcash', 'paymaya', 'card', 'bank_transfer']
    if (!paymentMethod || !validPaymentMethods.includes(paymentMethod)) {
      return NextResponse.json({ error: 'Please select a valid payment method' }, { status: 400 })
    }

    if (!cart || cart.length === 0) {
      return NextResponse.json({ error: 'Cart is empty' }, { status: 400 })
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

    // Create PayMongo checkout session with selected payment method
    const baseUrl =
      process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'

    if (!baseUrl || baseUrl === 'http://localhost:3000') {
      console.warn(
        'Warning: Using default localhost URL. Set NEXTAUTH_URL or NEXT_PUBLIC_URL for production.'
      )
    }

    let checkoutSession
    try {
      console.log('Creating PayMongo checkout session:', {
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
        // Note: PayMongo checkout sessions don't support metadata directly
        // We store order info in the payment record instead
      })

      console.log('PayMongo checkout session created:', {
        sessionId: checkoutSession?.data?.id,
        hasCheckoutUrl: !!checkoutSession?.data?.attributes?.checkout_url,
      })

      if (!checkoutSession?.data?.attributes?.checkout_url) {
        throw new Error('PayMongo did not return a checkout URL')
      }
    } catch (error) {
      console.error('PayMongo checkout session creation failed:', {
        error: error instanceof Error ? error.message : String(error),
        orderId: order.id,
        orderNumber,
        grandTotal,
      })
      // Update order status to indicate payment setup failed - use CANCELLED since FAILED doesn't exist
      try {
        await prisma.order.update({
          where: { id: order.id },
          data: { status: 'CANCELLED' },
        })
      } catch (updateError) {
        console.error('Failed to update order status:', updateError)
      }
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      throw new Error(`Failed to create payment session: ${errorMessage}`)
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
      console.error('Failed to create payment record:', error)
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
      console.error('Failed to clear cart after checkout:', error)
    }

    const checkoutUrl = checkoutSession.data.attributes.checkout_url

    if (!checkoutUrl) {
      console.error('No checkout URL in PayMongo response:', checkoutSession)
      return NextResponse.json(
        { error: 'Failed to get payment checkout URL. Please try again or contact support.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      orderNumber,
      checkoutUrl,
    })
  } catch (error) {
    console.error('Checkout error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Checkout failed'
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
