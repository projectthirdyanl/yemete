import { notFound } from 'next/navigation'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { prisma } from '@/lib/prisma'
import { formatPrice } from '@/lib/utils'

async function getOrder(orderNumber: string) {
  try {
    const order = await prisma.order.findUnique({
      where: { orderNumber },
      include: {
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
        address: true,
        customer: true,
      },
    })
    return order
  } catch (error) {
    console.error('Error fetching order:', error)
    return null
  }
}

export default async function OrderPage({
  params,
  searchParams,
}: {
  params: { order_number: string }
  searchParams: { status?: string }
}) {
  const order = await getOrder(params.order_number)

  if (!order) {
    notFound()
  }

  const safeOrder = {
    ...order,
    subtotal: Number(order.subtotal),
    shippingFee: Number(order.shippingFee),
    grandTotal: Number(order.grandTotal),
    items: order.items.map((item) => ({
      ...item,
      totalPrice: Number(item.totalPrice),
      variant: {
        ...item.variant,
        price: Number(item.variant.price),
      },
    })),
  }

  const orderData = safeOrder

  const isPaid = orderData.paymentStatus === 'PAID'
  const isSuccess = searchParams.status === 'success'

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 py-12 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-8">
            {isPaid || isSuccess ? (
              <div className="mb-4">
                <div className="inline-block bg-green-500/20 border border-green-500 rounded-full p-4 mb-4">
                  <svg
                    className="w-12 h-12 text-green-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
                  Order Confirmed!
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  Thank you for your purchase. Your order is being processed.
                </p>
              </div>
            ) : (
              <div className="mb-4">
                <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
                  Order #{orderData.orderNumber}
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  Payment Status: <span className="text-yellow-500 font-semibold">{orderData.paymentStatus}</span>
                </p>
              </div>
            )}
          </div>

          <div className="bg-white dark:bg-yametee-gray border border-gray-200 dark:border-gray-700 rounded-lg p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Order Details</h2>
            <div className="space-y-2 text-gray-700 dark:text-gray-300">
              <div className="flex justify-between">
                <span>Order Number</span>
                <span className="font-semibold text-gray-900 dark:text-white">{orderData.orderNumber}</span>
              </div>
              <div className="flex justify-between">
                <span>Status</span>
                <span className="font-semibold text-gray-900 dark:text-white">{orderData.status}</span>
              </div>
              <div className="flex justify-between">
                <span>Payment Status</span>
                <span
                  className={`font-semibold ${
                    orderData.paymentStatus === 'PAID' ? 'text-green-500' : 'text-yellow-500'
                  }`}
                >
                  {orderData.paymentStatus}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Date</span>
                <span className="text-gray-900 dark:text-white">
                  {new Date(orderData.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-yametee-gray border border-gray-200 dark:border-gray-700 rounded-lg p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Items</h2>
            <div className="space-y-4">
              {orderData.items.map((item) => (
                <div key={item.id} className="flex gap-4">
                  {item.product.images[0] && (
                    <img
                      src={item.product.images[0].imageUrl}
                      alt={item.product.name}
                      className="w-20 h-20 object-cover rounded-lg border border-gray-200 dark:border-gray-700"
                    />
                  )}
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {item.product.name}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      {item.variant.size} · {item.variant.color} × {item.quantity}
                    </p>
                    <p className="text-yametee-red font-semibold mt-1">
                      {formatPrice(item.totalPrice)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {orderData.address && (
            <div className="bg-white dark:bg-yametee-gray border border-gray-200 dark:border-gray-700 rounded-lg p-6 mb-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Shipping Address</h2>
              <div className="text-gray-700 dark:text-gray-300">
                <p className="font-semibold text-gray-900 dark:text-white">{orderData.address.fullName}</p>
                <p>{orderData.address.line1}</p>
                {orderData.address.line2 && <p>{orderData.address.line2}</p>}
                <p>
                  {orderData.address.city}, {orderData.address.province} {orderData.address.postalCode}
                </p>
                <p>{orderData.address.country}</p>
                <p className="mt-2">Phone: {orderData.address.phone}</p>
              </div>
            </div>
          )}

          <div className="bg-white dark:bg-yametee-gray border border-gray-200 dark:border-gray-700 rounded-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Order Summary</h2>
            <div className="space-y-2">
              <div className="flex justify-between text-gray-700 dark:text-gray-300">
                <span>Subtotal</span>
                <span>{formatPrice(orderData.subtotal)}</span>
              </div>
              <div className="flex justify-between text-gray-700 dark:text-gray-300">
                <span>Shipping</span>
                <span>{formatPrice(orderData.shippingFee)}</span>
              </div>
              <div className="border-t border-gray-200 dark:border-gray-700 pt-2 mt-2">
                <div className="flex justify-between text-gray-900 dark:text-white font-bold text-lg">
                  <span>Total</span>
                  <span className="text-yametee-red">{formatPrice(orderData.grandTotal)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 text-center">
            <a
              href="/products"
              className="inline-block bg-yametee-red text-white px-6 py-3 rounded-lg font-semibold hover:bg-yametee-red/90 transition-all hover:scale-105"
            >
              Continue Shopping
            </a>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
