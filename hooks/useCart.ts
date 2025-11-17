import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type {
  CartResponse,
  ApiResponse,
  AddToCartRequest,
  UpdateCartItemRequest,
} from '@yametee/types'

/**
 * Fetch cart data
 */
export function useCart() {
  return useQuery<ApiResponse<CartResponse>>({
    queryKey: ['cart'],
    queryFn: async () => {
      const response = await fetch('/api/cart', {
        credentials: 'include',
      })
      if (!response.ok) {
        throw new Error('Failed to fetch cart')
      }
      return response.json()
    },
    staleTime: 0, // Cart should always be fresh
  })
}

/**
 * Add item to cart mutation
 */
export function useAddToCart() {
  const queryClient = useQueryClient()

  return useMutation<ApiResponse<CartResponse>, Error, AddToCartRequest>({
    mutationFn: async data => {
      const response = await fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to add to cart')
      }
      return response.json()
    },
    onSuccess: () => {
      // Invalidate cart query to refetch
      queryClient.invalidateQueries({ queryKey: ['cart'] })
      // Also invalidate cart count
      queryClient.invalidateQueries({ queryKey: ['cart', 'count'] })
    },
  })
}

/**
 * Update cart item quantity mutation
 */
export function useUpdateCartItem() {
  const queryClient = useQueryClient()

  return useMutation<ApiResponse<CartResponse>, Error, UpdateCartItemRequest>({
    mutationFn: async data => {
      const response = await fetch('/api/cart', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update cart')
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] })
      queryClient.invalidateQueries({ queryKey: ['cart', 'count'] })
    },
  })
}

/**
 * Remove item from cart mutation
 */
export function useRemoveCartItem() {
  const queryClient = useQueryClient()

  return useMutation<ApiResponse<CartResponse>, Error, string>({
    mutationFn: async itemId => {
      const response = await fetch(`/api/cart/${itemId}`, {
        method: 'DELETE',
        credentials: 'include',
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to remove item')
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] })
      queryClient.invalidateQueries({ queryKey: ['cart', 'count'] })
    },
  })
}

/**
 * Get cart item count
 */
export function useCartCount() {
  return useQuery<{ count: number }>({
    queryKey: ['cart', 'count'],
    queryFn: async () => {
      const response = await fetch('/api/cart/count', {
        credentials: 'include',
      })
      if (!response.ok) {
        return { count: 0 }
      }
      return response.json()
    },
  })
}
