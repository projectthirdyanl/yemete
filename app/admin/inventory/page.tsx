import AdminLayout from '@/components/AdminLayout'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import UpdateStockForm from '@/components/UpdateStockForm'

async function getInventory() {
  try {
    const variants = await prisma.variant.findMany({
      include: {
        product: {
          select: {
            name: true,
            slug: true,
            status: true,
            images: {
              where: { isPrimary: true },
              take: 1,
            },
          },
        },
        _count: {
          select: {
            orderItems: true,
          },
        },
      },
      orderBy: [{ stockQuantity: 'asc' }, { product: { name: 'asc' } }],
    })

    return variants
  } catch (error) {
    console.error('Error fetching inventory:', error)
    return []
  }
}

export default async function AdminInventoryPage() {
  const variants = await getInventory()

  const lowStock = variants.filter(v => v.stockQuantity < 10)
  const outOfStock = variants.filter(v => v.stockQuantity === 0)
  const totalValue = variants.reduce((sum, v) => sum + Number(v.price) * v.stockQuantity, 0)

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Inventory</h1>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white dark:bg-yametee-gray border border-gray-200 dark:border-gray-700 rounded-lg p-6">
            <p className="text-sm text-gray-600 dark:text-gray-400">Total Variants</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
              {variants.length}
            </p>
          </div>
          <div className="bg-white dark:bg-yametee-gray border border-gray-200 dark:border-gray-700 rounded-lg p-6">
            <p className="text-sm text-gray-600 dark:text-gray-400">Low Stock</p>
            <p className="text-2xl font-bold text-yametee-red mt-1">{lowStock.length}</p>
          </div>
          <div className="bg-white dark:bg-yametee-gray border border-gray-200 dark:border-gray-700 rounded-lg p-6">
            <p className="text-sm text-gray-600 dark:text-gray-400">Out of Stock</p>
            <p className="text-2xl font-bold text-red-600 dark:text-red-400 mt-1">
              {outOfStock.length}
            </p>
          </div>
          <div className="bg-white dark:bg-yametee-gray border border-gray-200 dark:border-gray-700 rounded-lg p-6">
            <p className="text-sm text-gray-600 dark:text-gray-400">Total Value</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
              {new Intl.NumberFormat('en-PH', {
                style: 'currency',
                currency: 'PHP',
              }).format(totalValue)}
            </p>
          </div>
        </div>

        {/* Inventory Table */}
        <div className="bg-white dark:bg-yametee-gray border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">All Products</h2>
          </div>
          {variants.length === 0 ? (
            <div className="p-8 text-center text-gray-600 dark:text-gray-400">
              No inventory items found
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-yametee-dark border-b border-gray-200 dark:border-gray-700">
                  <tr>
                    <th className="text-left p-4 text-gray-900 dark:text-white font-semibold">
                      Product
                    </th>
                    <th className="text-left p-4 text-gray-900 dark:text-white font-semibold">
                      SKU
                    </th>
                    <th className="text-left p-4 text-gray-900 dark:text-white font-semibold">
                      Size
                    </th>
                    <th className="text-left p-4 text-gray-900 dark:text-white font-semibold">
                      Color
                    </th>
                    <th className="text-left p-4 text-gray-900 dark:text-white font-semibold">
                      Price
                    </th>
                    <th className="text-left p-4 text-gray-900 dark:text-white font-semibold">
                      Stock
                    </th>
                    <th className="text-left p-4 text-gray-900 dark:text-white font-semibold">
                      Sold
                    </th>
                    <th className="text-left p-4 text-gray-900 dark:text-white font-semibold">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {variants.map(variant => {
                    // Convert Prisma Decimal to number for client component
                    const safeVariant = {
                      id: variant.id,
                      stockQuantity: variant.stockQuantity,
                    }

                    return (
                      <tr
                        key={variant.id}
                        className={`border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-yametee-dark/50 transition-colors ${
                          variant.stockQuantity === 0
                            ? 'bg-red-50 dark:bg-red-900/10'
                            : variant.stockQuantity < 10
                              ? 'bg-yellow-50 dark:bg-yellow-900/10'
                              : ''
                        }`}
                      >
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            {variant.product.images[0] && (
                              <img
                                src={variant.product.images[0].imageUrl}
                                alt={variant.product.name}
                                className="w-12 h-12 object-cover rounded"
                              />
                            )}
                            <div>
                              <Link
                                href={`/admin/products/${variant.productId}`}
                                className="font-medium text-gray-900 dark:text-white hover:text-yametee-red"
                              >
                                {variant.product.name}
                              </Link>
                              <span
                                className={`ml-2 px-2 py-0.5 rounded text-xs ${
                                  variant.product.status === 'ACTIVE'
                                    ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-400'
                                }`}
                              >
                                {variant.product.status}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 text-gray-900 dark:text-white font-mono text-sm">
                          {variant.sku}
                        </td>
                        <td className="p-4 text-gray-900 dark:text-white">{variant.size}</td>
                        <td className="p-4 text-gray-900 dark:text-white">{variant.color}</td>
                        <td className="p-4 text-gray-900 dark:text-white">
                          {new Intl.NumberFormat('en-PH', {
                            style: 'currency',
                            currency: 'PHP',
                          }).format(Number(variant.price))}
                        </td>
                        <td className="p-4">
                          <span
                            className={`font-semibold ${
                              variant.stockQuantity === 0
                                ? 'text-red-600 dark:text-red-400'
                                : variant.stockQuantity < 10
                                  ? 'text-yellow-600 dark:text-yellow-400'
                                  : 'text-gray-900 dark:text-white'
                            }`}
                          >
                            {variant.stockQuantity}
                          </span>
                        </td>
                        <td className="p-4 text-gray-600 dark:text-gray-400">
                          {variant._count.orderItems}
                        </td>
                        <td className="p-4">
                          <UpdateStockForm variant={safeVariant} />
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  )
}
