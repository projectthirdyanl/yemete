import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import AdminLayout from '@/components/AdminLayout'
import Link from 'next/link'

async function getCustomer(id: string) {
  try {
    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        addresses: true,
        orders: {
          orderBy: {
            createdAt: 'desc',
          },
          include: {
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
        },
      },
    })
    return customer
  } catch (error) {
    console.error('Error fetching customer:', error)
    return null
  }
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
  }).format(amount)
}

export default async function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const customer = await getCustomer(id)

  if (!customer) {
    notFound()
  }

  const totalSpent = customer.orders
    .filter(o => o.status === 'COMPLETED')
    .reduce((sum, o) => sum + Number(o.grandTotal), 0)

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              {customer.name || 'Customer'}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Member since {new Date(customer.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>

        {/* Customer Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-yametee-gray border border-gray-200 dark:border-gray-700 rounded-lg p-6">
            <p className="text-sm text-gray-600 dark:text-gray-400">Total Orders</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
              {customer.orders.length}
            </p>
          </div>
          <div className="bg-white dark:bg-yametee-gray border border-gray-200 dark:border-gray-700 rounded-lg p-6">
            <p className="text-sm text-gray-600 dark:text-gray-400">Total Spent</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
              {formatCurrency(totalSpent)}
            </p>
          </div>
          <div className="bg-white dark:bg-yametee-gray border border-gray-200 dark:border-gray-700 rounded-lg p-6">
            <p className="text-sm text-gray-600 dark:text-gray-400">Contact</p>
            <p className="text-lg font-semibold text-gray-900 dark:text-white mt-1">
              {customer.email || customer.phone || 'N/A'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Customer Details */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white dark:bg-yametee-gray border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Customer Information
                </h2>
              </div>
              <div className="p-6 space-y-3">
                {customer.name && (
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Name</p>
                    <p className="text-gray-900 dark:text-white font-medium">{customer.name}</p>
                  </div>
                )}
                {customer.email && (
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Email</p>
                    <p className="text-gray-900 dark:text-white">{customer.email}</p>
                  </div>
                )}
                {customer.phone && (
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Phone</p>
                    <p className="text-gray-900 dark:text-white">{customer.phone}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Addresses */}
            {customer.addresses.length > 0 && (
              <div className="bg-white dark:bg-yametee-gray border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">Addresses</h2>
                </div>
                <div className="p-6 space-y-4">
                  {customer.addresses.map(address => (
                    <div key={address.id} className="text-sm text-gray-600 dark:text-gray-400">
                      <p className="font-medium text-gray-900 dark:text-white">
                        {address.fullName}
                      </p>
                      <p>{address.line1}</p>
                      {address.line2 && <p>{address.line2}</p>}
                      <p>
                        {address.city}, {address.province} {address.postalCode}
                      </p>
                      <p>{address.country}</p>
                      <p className="mt-1">Phone: {address.phone}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Order History */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-yametee-gray border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Order History</h2>
              </div>
              {customer.orders.length === 0 ? (
                <div className="p-6 text-center text-gray-600 dark:text-gray-400">
                  No orders yet
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-yametee-dark border-b border-gray-200 dark:border-gray-700">
                      <tr>
                        <th className="text-left p-4 text-gray-900 dark:text-white font-semibold">
                          Order #
                        </th>
                        <th className="text-left p-4 text-gray-900 dark:text-white font-semibold">
                          Date
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
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {customer.orders.map(order => (
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
                          <td className="p-4 text-gray-600 dark:text-gray-400 text-sm">
                            {new Date(order.createdAt).toLocaleDateString()}
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
        </div>
      </div>
    </AdminLayout>
  )
}
