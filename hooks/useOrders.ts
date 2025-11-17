import { useQuery } from '@tanstack/react-query'
import type { OrderResponse, ApiResponse, PaginatedResponse } from '@yametee/types'

interface OrdersListResponse extends PaginatedResponse<OrderResponse> {}

/**
 * Fetch orders (admin)
 */
export function useOrders(page = 1, limit = 50, status?: string) {
  return useQuery<ApiResponse<OrdersListResponse>>({
    queryKey: ['orders', page, limit, status],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(status && status !== 'ALL' && { status }),
      })
      const response = await fetch(`/api/admin/orders?${params}`, {
        credentials: 'include',
      })
      if (!response.ok) {
        throw new Error('Failed to fetch orders')
      }
      return response.json()
    },
    enabled: false, // Only fetch when explicitly called (admin only)
  })
}

/**
 * Fetch a single order by ID
 */
export function useOrder(orderId: string) {
  return useQuery<ApiResponse<OrderResponse>>({
    queryKey: ['orders', orderId],
    queryFn: async () => {
      const response = await fetch(`/api/admin/orders/${orderId}`, {
        credentials: 'include',
      })
      if (!response.ok) {
        throw new Error('Failed to fetch order')
      }
      return response.json()
    },
    enabled: !!orderId,
  })
}

/**
 * Fetch order by order number (public)
 */
export function useOrderByNumber(orderNumber: string) {
  return useQuery<ApiResponse<OrderResponse>>({
    queryKey: ['orders', 'number', orderNumber],
    queryFn: async () => {
      const response = await fetch(`/api/order/${orderNumber}`)
      if (!response.ok) {
        throw new Error('Failed to fetch order')
      }
      return response.json()
    },
    enabled: !!orderNumber,
  })
}
