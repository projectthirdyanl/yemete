import AdminLayout from '@/components/AdminLayout'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

async function getStats() {
  try {
    const totalSales = await prisma.order.aggregate({
      where: { status: 'COMPLETED' },
      _sum: { grandTotal: true },
    })

    const totalOrders = await prisma.order.count()
    const pendingOrders = await prisma.order.count({ where: { status: 'PENDING' } })

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todaySales = await prisma.order.aggregate({
      where: { status: 'COMPLETED', createdAt: { gte: today } },
      _sum: { grandTotal: true },
    })

    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)
    const monthSales = await prisma.order.aggregate({
      where: { status: 'COMPLETED', createdAt: { gte: startOfMonth } },
      _sum: { grandTotal: true },
    })

    const [
      totalCustomers,
      lowStockProducts,
      featuredProducts,
      dropProducts,
      standardProducts,
      draftProducts,
    ] = await Promise.all([
      prisma.customer.count(),
      prisma.variant.count({ where: { stockQuantity: { lt: 10 } } }),
      prisma.product.count({ where: { isFeatured: true, status: 'ACTIVE' } }),
      prisma.product.count({ where: { isDrop: true, status: 'ACTIVE' } }),
      prisma.product.count({ where: { isStandard: true, status: 'ACTIVE' } }),
      prisma.product.count({ where: { status: 'DRAFT' } }),
    ])

    const recentOrders = await prisma.order.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        customer: { select: { name: true, email: true } },
        items: {
          include: {
            product: { select: { name: true } },
            variant: { select: { size: true, color: true } },
          },
        },
      },
    })

    return {
      totalSales: Number(totalSales._sum.grandTotal || 0),
      totalOrders,
      pendingOrders,
      todaySales: Number(todaySales._sum.grandTotal || 0),
      monthSales: Number(monthSales._sum.grandTotal || 0),
      totalCustomers,
      lowStockProducts,
      productPlacements: {
        featured: featuredProducts,
        drops: dropProducts,
        standard: standardProducts,
        drafts: draftProducts,
      },
      recentOrders,
    }
  } catch (error) {
    console.error('Error fetching stats:', error)
    return {
      totalSales: 0,
      totalOrders: 0,
      pendingOrders: 0,
      todaySales: 0,
      monthSales: 0,
      totalCustomers: 0,
      lowStockProducts: 0,
      productPlacements: {
        featured: 0,
        drops: 0,
        standard: 0,
        drafts: 0,
      },
      recentOrders: [],
    }
  }
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
  }).format(amount)
}

export default async function AdminDashboard() {
  const stats = await getStats()

  return (
    <AdminLayout>
      <div className="space-y-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white dark:bg-yametee-gray border border-gray-200 dark:border-gray-700 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Sales</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {formatCurrency(stats.totalSales)}
                </p>
              </div>
              <div className="text-3xl">💰</div>
            </div>
          </div>

          <div className="bg-white dark:bg-yametee-gray border border-gray-200 dark:border-gray-700 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Orders</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {stats.totalOrders}
                </p>
              </div>
              <div className="text-3xl">📦</div>
            </div>
          </div>

          <div className="bg-white dark:bg-yametee-gray border border-gray-200 dark:border-gray-700 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Pending Orders</p>
                <p className="text-2xl font-bold text-yametee-red mt-1">{stats.pendingOrders}</p>
              </div>
              <div className="text-3xl">⏳</div>
            </div>
          </div>

          <div className="bg-white dark:bg-yametee-gray border border-gray-200 dark:border-gray-700 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Customers</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {stats.totalCustomers}
                </p>
              </div>
              <div className="text-3xl">👥</div>
            </div>
          </div>
        </div>

        {/* Additional Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-yametee-gray border border-gray-200 dark:border-gray-700 rounded-lg p-6">
            <p className="text-sm text-gray-600 dark:text-gray-400">Today&apos;s Sales</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
              {formatCurrency(stats.todaySales)}
            </p>
          </div>

          <div className="bg-white dark:bg-yametee-gray border border-gray-200 dark:border-gray-700 rounded-lg p-6">
            <p className="text-sm text-gray-600 dark:text-gray-400">This Month&apos;s Sales</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
              {formatCurrency(stats.monthSales)}
            </p>
          </div>

          <div className="bg-white dark:bg-yametee-gray border border-gray-200 dark:border-gray-700 rounded-lg p-6">
            <p className="text-sm text-gray-600 dark:text-gray-400">Low Stock Items</p>
            <p className="text-2xl font-bold text-yametee-red mt-1">{stats.lowStockProducts}</p>
          </div>
        </div>

        {/* Placement Overview */}
        <div className="bg-white dark:bg-yametee-gray border border-gray-200 dark:border-gray-700 rounded-2xl p-6 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.4em] text-gray-500 dark:text-gray-400">
                Storefront
              </p>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                Placement Overview
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Align drops, featured picks, and staple tees with the refreshed storefront sections.
              </p>
            </div>
            <a
              href="/admin/products"
              className="inline-flex items-center gap-2 rounded-full border border-yametee-red px-4 py-2 text-xs uppercase tracking-[0.3em] text-yametee-red hover:bg-yametee-red/10 transition-colors"
            >
              Manage Products →
            </a>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[
              {
                label: 'Featured Grid',
                value: stats.productPlacements.featured,
                badge: 'Homepage hero',
                description: 'Highlight key drops and hero tees above the fold.',
              },
              {
                label: 'Drops',
                value: stats.productPlacements.drops,
                badge: 'Limited releases',
                description: 'Products flagged for the Drops page and announcements.',
              },
              {
                label: 'Shop Tees',
                value: stats.productPlacements.standard,
                badge: 'Evergreen',
                description: 'Staple silhouettes in the main catalog.',
              },
              {
                label: 'Drafts',
                value: stats.productPlacements.drafts,
                badge: 'Work in progress',
                description: 'Products still hidden or awaiting approval.',
              },
            ].map(placement => (
              <div
                key={placement.label}
                className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-yametee-dark/40 p-4"
              >
                <p className="text-xs uppercase tracking-[0.3em] text-yametee-red mb-1">
                  {placement.badge}
                </p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {placement.value}
                </p>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                  {placement.label}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {placement.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Orders */}
        <div className="bg-white dark:bg-yametee-gray border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Recent Orders</h2>
          </div>
          {stats.recentOrders.length === 0 ? (
            <div className="p-6 text-center text-gray-600 dark:text-gray-400">No orders yet</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-yametee-dark border-b border-gray-200 dark:border-gray-700">
                  <tr>
                    <th className="text-left p-4 text-gray-900 dark:text-white font-semibold">
                      Order #
                    </th>
                    <th className="text-left p-4 text-gray-900 dark:text-white font-semibold">
                      Customer
                    </th>
                    <th className="text-left p-4 text-gray-900 dark:text-white font-semibold">
                      Items
                    </th>
                    <th className="text-left p-4 text-gray-900 dark:text-white font-semibold">
                      Total
                    </th>
                    <th className="text-left p-4 text-gray-900 dark:text-white font-semibold">
                      Status
                    </th>
                    <th className="text-left p-4 text-gray-900 dark:text-white font-semibold">
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recentOrders.map(order => (
                    <tr
                      key={order.id}
                      className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-yametee-dark/50 transition-colors"
                    >
                      <td className="p-4">
                        <a
                          href={`/admin/orders/${order.id}`}
                          className="text-yametee-red hover:text-yametee-red/80 font-medium"
                        >
                          {order.orderNumber}
                        </a>
                      </td>
                      <td className="p-4 text-gray-900 dark:text-white">
                        {order.customer?.name || order.customer?.email || 'Guest'}
                      </td>
                      <td className="p-4 text-gray-900 dark:text-white">
                        {order.items.length} item{order.items.length !== 1 ? 's' : ''}
                      </td>
                      <td className="p-4 text-gray-900 dark:text-white font-semibold">
                        {formatCurrency(Number(order.grandTotal))}
                      </td>
                      <td className="p-4">
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-semibold ${
                            order.status === 'COMPLETED'
                              ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                              : order.status === 'PENDING'
                                ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
                                : order.status === 'SHIPPED'
                                  ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                                  : order.status === 'CANCELLED'
                                    ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-400'
                          }`}
                        >
                          {order.status}
                        </span>
                      </td>
                      <td className="p-4 text-gray-600 dark:text-gray-400 text-sm">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  )
}
