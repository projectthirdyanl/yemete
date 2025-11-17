'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import LoadingSpinner from '@/components/LoadingSpinner'
import { formatPrice } from '@/lib/utils'
import { useToast } from '@/contexts/ToastContext'

interface CartItem {
  id: string
  productId: string
  variantId: string
  size: string
  color: string
  quantity: number
  price: number
  productName: string
  imageUrl: string
  stockQuantity: number
}

export default function CheckoutPage() {
  const router = useRouter()
  const { error: showError, success: showSuccess } = useToast()
  const [cart, setCart] = useState<CartItem[]>([])
  const [loading, setLoading] = useState(false)
  const [cartLoading, setCartLoading] = useState(true)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    line1: '',
    line2: '',
    city: '',
    province: '',
    postalCode: '',
  })
  const [paymentMethod, setPaymentMethod] = useState<
    'gcash' | 'paymaya' | 'card' | 'bank_transfer' | ''
  >('')

  useEffect(() => {
    const loadCart = async () => {
      try {
        const response = await fetch('/api/cart')
        const data = await response.json()
        if (response.ok && data.items && data.items.length > 0) {
          setCart(data.items)
        } else {
          router.push('/cart')
        }
      } catch (error) {
        console.error('Failed to load cart:', error)
        router.push('/cart')
      } finally {
        setCartLoading(false)
      }
    }

    loadCart()
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate payment method
    if (!paymentMethod) {
      showError('Please select a payment method')
      return
    }

    // Validate required fields
    if (!formData.name || !formData.email || !formData.phone) {
      showError('Please fill in all required contact information')
      return
    }

    if (!formData.line1 || !formData.city || !formData.province || !formData.postalCode) {
      showError('Please fill in all required shipping address fields')
      return
    }

    setLoading(true)

    try {
      // Format cart items for checkout API
      const checkoutCart = cart.map(item => ({
        productId: item.productId,
        variantId: item.variantId,
        size: item.size,
        color: item.color,
        quantity: item.quantity,
        price: item.price,
        productName: item.productName,
        imageUrl: item.imageUrl,
      }))

      console.log('Submitting checkout:', {
        cartItems: checkoutCart.length,
        paymentMethod,
        customerEmail: formData.email,
      })

      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cart: checkoutCart,
          customer: formData,
          paymentMethod,
        }),
      })

      const data = await response.json()

      console.log('Checkout response:', {
        ok: response.ok,
        hasCheckoutUrl: !!data.checkoutUrl,
        hasOrderNumber: !!data.orderNumber,
        error: data.error,
      })

      if (!response.ok) {
        const errorMsg = data.error || 'Checkout failed. Please try again.'
        console.error('Checkout error:', errorMsg)
        throw new Error(errorMsg)
      }

      // Check if we have a checkout URL
      if (data.checkoutUrl) {
        console.log('Redirecting to PayMongo checkout:', data.checkoutUrl)
        showSuccess('Redirecting to payment...')
        setLoading(false) // Reset loading state before redirect
        // Small delay to show success message, then redirect
        setTimeout(() => {
          window.location.href = data.checkoutUrl
        }, 500)
      } else if (data.orderNumber) {
        console.log('No checkout URL, redirecting to order page:', data.orderNumber)
        showSuccess('Order created successfully!')
        setLoading(false)
        router.push(`/order/${data.orderNumber}`)
      } else {
        console.error('No checkout URL or order number in response:', data)
        throw new Error('Invalid response from server. Please contact support.')
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Something went wrong. Please try again.'
      console.error('Checkout submission error:', error)
      showError(errorMessage)
      setLoading(false)
    }
  }

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const shippingFee = subtotal > 0 ? 100 : 0
  const grandTotal = subtotal + shippingFee

  if (cartLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <LoadingSpinner fullScreen={false} message="Preparing checkout..." />
        <Footer />
      </div>
    )
  }

  if (cart.length === 0) {
    return null
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 py-12 px-4">
        <div className="container mx-auto max-w-6xl">
          <h1 className="text-4xl font-bold mb-8 text-gray-900 dark:text-white">Checkout</h1>

          <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white dark:bg-yametee-gray border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                  Contact Information
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-gray-700 dark:text-gray-300 mb-2">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                      className="w-full bg-white dark:bg-yametee-dark border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 text-gray-900 dark:text-white focus:outline-none focus:border-yametee-red transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 dark:text-gray-300 mb-2">Email *</label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={e => setFormData({ ...formData, email: e.target.value })}
                      className="w-full bg-white dark:bg-yametee-dark border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 text-gray-900 dark:text-white focus:outline-none focus:border-yametee-red transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 dark:text-gray-300 mb-2">Phone *</label>
                    <input
                      type="tel"
                      required
                      value={formData.phone}
                      onChange={e => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full bg-white dark:bg-yametee-dark border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 text-gray-900 dark:text-white focus:outline-none focus:border-yametee-red transition-colors"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-yametee-gray border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                  Payment Method
                </h2>
                <div className="space-y-3">
                  <label
                    className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      paymentMethod === 'gcash'
                        ? 'border-yametee-red bg-yametee-red/5 dark:bg-yametee-red/10'
                        : 'border-gray-200 dark:border-gray-600 hover:border-yametee-red/50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="gcash"
                      checked={paymentMethod === 'gcash'}
                      onChange={e => setPaymentMethod(e.target.value as any)}
                      className="w-5 h-5 text-yametee-red focus:ring-yametee-red focus:ring-2"
                    />
                    <div className="ml-3 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-900 dark:text-white font-semibold">GCash</span>
                        <span className="text-xs px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded">
                          Mobile Wallet
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Pay using your GCash account
                      </p>
                    </div>
                  </label>

                  <label
                    className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      paymentMethod === 'paymaya'
                        ? 'border-yametee-red bg-yametee-red/5 dark:bg-yametee-red/10'
                        : 'border-gray-200 dark:border-gray-600 hover:border-yametee-red/50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="paymaya"
                      checked={paymentMethod === 'paymaya'}
                      onChange={e => setPaymentMethod(e.target.value as any)}
                      className="w-5 h-5 text-yametee-red focus:ring-yametee-red focus:ring-2"
                    />
                    <div className="ml-3 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-900 dark:text-white font-semibold">PayMaya</span>
                        <span className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded">
                          Mobile Wallet
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Pay using your PayMaya account
                      </p>
                    </div>
                  </label>

                  <label
                    className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      paymentMethod === 'card'
                        ? 'border-yametee-red bg-yametee-red/5 dark:bg-yametee-red/10'
                        : 'border-gray-200 dark:border-gray-600 hover:border-yametee-red/50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="card"
                      checked={paymentMethod === 'card'}
                      onChange={e => setPaymentMethod(e.target.value as any)}
                      className="w-5 h-5 text-yametee-red focus:ring-yametee-red focus:ring-2"
                    />
                    <div className="ml-3 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-900 dark:text-white font-semibold">
                          Credit/Debit Card
                        </span>
                        <span className="text-xs px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 rounded">
                          Card
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Visa, Mastercard, JCB, and more
                      </p>
                    </div>
                  </label>

                  <label
                    className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      paymentMethod === 'bank_transfer'
                        ? 'border-yametee-red bg-yametee-red/5 dark:bg-yametee-red/10'
                        : 'border-gray-200 dark:border-gray-600 hover:border-yametee-red/50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="bank_transfer"
                      checked={paymentMethod === 'bank_transfer'}
                      onChange={e => setPaymentMethod(e.target.value as any)}
                      className="w-5 h-5 text-yametee-red focus:ring-yametee-red focus:ring-2"
                    />
                    <div className="ml-3 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-900 dark:text-white font-semibold">
                          Online Banking
                        </span>
                        <span className="text-xs px-2 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 rounded">
                          Bank Transfer
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Direct bank transfer via online banking
                      </p>
                    </div>
                  </label>
                </div>
                <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <p className="text-sm text-blue-800 dark:text-blue-300">
                    <strong>Note:</strong> PayPal is not available through PayMongo. For PayPal
                    payments, please contact our support team.
                  </p>
                </div>
              </div>

              <div className="bg-white dark:bg-yametee-gray border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                  Shipping Address
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-gray-700 dark:text-gray-300 mb-2">
                      Address Line 1 *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.line1}
                      onChange={e => setFormData({ ...formData, line1: e.target.value })}
                      className="w-full bg-white dark:bg-yametee-dark border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 text-gray-900 dark:text-white focus:outline-none focus:border-yametee-red transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 dark:text-gray-300 mb-2">
                      Address Line 2
                    </label>
                    <input
                      type="text"
                      value={formData.line2}
                      onChange={e => setFormData({ ...formData, line2: e.target.value })}
                      className="w-full bg-white dark:bg-yametee-dark border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 text-gray-900 dark:text-white focus:outline-none focus:border-yametee-red transition-colors"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-gray-700 dark:text-gray-300 mb-2">City *</label>
                      <input
                        type="text"
                        required
                        value={formData.city}
                        onChange={e => setFormData({ ...formData, city: e.target.value })}
                        className="w-full bg-white dark:bg-yametee-dark border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 text-gray-900 dark:text-white focus:outline-none focus:border-yametee-red transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-700 dark:text-gray-300 mb-2">
                        Province *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.province}
                        onChange={e => setFormData({ ...formData, province: e.target.value })}
                        className="w-full bg-white dark:bg-yametee-dark border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 text-gray-900 dark:text-white focus:outline-none focus:border-yametee-red transition-colors"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-gray-700 dark:text-gray-300 mb-2">
                      Postal Code *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.postalCode}
                      onChange={e => setFormData({ ...formData, postalCode: e.target.value })}
                      className="w-full bg-white dark:bg-yametee-dark border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 text-gray-900 dark:text-white focus:outline-none focus:border-yametee-red transition-colors"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-1">
              <div className="bg-white dark:bg-yametee-gray border border-gray-200 dark:border-gray-700 rounded-lg p-6 sticky top-24">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                  Order Summary
                </h2>
                <div className="space-y-2 mb-4">
                  {cart.map(item => (
                    <div
                      key={item.id}
                      className="flex justify-between text-sm text-gray-700 dark:text-gray-300"
                    >
                      <span>
                        {item.productName} ({item.size}, {item.color}) × {item.quantity}
                      </span>
                      <span className="font-medium">{formatPrice(item.price * item.quantity)}</span>
                    </div>
                  ))}
                </div>
                <div className="border-t border-gray-200 dark:border-gray-700 pt-4 space-y-2">
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
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-yametee-red text-white py-3 rounded-lg font-semibold mt-6 hover:bg-yametee-red/90 transition-all disabled:bg-gray-300 dark:disabled:bg-gray-700 disabled:text-gray-500 dark:disabled:text-gray-400 disabled:cursor-not-allowed hover:scale-105"
                >
                  {loading ? 'Processing...' : 'Place Order'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </main>

      <Footer />
    </div>
  )
}
