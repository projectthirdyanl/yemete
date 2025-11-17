import { useQuery } from '@tanstack/react-query'
import type { ProductResponse, ApiResponse } from '@yametee/types'

interface ProductsResponse {
  products: ProductResponse[]
}

/**
 * Fetch all products
 */
export function useProducts() {
  return useQuery<ApiResponse<ProductsResponse>>({
    queryKey: ['products'],
    queryFn: async () => {
      const response = await fetch('/api/products')
      if (!response.ok) {
        throw new Error('Failed to fetch products')
      }
      return response.json()
    },
  })
}

/**
 * Fetch a single product by slug
 */
export function useProduct(slug: string) {
  return useQuery<ApiResponse<ProductResponse>>({
    queryKey: ['products', slug],
    queryFn: async () => {
      const response = await fetch(`/api/products/${slug}`)
      if (!response.ok) {
        throw new Error('Failed to fetch product')
      }
      return response.json()
    },
    enabled: !!slug,
  })
}

/**
 * Fetch featured products
 */
export function useFeaturedProducts() {
  return useQuery<ApiResponse<ProductsResponse>>({
    queryKey: ['products', 'featured'],
    queryFn: async () => {
      const response = await fetch('/api/products?featured=true')
      if (!response.ok) {
        throw new Error('Failed to fetch featured products')
      }
      return response.json()
    },
  })
}

/**
 * Fetch drop products
 */
export function useDropProducts() {
  return useQuery<ApiResponse<ProductsResponse>>({
    queryKey: ['products', 'drops'],
    queryFn: async () => {
      const response = await fetch('/api/products?drops=true')
      if (!response.ok) {
        throw new Error('Failed to fetch drop products')
      }
      return response.json()
    },
  })
}
