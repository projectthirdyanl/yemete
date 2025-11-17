import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import AdminLayout from '@/components/AdminLayout'
import OrderStatusUpdate from '@/components/OrderStatusUpdate'

async function getOrder(id: string) {
  try {
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        customer: true,
        address: true,
        items: {
          include: {
            product: {
              include: {
                images: {
                  where: { isPrimary: true },
                  take: 1,
                },
              },
            },
            variant: true,
          },
        },
        payments: {
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    })
    return order
  } catch (error) {
    console.error('Error fetching order:', error)
    return null
  }
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
  }).format(amount)
}

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const order = await getOrder(id)

  if (!order) {
    notFound()
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Order {order.orderNumber}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Placed on {new Date(order.createdAt).toLocaleString()}
            </p>
          </div>
        </div>

        {/* Order Status Update */}
        <OrderStatusUpdate
          order={{
            id: order.id,
            status: order.status,
            paymentStatus: order.paymentStatus,
          }}
        />

        {/* Order Details Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Items */}
            <div className="bg-white dark:bg-yametee-gray border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Order Items</h2>
              </div>
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {order.items.map(item => (
                  <div key={item.id} className="p-6 flex gap-4">
                    {item.product.images[0] && (
                      <img
                        src={item.product.images[0].imageUrl}
                        alt={item.product.name}
                        className="w-20 h-20 object-cover rounded-lg"
                      />
                    )}
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {item.product.name}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {item.variant.size} / {item.variant.color} • SKU: {item.variant.sku}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Quantity: {item.quantity}
                      </p>
                      <p className="text-lg font-semibold text-gray-900 dark:text-white mt-2">
                        {formatCurrency(Number(item.totalPrice))}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Payment Information */}
            {order.payments.length > 0 && (
              <div className="bg-white dark:bg-yametee-gray border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    Payment Information
                  </h2>
                </div>
                <div className="p-6 space-y-4">
                  {order.payments.map(payment => (
                    <div key={payment.id} className="flex justify-between items-center">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {payment.provider}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {new Date(payment.createdAt).toLocaleString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900 dark:text-white">
                          {formatCurrency(Number(payment.amount))}
                        </p>
                        <span
                          className={`px-2 py-1 rounded text-xs font-semibold ${
                            payment.status === 'PAID'
                              ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                              : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
                          }`}
                        >
                          {payment.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Order Summary */}
            <div className="bg-white dark:bg-yametee-gray border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Order Summary</h2>
              </div>
              <div className="p-6 space-y-3">
                <div className="flex justify-between text-gray-600 dark:text-gray-400">
                  <span>Subtotal</span>
                  <span>{formatCurrency(Number(order.subtotal))}</span>
                </div>
                <div className="flex justify-between text-gray-600 dark:text-gray-400">
                  <span>Shipping</span>
                  <span>{formatCurrency(Number(order.shippingFee))}</span>
                </div>
                {Number(order.discountTotal) > 0 && (
                  <div className="flex justify-between text-gray-600 dark:text-gray-400">
                    <span>Discount</span>
                    <span className="text-green-600 dark:text-green-400">
                      -{formatCurrency(Number(order.discountTotal))}
                    </span>
                  </div>
                )}
                <div className="border-t border-gray-200 dark:border-gray-700 pt-3 flex justify-between">
                  <span className="font-bold text-gray-900 dark:text-white">Total</span>
                  <span className="font-bold text-gray-900 dark:text-white">
                    {formatCurrency(Number(order.grandTotal))}
                  </span>
                </div>
              </div>
            </div>

            {/* Customer Information */}
            {order.customer && (
              <div className="bg-white dark:bg-yametee-gray border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">Customer</h2>
                </div>
                <div className="p-6 space-y-2">
                  {order.customer.name && (
                    <p className="text-gray-900 dark:text-white font-medium">
                      {order.customer.name}
                    </p>
                  )}
                  {order.customer.email && (
                    <p className="text-gray-600 dark:text-gray-400">{order.customer.email}</p>
                  )}
                  {order.customer.phone && (
                    <p className="text-gray-600 dark:text-gray-400">{order.customer.phone}</p>
                  )}
                </div>
              </div>
            )}

            {/* Shipping Address */}
            {order.address && (
              <div className="bg-white dark:bg-yametee-gray border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    Shipping Address
                  </h2>
                </div>
                <div className="p-6 space-y-1 text-gray-600 dark:text-gray-400">
                  <p className="font-medium text-gray-900 dark:text-white">
                    {order.address.fullName}
                  </p>
                  <p>{order.address.line1}</p>
                  {order.address.line2 && <p>{order.address.line2}</p>}
                  <p>
                    {order.address.city}, {order.address.province} {order.address.postalCode}
                  </p>
                  <p>{order.address.country}</p>
                  <p className="mt-2">Phone: {order.address.phone}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
