import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import AdminLayout from '@/components/AdminLayout'
import ProductForm from '@/components/ProductForm'

async function getProduct(id: string) {
  try {
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        images: {
          orderBy: [{ isPrimary: 'desc' }, { position: 'asc' }],
        },
        variants: true,
      },
    })
    return product
  } catch (error) {
    console.error('Error fetching product:', error)
    return null
  }
}

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const product = await getProduct(id)

  if (!product) {
    notFound()
  }

  // Transform product to match ProductForm's expected types (convert Decimal to string)
  const transformedProduct = {
    ...product,
    variants: product.variants.map(variant => ({
      ...variant,
      price: variant.price.toString(),
    })),
  }

  return (
    <AdminLayout>
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">Edit Product</h1>
      <ProductForm product={transformedProduct} />
    </AdminLayout>
  )
}
