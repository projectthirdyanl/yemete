import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import AdminLayout from '@/components/AdminLayout'
import DeleteProductButton from '@/components/DeleteProductButton'

export const dynamic = 'force-dynamic'

async function getProducts() {
  try {
    const products = await prisma.product.findMany({
      include: {
        images: {
          where: { isPrimary: true },
          take: 1,
        },
        variants: {
          select: {
            stockQuantity: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })
    return products
  } catch (error) {
    console.error('Error fetching products:', error)
    return []
  }
}

function buildPlacementSections(products: Awaited<ReturnType<typeof getProducts>>) {
  return [
    {
      key: 'featured',
      label: 'Featured Grid',
      accent: 'from-[#ff3b30]/10 via-transparent to-transparent',
      description: 'Appears in the homepage hero grid.',
      products: products.filter(product => product.isFeatured),
    },
    {
      key: 'drops',
      label: 'Drops',
      accent: 'from-[#ff8800]/10 via-transparent to-transparent',
      description: 'Limited releases with countdowns and announcements.',
      products: products.filter(product => product.isDrop),
    },
    {
      key: 'standard',
      label: 'Shop Tees',
      accent: 'from-[#00c2ff]/10 via-transparent to-transparent',
      description: 'Staple silhouettes that live in the main catalog.',
      products: products.filter(product => product.isStandard),
    },
  ]
}

export default async function AdminProductsPage() {
  const products = await getProducts()
  const placementSections = buildPlacementSections(products)

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Products</h1>
        <Link
          href="/admin/products/new"
          className="bg-yametee-red text-white px-6 py-2 rounded-lg font-semibold hover:bg-yametee-red/90 transition-all"
        >
          Add Product
        </Link>
      </div>

      <div className="bg-white dark:bg-yametee-gray border border-gray-200 dark:border-gray-700 rounded-2xl p-6 mb-8 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-gray-500 dark:text-gray-400">
              Storefront Sync
            </p>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
              Placement Highlights
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Keep the homepage tiles, drops page, and staple program in sync with these quick
              counts.
            </p>
          </div>
          <Link
            href="/admin/products/new"
            className="inline-flex items-center gap-2 rounded-full border border-yametee-red px-4 py-2 text-xs uppercase tracking-[0.3em] text-yametee-red hover:bg-yametee-red/10 transition-colors"
          >
            New Product →
          </Link>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {placementSections.map(section => (
            <div
              key={section.key}
              className="rounded-2xl border border-gray-200 dark:border-gray-700 p-4 bg-gradient-to-br dark:from-yametee-gray/60 dark:to-yametee-gray/20 from-white to-white shadow-[0_12px_45px_rgba(0,0,0,0.04)] dark:shadow-none"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-gray-500 dark:text-gray-400">
                    {section.label}
                  </p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">
                    {section.products.length}
                  </p>
                </div>
                <span className="text-xs uppercase tracking-[0.3em] text-yametee-red">Live</span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">{section.description}</p>
              {section.products.length === 0 ? (
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-4">
                  No products tagged yet — toggle placement in the product form.
                </p>
              ) : (
                <div className="mt-4 space-y-2">
                  {section.products.slice(0, 3).map(product => (
                    <Link
                      key={product.id}
                      href={`/admin/products/${product.id}`}
                      className="flex items-center justify-between rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white hover:border-yametee-red/60"
                    >
                      <span className="truncate">{product.name}</span>
                      <span className="text-xs uppercase tracking-[0.2em] text-yametee-red">
                        Edit
                      </span>
                    </Link>
                  ))}
                  {section.products.length > 3 && (
                    <p className="text-xs text-gray-500 dark:text-gray-500">
                      +{section.products.length - 3} more in this placement
                    </p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {products.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-gray-600 dark:text-gray-400 text-xl mb-6">No products yet.</p>
          <Link
            href="/admin/products/new"
            className="inline-block bg-yametee-red text-white px-6 py-3 rounded-lg font-semibold hover:bg-yametee-red/90 transition-all"
          >
            Create Your First Product
          </Link>
        </div>
      ) : (
        <div className="bg-white dark:bg-yametee-gray border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden shadow-sm">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-yametee-dark border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="text-left p-4 text-gray-900 dark:text-white font-semibold">
                  Product
                </th>
                <th className="text-left p-4 text-gray-900 dark:text-white font-semibold">
                  Status
                </th>
                <th className="text-left p-4 text-gray-900 dark:text-white font-semibold">
                  Placement
                </th>
                <th className="text-left p-4 text-gray-900 dark:text-white font-semibold">Stock</th>
                <th className="text-left p-4 text-gray-900 dark:text-white font-semibold">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {products.map(product => {
                const totalStock = product.variants.reduce((sum, v) => sum + v.stockQuantity, 0)
                const image = product.images[0]

                return (
                  <tr
                    key={product.id}
                    className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-yametee-dark/50 transition-colors"
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-4">
                        {image && (
                          <img
                            src={image.imageUrl}
                            alt={product.name}
                            className="w-16 h-16 object-cover rounded-lg"
                          />
                        )}
                        <div>
                          <p className="text-gray-900 dark:text-white font-semibold">
                            {product.name}
                          </p>
                          <p className="text-gray-600 dark:text-gray-400 text-sm">{product.slug}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-semibold ${
                          product.status === 'ACTIVE'
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                            : product.status === 'DRAFT'
                              ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
                              : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-400'
                        }`}
                      >
                        {product.status}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-wrap gap-2">
                        {[
                          product.isFeatured && {
                            label: 'Featured',
                            className: 'bg-yametee-red/10 text-yametee-red',
                          },
                          product.isDrop && {
                            label: 'Drops',
                            className:
                              'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300',
                          },
                          product.isStandard && {
                            label: 'Shop Tees',
                            className:
                              'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
                          },
                        ]
                          .filter((badge): badge is { label: string; className: string } =>
                            Boolean(badge)
                          )
                          .map(badge => (
                            <span
                              key={badge.label}
                              className={`px-3 py-1 rounded-full text-xs font-semibold ${badge.className}`}
                            >
                              {badge.label}
                            </span>
                          ))}
                        {!product.isFeatured && !product.isDrop && !product.isStandard && (
                          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                            Unassigned
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-4 text-gray-900 dark:text-white">{totalStock} units</td>
                    <td className="p-4">
                      <div className="flex items-center gap-4">
                        <Link
                          href={`/admin/products/${product.id}`}
                          className="text-yametee-red hover:text-yametee-red/80 transition-colors"
                        >
                          Edit
                        </Link>
                        <DeleteProductButton productId={product.id} productName={product.name} />
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </AdminLayout>
  )
}
