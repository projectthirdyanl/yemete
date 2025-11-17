import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCartSessionId, getOrCreateCart } from '@/lib/cart'

/**
 * DELETE /api/cart/[itemId]
 * Remove an item from the cart
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
) {
  try {
    const { itemId } = await params

    if (!itemId) {
      return NextResponse.json({ error: 'Item ID is required' }, { status: 400 })
    }

    const sessionId = await getCartSessionId()
    const cart = await getOrCreateCart(sessionId)

    // Verify the item belongs to this cart
    const cartItem = await prisma.cartItem.findUnique({
      where: { id: itemId },
    })

    if (!cartItem) {
      return NextResponse.json({ error: 'Cart item not found' }, { status: 404 })
    }

    if (cartItem.cartId !== cart.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Delete the item
    await prisma.cartItem.delete({
      where: { id: itemId },
    })

    // Return updated cart
    const updatedCart = await getOrCreateCart(sessionId)
    const cartItems = updatedCart.items.map(item => ({
      id: item.id,
      productId: item.productId,
      variantId: item.variantId,
      quantity: item.quantity,
      productName: item.product.name,
      size: item.variant.size,
      color: item.variant.color,
      price: parseFloat(item.variant.price.toString()),
      imageUrl: item.product.images[0]?.imageUrl || '',
      stockQuantity: item.variant.stockQuantity,
    }))

    return NextResponse.json({
      success: true,
      items: cartItems,
      itemCount: cartItems.reduce((sum, item) => sum + item.quantity, 0),
    })
  } catch (error) {
    console.error('Delete cart item error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to remove item from cart'
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
