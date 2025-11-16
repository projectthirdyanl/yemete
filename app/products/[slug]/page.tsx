import { notFound } from 'next/navigation'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { prisma } from '@/lib/prisma'
import { formatPrice } from '@/lib/utils'
import ProductDetailClient from '@/components/ProductDetailClient'

async function getProduct(slug: string) {
  try {
    const product = await prisma.product.findUnique({
      where: { slug },
      include: {
        images: {
          orderBy: [{ isPrimary: 'desc' }, { position: 'asc' }],
        },
        variants: {
          orderBy: [{ size: 'asc' }, { color: 'asc' }],
        },
      },
    })
    return product
  } catch (error) {
    console.error('Error fetching product:', error)
    return null
  }
}

export default async function ProductPage({ params }: { params: { slug: string } }) {
  const product = await getProduct(params.slug)

  if (!product) {
    notFound()
  }

  const safeProduct = {
    id: product.id,
    name: product.name,
    description: product.description,
    brand: product.brand,
    images: product.images.map((image) => ({
      id: image.id,
      imageUrl: image.imageUrl,
      color: image.color,
      isPrimary: image.isPrimary,
    })),
    variants: product.variants.map((variant) => ({
      id: variant.id,
      size: variant.size,
      color: variant.color,
      price: Number(variant.price),
      stockQuantity: variant.stockQuantity,
      sku: variant.sku,
    })),
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 py-12 px-4">
        <div className="container mx-auto">
          <ProductDetailClient product={safeProduct} />
        </div>
      </main>

      <Footer />
    </div>
  )
}
