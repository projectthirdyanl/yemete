'use client'

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'

interface CartItem {
  id: string
  productId: string
  variantId: string
  quantity: number
  productName: string
  size: string
  color: string
  price: number
  imageUrl: string
  stockQuantity: number
}

interface CartContextType {
  items: CartItem[]
  itemCount: number
  total: number
  isLoading: boolean
  error: string | null
  addItem: (variantId: string, quantity: number) => Promise<void>
  updateQuantity: (itemId: string, quantity: number) => Promise<void>
  removeItem: (itemId: string) => Promise<void>
  refreshCart: () => Promise<void>
  clearCart: () => void
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchCart = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      const response = await fetch('/api/cart')
      const data = await response.json()

      if (response.ok) {
        setItems(data.items || [])
      } else {
        setError(data.error || 'Failed to load cart')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load cart'
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchCart()

    // Listen for cart updates from other components
    const handleCartUpdate = () => {
      fetchCart().catch(error => {
        console.error('Failed to reload cart:', error)
      })
    }
    window.addEventListener('cartUpdated', handleCartUpdate)

    return () => {
      window.removeEventListener('cartUpdated', handleCartUpdate)
    }
  }, [fetchCart])

  const addItem = useCallback(async (variantId: string, quantity: number) => {
    try {
      setError(null)
      const response = await fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ variantId, quantity }),
      })

      const data = await response.json()

      if (response.ok) {
        setItems(data.items || [])
        window.dispatchEvent(new Event('cartUpdated'))
      } else {
        throw new Error(data.error || 'Failed to add to cart')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add to cart'
      setError(errorMessage)
      throw err
    }
  }, [])

  const removeItem = useCallback(async (itemId: string) => {
    try {
      setError(null)
      const response = await fetch(`/api/cart/${itemId}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (response.ok) {
        setItems(data.items || [])
        window.dispatchEvent(new Event('cartUpdated'))
      } else {
        throw new Error(data.error || 'Failed to remove item')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to remove item'
      setError(errorMessage)
      throw err
    }
  }, [])

  const updateQuantity = useCallback(
    async (itemId: string, quantity: number) => {
      if (quantity <= 0) {
        await removeItem(itemId)
        return
      }

      try {
        setError(null)
        const response = await fetch('/api/cart', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ itemId, quantity }),
        })

        const data = await response.json()

        if (response.ok) {
          setItems(data.items || [])
          window.dispatchEvent(new Event('cartUpdated'))
        } else {
          throw new Error(data.error || 'Failed to update quantity')
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to update quantity'
        setError(errorMessage)
        throw err
      }
    },
    [removeItem]
  )

  const clearCart = useCallback(() => {
    setItems([])
    setError(null)
  }, [])

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0)
  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0)

  return (
    <CartContext.Provider
      value={{
        items,
        itemCount,
        total,
        isLoading,
        error,
        addItem,
        updateQuantity,
        removeItem,
        refreshCart: fetchCart,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}
