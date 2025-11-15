import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAdminSession } from '@/lib/server-admin-session'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getAdminSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if product exists
    const product = await prisma.product.findUnique({
      where: { id: params.id },
      include: {
        orderItems: {
          include: {
            order: {
              select: {
                status: true,
              },
            },
          },
        },
      },
    })

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    // Check if product has non-cancelled orders
    const activeOrders = product.orderItems.filter(
      (item) => item.order.status !== 'CANCELLED'
    )

    if (activeOrders.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete product with active orders. Please cancel or complete orders first.' },
        { status: 400 }
      )
    }

    // Get order items from cancelled orders that reference this product
    const cancelledOrderItems = product.orderItems.filter(
      (item) => item.order.status === 'CANCELLED'
    )

    // Delete order items from cancelled orders first to remove foreign key constraints
    if (cancelledOrderItems.length > 0) {
      await prisma.orderItem.deleteMany({
        where: {
          id: {
            in: cancelledOrderItems.map((item) => item.id),
          },
        },
      })
    }

    // Now delete the product (cascades to images and variants)
    await prisma.product.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Delete product error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to delete product' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getAdminSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      name,
      slug,
      description,
      status,
      images = [],
      variants = [],
      isFeatured,
      isDrop,
      isStandard,
    } = body

    // Check if product exists
    const existing = await prisma.product.findUnique({
      where: { id: params.id },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    // Check if slug is taken by another product
    if (slug !== existing.slug) {
      const slugExists = await prisma.product.findUnique({
        where: { slug },
      })
      if (slugExists) {
        return NextResponse.json({ error: 'Slug already exists' }, { status: 400 })
      }
    }

    // Update product
    const featuredValue = typeof isFeatured === 'boolean' ? isFeatured : existing.isFeatured
    const dropValue = typeof isDrop === 'boolean' ? isDrop : existing.isDrop
    const standardValue =
      typeof isStandard === 'boolean'
        ? isStandard
        : existing.isStandard !== undefined
        ? existing.isStandard
        : true

    await prisma.product.update({
      where: { id: params.id },
      data: {
        name,
        slug,
        description: description || '',
        status: status || 'DRAFT',
        isFeatured: featuredValue,
        isDrop: dropValue,
        isStandard: standardValue,
      },
    })

    // Get existing variants to check which ones are used in orders
    const existingVariants = await prisma.variant.findMany({
      where: { productId: params.id },
      include: {
        orderItems: {
          include: {
            order: {
              select: {
                status: true,
              },
            },
          },
        },
      },
    })

    // Create a map of existing variants by size-color combination
    const existingVariantMap = new Map<string, typeof existingVariants[0]>()
    existingVariants.forEach((v) => {
      const key = `${v.size}-${v.color}`
      existingVariantMap.set(key, v)
    })

    // Create a map of new variants by size-color combination
    const newVariantMap = new Map<string, any>()
    variants.forEach((v: any) => {
      const key = `${v.size}-${v.color}`
      newVariantMap.set(key, v)
    })

    // Update or create variants
    for (const variant of variants) {
      const key = `${variant.size}-${variant.color}`
      const existingVariant = existingVariantMap.get(key)

      if (existingVariant) {
        // Update existing variant (preserve ID for foreign key relationships)
        await prisma.variant.update({
          where: { id: existingVariant.id },
          data: {
            sku: variant.sku,
            price: parseFloat(variant.price),
            stockQuantity: parseInt(variant.stockQuantity) || 0,
            // Note: We don't update size/color as they're part of the unique constraint
          },
        })
      } else {
        // Create new variant
        await prisma.variant.create({
          data: {
            productId: params.id,
            sku: variant.sku,
            size: variant.size,
            color: variant.color,
            price: parseFloat(variant.price),
            stockQuantity: parseInt(variant.stockQuantity) || 0,
          },
        })
      }
    }

    // Delete variants that are no longer needed (only if not used in active orders)
    for (const existingVariant of existingVariants) {
      const key = `${existingVariant.size}-${existingVariant.color}`
      // Check if variant is used in non-cancelled orders
      const activeOrderItems = existingVariant.orderItems.filter(
        (item) => item.order.status !== 'CANCELLED'
      )
      
      if (!newVariantMap.has(key) && activeOrderItems.length === 0) {
        // Only delete if not referenced by any active orders
        await prisma.variant.delete({
          where: { id: existingVariant.id },
        })
      }
    }

    // Handle images - delete and recreate (images don't have foreign key constraints)
    await prisma.productImage.deleteMany({
      where: { productId: params.id },
    })

    await prisma.productImage.createMany({
      data: images.map((img: any, index: number) => ({
        productId: params.id,
        imageUrl: img.imageUrl,
        color: img.color || null,
        isPrimary: img.isPrimary || index === 0,
        position: img.position || index,
      })),
    })

    const product = await prisma.product.findUnique({
      where: { id: params.id },
      include: {
        images: true,
        variants: true,
      },
    })

    return NextResponse.json({ product })
  } catch (error: any) {
    console.error('Update product error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update product' },
      { status: 500 }
    )
  }
}
