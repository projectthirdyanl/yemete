import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAdminSession } from '@/lib/server-admin-session'
import type {
  ApiResponse,
  CreateProductRequest,
  ProductResponse,
  ProductImageInput,
  VariantInput,
} from '@yametee/types'

export async function POST(request: NextRequest) {
  try {
    const session = await getAdminSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body: CreateProductRequest = await request.json()
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
      const errorResponse: ApiResponse<null> = {
        success: false,
        error: 'Slug already exists',
      }
      return NextResponse.json(errorResponse, { status: 400 })
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
          create: images.map((img: ProductImageInput, index: number) => ({
            imageUrl: img.imageUrl,
            color: img.color || null,
            isPrimary: img.isPrimary || index === 0,
            position: img.position || index,
          })),
        },
        variants: {
          create: variants.map((variant: VariantInput) => ({
            sku: variant.sku,
            size: variant.size,
            color: variant.color,
            price: typeof variant.price === 'string' ? parseFloat(variant.price) : variant.price,
            stockQuantity: variant.stockQuantity,
          })),
        },
      },
    })

    // Transform Prisma product to API response format
    const productResponse: ProductResponse = {
      id: product.id,
      slug: product.slug,
      name: product.name,
      description: product.description,
      brand: product.brand,
      status: product.status,
      isFeatured: product.isFeatured,
      isDrop: product.isDrop,
      isStandard: product.isStandard,
      createdAt: product.createdAt.toISOString(),
      updatedAt: product.updatedAt.toISOString(),
      images: [],
      variants: [],
    }

    const apiResponse: ApiResponse<ProductResponse> = {
      success: true,
      data: productResponse,
      message: 'Product created successfully',
    }

    return NextResponse.json(apiResponse)
  } catch (error) {
    console.error('Create product error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to create product'
    const errorResponse: ApiResponse<null> = {
      success: false,
      error: errorMessage,
    }
    return NextResponse.json(errorResponse, { status: 500 })
  }
}
