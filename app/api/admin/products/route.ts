import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAdminSession } from '@/lib/server-admin-session'

export async function POST(request: NextRequest) {
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
      isFeatured = false,
      isDrop = false,
      isStandard = true,
    } = body

    // Check if slug already exists
    const existing = await prisma.product.findUnique({
      where: { slug },
    })

    if (existing) {
      return NextResponse.json({ error: 'Slug already exists' }, { status: 400 })
    }

    // Create product with variants and images
    const product = await prisma.product.create({
      data: {
        name,
        slug,
        description: description || '',
        status: status || 'DRAFT',
        isFeatured,
        isDrop,
        isStandard,
        images: {
          create: images.map((img: any, index: number) => ({
            imageUrl: img.imageUrl,
            color: img.color || null,
            isPrimary: img.isPrimary || index === 0,
            position: img.position || index,
          })),
        },
        variants: {
          create: variants.map((variant: any) => ({
            sku: variant.sku,
            size: variant.size,
            color: variant.color,
            price: parseFloat(variant.price),
            stockQuantity: parseInt(variant.stockQuantity) || 0,
          })),
        },
      },
    })

    return NextResponse.json({ product })
  } catch (error: any) {
    console.error('Create product error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create product' },
      { status: 500 }
    )
  }
}
