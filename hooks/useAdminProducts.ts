import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type {
  ProductResponse,
  ApiResponse,
  CreateProductRequest,
  UpdateProductRequest,
  PaginatedResponse,
} from '@yametee/types'

interface AdminProductsListResponse extends PaginatedResponse<ProductResponse> {}

/**
 * Fetch admin products list
 */
export function useAdminProducts(page = 1, limit = 50) {
  return useQuery<ApiResponse<AdminProductsListResponse>>({
    queryKey: ['admin', 'products', page, limit],
    queryFn: async () => {
      const response = await fetch(`/api/admin/products?page=${page}&limit=${limit}`, {
        credentials: 'include',
      })
      if (!response.ok) {
        throw new Error('Failed to fetch products')
      }
      return response.json()
    },
  })
}

/**
 * Fetch single admin product
 */
export function useAdminProduct(productId: string) {
  return useQuery<ApiResponse<ProductResponse>>({
    queryKey: ['admin', 'products', productId],
    queryFn: async () => {
      const response = await fetch(`/api/admin/products/${productId}`, {
        credentials: 'include',
      })
      if (!response.ok) {
        throw new Error('Failed to fetch product')
      }
      return response.json()
    },
    enabled: !!productId,
  })
}

/**
 * Create product mutation
 */
export function useCreateProduct() {
  const queryClient = useQueryClient()

  return useMutation<ApiResponse<ProductResponse>, Error, CreateProductRequest>({
    mutationFn: async data => {
      const response = await fetch('/api/admin/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create product')
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'products'] })
      queryClient.invalidateQueries({ queryKey: ['products'] })
    },
  })
}

/**
 * Update product mutation
 */
export function useUpdateProduct() {
  const queryClient = useQueryClient()

  return useMutation<ApiResponse<ProductResponse>, Error, UpdateProductRequest>({
    mutationFn: async data => {
      const response = await fetch(`/api/admin/products/${data.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update product')
      }
      return response.json()
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'products'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'products', variables.id] })
      queryClient.invalidateQueries({ queryKey: ['products'] })
    },
  })
}

/**
 * Delete product mutation
 */
export function useDeleteProduct() {
  const queryClient = useQueryClient()

  return useMutation<void, Error, string>({
    mutationFn: async productId => {
      const response = await fetch(`/api/admin/products/${productId}`, {
        method: 'DELETE',
        credentials: 'include',
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete product')
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'products'] })
      queryClient.invalidateQueries({ queryKey: ['products'] })
    },
  })
}
