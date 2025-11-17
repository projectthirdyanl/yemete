import AdminLayout from '@/components/AdminLayout'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

async function getOrders(status?: string) {
  try {
    const where: {
      status?: 'PENDING' | 'PAID' | 'PROCESSING' | 'SHIPPED' | 'COMPLETED' | 'CANCELLED'
    } = {}
    if (status && status !== 'ALL') {
      where.status = status as
        | 'PENDING'
        | 'PAID'
        | 'PROCESSING'
        | 'SHIPPED'
        | 'COMPLETED'
        | 'CANCELLED'
    }

    const orders = await prisma.order.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        customer: {
          select: {
            name: true,
            email: true,
          },
        },
        items: {
          include: {
            product: {
              select: {
                name: true,
              },
            },
            variant: {
              select: {
                size: true,
                color: true,
              },
            },
          },
        },
      },
    })

    return orders
  } catch (error) {
    console.error('Error fetching orders:', error)
    return []
  }
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
  }).format(amount)
}

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: { status?: string }
}) {
  const orders = await getOrders(searchParams?.status)

  const statusCounts = {
    ALL: orders.length,
    PENDING: orders.filter(o => o.status === 'PENDING').length,
    PAID: orders.filter(o => o.status === 'PAID').length,
    PROCESSING: orders.filter(o => o.status === 'PROCESSING').length,
    SHIPPED: orders.filter(o => o.status === 'SHIPPED').length,
    COMPLETED: orders.filter(o => o.status === 'COMPLETED').length,
    CANCELLED: orders.filter(o => o.status === 'CANCELLED').length,
  }

  const currentStatus = searchParams?.status || 'ALL'

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Orders</h1>
        </div>

        {/* Status Filter */}
        <div className="flex gap-2 flex-wrap">
          {Object.entries(statusCounts).map(([status, count]) => (
            <Link
              key={status}
              href={`/admin/orders${status === 'ALL' ? '' : `?status=${status}`}`}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                currentStatus === status
                  ? 'bg-yametee-red text-white'
                  : 'bg-white dark:bg-yametee-gray border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-yametee-dark'
              }`}
            >
              {status} ({count})
            </Link>
          ))}
        </div>

        {/* Orders Table */}
        <div className="bg-white dark:bg-yametee-gray border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
          {orders.length === 0 ? (
            <div className="p-8 text-center text-gray-600 dark:text-gray-400">No orders found</div>
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
                      Payment
                    </th>
                    <th className="text-left p-4 text-gray-900 dark:text-white font-semibold">
                      Status
                    </th>
                    <th className="text-left p-4 text-gray-900 dark:text-white font-semibold">
                      Date
                    </th>
                    <th className="text-left p-4 text-gray-900 dark:text-white font-semibold">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map(order => (
                    <tr
                      key={order.id}
                      className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-yametee-dark/50 transition-colors"
                    >
                      <td className="p-4">
                        <Link
                          href={`/admin/orders/${order.id}`}
                          className="text-yametee-red hover:text-yametee-red/80 font-medium"
                        >
                          {order.orderNumber}
                        </Link>
                      </td>
                      <td className="p-4 text-gray-900 dark:text-white">
                        <div>
                          <div>{order.customer?.name || 'Guest'}</div>
                          {order.customer?.email && (
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                              {order.customer.email}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="p-4 text-gray-900 dark:text-white">
                        {order.items.length} item{order.items.length !== 1 ? 's' : ''}
                      </td>
                      <td className="p-4 text-gray-900 dark:text-white font-semibold">
                        {formatCurrency(Number(order.grandTotal))}
                      </td>
                      <td className="p-4">
                        <span
                          className={`px-2 py-1 rounded text-xs font-semibold ${
                            order.paymentStatus === 'PAID'
                              ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                              : order.paymentStatus === 'PENDING'
                                ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
                                : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                          }`}
                        >
                          {order.paymentStatus}
                        </span>
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
                                  : order.status === 'PROCESSING'
                                    ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400'
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
                      <td className="p-4">
                        <Link
                          href={`/admin/orders/${order.id}`}
                          className="text-yametee-red hover:text-yametee-red/80 text-sm font-medium"
                        >
                          View
                        </Link>
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
