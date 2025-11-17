'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import LoadingSpinner from '@/components/LoadingSpinner'
import { formatPrice } from '@/lib/utils'
import { useCart, useUpdateCartItem, useRemoveCartItem } from '@/hooks/useCart'
import { useToast } from '@/contexts/ToastContext'

export default function CartPage() {
  const { data: cartData, isLoading: loading, error } = useCart()
  const updateCartItem = useUpdateCartItem()
  const removeCartItem = useRemoveCartItem()
  const { error: showError } = useToast()

  const cart = cartData?.data?.items || []

  // Show error toast if cart has errors
  useEffect(() => {
    if (error) {
      showError(error.message || 'Failed to load cart')
    }
  }, [error, showError])

  const handleUpdateQuantity = async (itemId: string, newQuantity: number) => {
    try {
      await updateCartItem.mutateAsync({ itemId, quantity: newQuantity })
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update quantity'
      showError(errorMessage)
    }
  }

  const handleRemoveItem = async (itemId: string) => {
    try {
      await removeCartItem.mutateAsync(itemId)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to remove item'
      showError(errorMessage)
    }
  }

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const shippingFee = subtotal > 0 ? 100 : 0
  const grandTotal = subtotal + shippingFee

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <LoadingSpinner fullScreen={false} message="Loading your cart..." />
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 py-12 px-4">
        <div className="container mx-auto max-w-4xl">
          <h1 className="text-4xl font-bold mb-8 text-gray-900 dark:text-white">Shopping Cart</h1>

          {cart.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-gray-600 dark:text-gray-400 text-xl mb-6">Your cart is empty.</p>
              <Link
                href="/products"
                className="inline-block bg-yametee-red text-white px-6 py-3 rounded-lg font-semibold hover:bg-yametee-red/90 transition-all"
              >
                Continue Shopping
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-4">
                {cart.map(item => (
                  <div
                    key={item.id}
                    className="bg-white dark:bg-yametee-gray border border-gray-200 dark:border-gray-700 rounded-lg p-4 flex gap-4"
                  >
                    {item.imageUrl && (
                      <img
                        src={item.imageUrl}
                        alt={item.productName}
                        className="w-24 h-24 object-cover rounded-lg"
                      />
                    )}
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                        {item.productName}
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400 mb-2">
                        {item.size} · {item.color}
                      </p>
                      {item.stockQuantity < item.quantity && (
                        <p className="text-red-500 text-sm mb-2">
                          Only {item.stockQuantity} available in stock
                        </p>
                      )}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                            disabled={item.quantity <= 1 || updateCartItem.isPending}
                            className="w-8 h-8 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            -
                          </button>
                          <span className="text-gray-900 dark:text-white w-8 text-center">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                            disabled={
                              item.quantity >= item.stockQuantity || updateCartItem.isPending
                            }
                            className="w-8 h-8 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            +
                          </button>
                        </div>
                        <div className="flex items-center gap-4">
                          <p className="text-yametee-red font-semibold">
                            {formatPrice(item.price * item.quantity)}
                          </p>
                          <button
                            onClick={() => handleRemoveItem(item.id)}
                            disabled={removeCartItem.isPending}
                            className="text-gray-600 dark:text-gray-400 hover:text-yametee-red transition-colors disabled:opacity-50"
                          >
                            {removeCartItem.isPending ? 'Removing...' : 'Remove'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="lg:col-span-1">
                <div className="bg-white dark:bg-yametee-gray border border-gray-200 dark:border-gray-700 rounded-lg p-6 sticky top-24">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                    Order Summary
                  </h2>
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-gray-700 dark:text-gray-300">
                      <span>Subtotal</span>
                      <span>{formatPrice(subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-gray-700 dark:text-gray-300">
                      <span>Shipping</span>
                      <span>{formatPrice(shippingFee)}</span>
                    </div>
                    <div className="border-t border-gray-200 dark:border-gray-700 pt-2 mt-2">
                      <div className="flex justify-between text-gray-900 dark:text-white font-bold text-lg">
                        <span>Total</span>
                        <span className="text-yametee-red">{formatPrice(grandTotal)}</span>
                      </div>
                    </div>
                  </div>
                  <Link
                    href="/checkout"
                    className="block w-full bg-yametee-red text-white py-3 rounded-lg font-semibold text-center hover:bg-yametee-red/90 transition-all hover:scale-105"
                  >
                    Proceed to Checkout
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}
