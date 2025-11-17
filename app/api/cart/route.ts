import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCartSessionId, getOrCreateCart } from '@/lib/cart'
import type {
  ApiResponse,
  CartResponse,
  AddToCartRequest,
  UpdateCartItemRequest,
  CartItemResponse,
} from '@yametee/types'

/**
 * GET /api/cart
 * Get the current user's cart items
 */
export async function GET(request: NextRequest) {
  try {
    const sessionId = await getCartSessionId()

    // For now, we only support guest carts (session-based)
    // In the future, we can add customerId from auth token
    const cart = await getOrCreateCart(sessionId)

    const cartItems = cart.items.map(item => ({
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

    const responseData: CartResponse = {
      items: cartItems,
      itemCount: cartItems.reduce((sum, item) => sum + item.quantity, 0),
    }

    const apiResponse: ApiResponse<CartResponse> = {
      success: true,
      data: responseData,
    }

    return NextResponse.json(apiResponse)
  } catch (error) {
    console.error('Get cart error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to get cart'
    const errorResponse: ApiResponse<null> = {
      success: false,
      error: errorMessage,
    }
    return NextResponse.json(errorResponse, { status: 500 })
  }
}

/**
 * POST /api/cart
 * Add an item to the cart
 */
export async function POST(request: NextRequest) {
  try {
    const body: AddToCartRequest = await request.json()
    const { variantId, quantity } = body

    if (!variantId || !quantity || quantity <= 0) {
      return NextResponse.json(
        { error: 'Variant ID and valid quantity are required' },
        { status: 400 }
      )
    }

    // Validate variant exists and has stock
    const variant = await prisma.variant.findUnique({
      where: { id: variantId },
      include: {
        product: {
          include: {
            images: {
              orderBy: [{ isPrimary: 'desc' }, { position: 'asc' }],
              take: 1,
            },
          },
        },
      },
    })

    if (!variant) {
      return NextResponse.json({ error: 'Variant not found' }, { status: 404 })
    }

    if (variant.stockQuantity < quantity) {
      return NextResponse.json(
        { error: `Insufficient stock. Only ${variant.stockQuantity} available.` },
        { status: 400 }
      )
    }

    const sessionId = await getCartSessionId()
    const cart = await getOrCreateCart(sessionId)

    // Check if item already exists in cart
    const existingItem = await prisma.cartItem.findUnique({
      where: {
        cartId_variantId: {
          cartId: cart.id,
          variantId: variantId,
        },
      },
    })

    if (existingItem) {
      // Update quantity
      const newQuantity = existingItem.quantity + quantity

      // Check stock again with new quantity
      if (variant.stockQuantity < newQuantity) {
        return NextResponse.json(
          { error: `Insufficient stock. Only ${variant.stockQuantity} available.` },
          { status: 400 }
        )
      }

      await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: newQuantity },
      })
    } else {
      // Create new cart item
      await prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId: variant.productId,
          variantId: variantId,
          quantity: quantity,
        },
      })
    }

    // Return updated cart
    const updatedCart = await getOrCreateCart(sessionId)
    const cartItems: CartItemResponse[] = updatedCart.items.map(item => ({
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

    const responseData: CartResponse = {
      items: cartItems,
      itemCount: cartItems.reduce((sum, item) => sum + item.quantity, 0),
    }

    const apiResponse: ApiResponse<CartResponse> = {
      success: true,
      data: responseData,
    }

    return NextResponse.json(apiResponse)
  } catch (error) {
    console.error('Add to cart error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to add to cart'
    const errorResponse: ApiResponse<null> = {
      success: false,
      error: errorMessage,
    }
    return NextResponse.json(errorResponse, { status: 500 })
  }
}

/**
 * PUT /api/cart
 * Update cart item quantity
 */
export async function PUT(request: NextRequest) {
  try {
    const body: UpdateCartItemRequest = await request.json()
    const { itemId, quantity } = body

    if (!itemId || quantity === undefined) {
      return NextResponse.json({ error: 'Item ID and quantity are required' }, { status: 400 })
    }

    if (quantity <= 0) {
      // Remove item if quantity is 0 or less
      await prisma.cartItem.delete({
        where: { id: itemId },
      })

      const sessionId = await getCartSessionId()
      const cart = await getOrCreateCart(sessionId)
      const cartItems = cart.items.map(item => ({
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

      const responseData: CartResponse = {
        items: cartItems,
        itemCount: cartItems.reduce((sum, item) => sum + item.quantity, 0),
      }

      const apiResponse: ApiResponse<CartResponse> = {
        success: true,
        data: responseData,
      }

      return NextResponse.json(apiResponse)
    }

    // Get cart item to check stock
    const cartItem = await prisma.cartItem.findUnique({
      where: { id: itemId },
      include: { variant: true },
    })

    if (!cartItem) {
      return NextResponse.json({ error: 'Cart item not found' }, { status: 404 })
    }

    // Check stock availability
    if (cartItem.variant.stockQuantity < quantity) {
      return NextResponse.json(
        { error: `Insufficient stock. Only ${cartItem.variant.stockQuantity} available.` },
        { status: 400 }
      )
    }

    // Update quantity
    await prisma.cartItem.update({
      where: { id: itemId },
      data: { quantity },
    })

    // Return updated cart
    const sessionId = await getCartSessionId()
    const cart = await getOrCreateCart(sessionId)
    const cartItems = cart.items.map(item => ({
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

    const responseData: CartResponse = {
      items: cartItems,
      itemCount: cartItems.reduce((sum, item) => sum + item.quantity, 0),
    }

    const apiResponse: ApiResponse<CartResponse> = {
      success: true,
      data: responseData,
    }

    return NextResponse.json(apiResponse)
  } catch (error) {
    console.error('Update cart error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to update cart'
    const errorResponse: ApiResponse<null> = {
      success: false,
      error: errorMessage,
    }
    return NextResponse.json(errorResponse, { status: 500 })
  }
}
