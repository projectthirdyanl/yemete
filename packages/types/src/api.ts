/**
 * Standard API Response Types
 * These types define the structure of API requests and responses
 */

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

/**
 * Product API Types
 */
export interface CreateProductRequest {
  name: string
  slug: string
  description: string
  status?: 'ACTIVE' | 'DRAFT' | 'HIDDEN'
  images?: ProductImageInput[]
  variants?: VariantInput[]
  isFeatured?: boolean
  isDrop?: boolean
  isStandard?: boolean
}

export interface UpdateProductRequest extends Partial<CreateProductRequest> {
  id: string
}

export interface ProductImageInput {
  imageUrl: string
  color?: string | null
  isPrimary?: boolean
  position?: number
}

export interface VariantInput {
  sku: string
  size: string
  color: string
  price: number | string
  stockQuantity: number
}

export interface ProductResponse {
  id: string
  slug: string
  name: string
  description: string
  brand: string
  status: 'ACTIVE' | 'DRAFT' | 'HIDDEN'
  isFeatured: boolean
  isDrop: boolean
  isStandard: boolean
  createdAt: string
  updatedAt: string
  images: ProductImageResponse[]
  variants: VariantResponse[]
}

export interface ProductImageResponse {
  id: string
  imageUrl: string
  color: string | null
  isPrimary: boolean
  position: number
}

export interface VariantResponse {
  id: string
  sku: string
  size: string
  color: string
  price: number
  stockQuantity: number
}

/**
 * Cart API Types
 */
export interface AddToCartRequest {
  variantId: string
  quantity: number
}

export interface UpdateCartItemRequest {
  itemId: string
  quantity: number
}

export interface CartItemResponse {
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

export interface CartResponse {
  items: CartItemResponse[]
  itemCount: number
  total?: number
}

/**
 * Checkout & Order API Types
 */
export interface CheckoutRequest {
  address: AddressInput
  paymentMethod?: string
}

export interface AddressInput {
  fullName: string
  phone: string
  line1: string
  line2?: string
  city: string
  province: string
  postalCode: string
  country?: string
}

export interface OrderResponse {
  id: string
  orderNumber: string
  status: 'PENDING' | 'PAID' | 'PROCESSING' | 'SHIPPED' | 'COMPLETED' | 'CANCELLED'
  paymentStatus: 'PENDING' | 'UNPAID' | 'PAID' | 'REFUNDED' | 'FAILED'
  paymentProvider?: string | null
  subtotal: number
  shippingFee: number
  discountTotal: number
  grandTotal: number
  createdAt: string
  updatedAt: string
  items: OrderItemResponse[]
  address: AddressResponse
  customer?: CustomerResponse
  payments?: PaymentResponse[]
}

export interface OrderItemResponse {
  id: string
  productId: string
  variantId: string
  quantity: number
  unitPrice: number
  totalPrice: number
  product: {
    name: string
    slug: string
  }
  variant: {
    size: string
    color: string
    sku: string
  }
}

export interface AddressResponse {
  id: string
  fullName: string
  phone: string
  line1: string
  line2: string | null
  city: string
  province: string
  postalCode: string
  country: string
}

export interface PaymentResponse {
  id: string
  orderId: string
  provider: string
  providerPaymentId: string | null
  amount: number
  status: 'PENDING' | 'UNPAID' | 'PAID' | 'REFUNDED' | 'FAILED'
  createdAt: string
  updatedAt: string
}

/**
 * Customer API Types
 */
export interface CustomerResponse {
  id: string
  email: string | null
  phone: string | null
  name: string | null
  createdAt?: string
  updatedAt?: string
}

/**
 * Admin API Types
 */
export interface AdminLoginRequest {
  email: string
  password: string
}

export interface AdminSessionResponse {
  customer: {
    id: string
    email: string
    name: string | null
  }
}

export interface AdminStatsResponse {
  totalProducts: number
  totalOrders: number
  totalRevenue: number
  pendingOrders: number
  lowStockProducts: number
}

export interface AdminProductListResponse {
  products: ProductResponse[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface AdminOrderListResponse {
  orders: OrderResponse[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface AdminCustomerListResponse {
  customers: CustomerResponse[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

/**
 * Webhook Types
 */
export interface PayMongoWebhookPayload {
  data: {
    id: string
    type: string
    attributes: {
      type: string
      data: {
        id: string
        type: string
        attributes: {
          amount: number
          status: string
          [key: string]: any
        }
      }
      [key: string]: any
    }
  }
}
