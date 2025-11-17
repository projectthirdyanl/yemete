import { NextRequest, NextResponse } from 'next/server'
import { getCartSessionId, getOrCreateCart } from '@/lib/cart'

/**
 * GET /api/cart/count
 * Get the total item count in the cart (for header badge)
 */
export async function GET(request: NextRequest) {
  try {
    const sessionId = await getCartSessionId()
    const cart = await getOrCreateCart(sessionId)

    const itemCount = cart.items.reduce((sum, item) => sum + item.quantity, 0)

    return NextResponse.json({ count: itemCount })
  } catch (error) {
    console.error('Get cart count error:', error)
    return NextResponse.json({ count: 0 })
  }
}
