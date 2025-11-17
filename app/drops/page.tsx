import Link from 'next/link'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { prisma } from '@/lib/prisma'
import { formatPrice } from '@/lib/utils'

async function getDropProducts() {
  try {
    const products = await prisma.product.findMany({
      where: { status: 'ACTIVE', isDrop: true },
      include: {
        images: {
          orderBy: [{ isPrimary: 'desc' }, { position: 'asc' }],
          take: 2,
        },
        variants: {
          orderBy: { price: 'asc' },
          take: 1,
        },
      },
      orderBy: { createdAt: 'desc' },
    })
    return products
  } catch (error) {
    console.error('Error fetching drop products:', error)
    return []
  }
}

export default async function DropsPage() {
  const products = await getDropProducts()

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 py-12 px-4">
        <div className="container mx-auto">
          <div className="max-w-3xl mb-12">
            <p className="text-xs uppercase tracking-[0.3em] text-gray-500 dark:text-gray-400">
              Limited Releases
            </p>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mt-4">
              Drops
            </h1>
            <p className="text-base md:text-lg text-gray-700 dark:text-gray-300 mt-4">
              Fresh artwork, small batches, zero restocks. When it&apos;s gone, it&apos;s gone. Tap
              in before the drop sells out.
            </p>
          </div>

          {products.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-gray-600 dark:text-gray-400 text-xl mb-3">
                No drops available right now.
              </p>
              <p className="text-gray-500 dark:text-gray-500">
                Follow us on TikTok @yametee for the next release announcement.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {products.map(product => {
                const variant = product.variants?.[0]
                const primaryImage = product.images?.[0]
                const secondaryImage = product.images?.[1]

                if (!variant) return null

                return (
                  <Link
                    key={product.id}
                    href={`/products/${product.slug}`}
                    className="group bg-white dark:bg-yametee-gray border border-gray-200 dark:border-yametee-lightGray/30 rounded-xl overflow-hidden hover:border-yametee-red/60 transition-all hover:scale-105 shadow-lg hover:shadow-yametee-red/20"
                  >
                    {primaryImage ? (
                      <div className="aspect-square relative overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 dark:from-yametee-gray dark:to-yametee-dark">
                        <img
                          src={primaryImage.imageUrl}
                          alt={`${product.name} front`}
                          className={`absolute inset-0 w-full h-full object-cover transition-all duration-300 ${secondaryImage ? 'opacity-100 group-hover:opacity-0' : 'opacity-100'} group-hover:scale-105`}
                        />
                        {secondaryImage && (
                          <img
                            src={secondaryImage.imageUrl}
                            alt={`${product.name} back`}
                            className="absolute inset-0 w-full h-full object-cover opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:scale-105"
                          />
                        )}
                      </div>
                    ) : (
                      <div className="aspect-square bg-gradient-to-br from-gray-100 to-gray-200 dark:from-yametee-gray dark:to-yametee-dark flex items-center justify-center">
                        <span className="text-gray-400">No Image</span>
                      </div>
                    )}
                    <div className="p-4 bg-white dark:bg-yametee-gray">
                      <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-yametee-red mb-2">
                        <span>Drop</span>
                        <span className="text-gray-400 dark:text-gray-500">•</span>
                        <span>Limited</span>
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 group-hover:text-yametee-red transition-colors line-clamp-2">
                        {product.name}
                      </h3>
                      {variant && (
                        <div className="flex items-baseline gap-2">
                          <p className="text-yametee-red text-xl font-bold">
                            {formatPrice(variant.price.toString())}
                          </p>
                          <p className="text-gray-400 text-sm uppercase tracking-wide">
                            Limited Qty
                          </p>
                        </div>
                      )}
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}
