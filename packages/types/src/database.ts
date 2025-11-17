/**
 * Database Types
 * Re-export Prisma types and create helper types for common queries
 */

// Re-export Prisma types (these will be available after Prisma generates)
// Note: Prisma types are generated at runtime, so we use type imports
import type {
  Product,
  Variant,
  ProductImage,
  Customer,
  Address,
  Order,
  OrderItem,
  Payment,
  Cart,
  CartItem,
  ProductStatus,
  OrderStatus,
  PaymentStatus,
  Prisma,
} from '@prisma/client'

export type {
  Product,
  Variant,
  ProductImage,
  Customer,
  Address,
  Order,
  OrderItem,
  Payment,
  Cart,
  CartItem,
  ProductStatus,
  OrderStatus,
  PaymentStatus,
}

/**
 * Prisma helper types for common query patterns
 */
export type ProductWithRelations = Prisma.ProductGetPayload<{
  include: {
    images: true
    variants: true
  }
}>

export type ProductWithImages = Prisma.ProductGetPayload<{
  include: {
    images: true
  }
}>

export type VariantWithProduct = Prisma.VariantGetPayload<{
  include: {
    product: {
      include: {
        images: true
      }
    }
  }
}>

export type OrderWithRelations = Prisma.OrderGetPayload<{
  include: {
    items: {
      include: {
        product: {
          select: {
            id: true
            name: true
            slug: true
          }
        }
        variant: {
          select: {
            id: true
            size: true
            color: true
            sku: true
          }
        }
      }
    }
    address: true
    customer: {
      select: {
        id: true
        name: true
        email: true
        phone: true
      }
    }
    payments: {
      orderBy: {
        createdAt: 'desc'
      }
    }
  }
}>

export type CartWithRelations = Prisma.CartGetPayload<{
  include: {
    items: {
      include: {
        product: {
          include: {
            images: true
          }
        }
        variant: true
      }
    }
    customer: {
      select: {
        id: true
        email: true
        name: true
      }
    }
  }
}>

export type CartItemWithProduct = Prisma.CartItemGetPayload<{
  include: {
    product: {
      include: {
        images: true
      }
    }
    variant: true
  }
}>

export type CustomerWithOrders = Prisma.CustomerGetPayload<{
  include: {
    orders: {
      include: {
        items: {
          include: {
            product: true
            variant: true
          }
        }
      }
      orderBy: {
        createdAt: 'desc'
      }
    }
  }
}>

/**
 * Database query input types
 */
export type CreateProductInput = Prisma.ProductCreateInput
export type UpdateProductInput = Prisma.ProductUpdateInput
export type CreateVariantInput = Prisma.VariantCreateInput
export type UpdateVariantInput = Prisma.VariantUpdateInput
export type CreateOrderInput = Prisma.OrderCreateInput
export type UpdateOrderInput = Prisma.OrderUpdateInput
export type CreateCartInput = Prisma.CartCreateInput
export type CreateCartItemInput = Prisma.CartItemCreateInput
