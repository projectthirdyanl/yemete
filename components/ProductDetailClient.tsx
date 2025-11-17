'use client'

import { useState, useEffect, useMemo, useCallback, memo } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { formatPrice } from '@/lib/utils'
import { sanitizeHtmlForReact } from '@/lib/sanitize'
import ImageCarousel from './ImageCarousel'
import { Button, Badge } from '@/components/ui'
import { useAddToCart } from '@/hooks/useCart'
import { useToast } from '@/contexts/ToastContext'
import {
  CheckIcon,
  TruckIcon,
  ShieldCheckIcon,
  HeartIcon,
  ShareIcon,
} from '@heroicons/react/24/outline'
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid'

interface Variant {
  id: string
  size: string
  color: string
  price: number | string
  stockQuantity: number
  sku: string
}

interface ProductImage {
  id: string
  imageUrl: string
  color?: string | null
  isPrimary: boolean
}

interface Product {
  id: string
  name: string
  description: string
  brand: string
  images: ProductImage[]
  variants: Variant[]
}

interface ProductDetailClientProps {
  product: Product
}

const SIZES = ['S', 'M', 'L', 'XL', '2XL']

function ProductDetailClient({ product }: ProductDetailClientProps) {
  const [selectedSize, setSelectedSize] = useState<string>('')
  const [selectedColor, setSelectedColor] = useState<string>('')
  const [quantity, setQuantity] = useState(1)
  const [isWishlisted, setIsWishlisted] = useState(false)
  const addToCart = useAddToCart()
  const { success, error: showError } = useToast()

  const selectedVariant = useMemo(
    () => product.variants.find(v => v.size === selectedSize && v.color === selectedColor),
    [product.variants, selectedSize, selectedColor]
  )

  const availableSizes = useMemo(
    () =>
      Array.from(
        new Set(
          product.variants
            .filter(v => v.color === selectedColor && v.stockQuantity > 0)
            .map(v => v.size)
        )
      ),
    [product.variants, selectedColor]
  )

  // Get all colors that exist in variants (enabled in admin) - regardless of stock
  const enabledColors = useMemo(
    () => Array.from(new Set(product.variants.map(v => v.color))).sort(),
    [product.variants]
  )

  // Get all colors that have stock available (for any size)
  const availableColors = useMemo(
    () => Array.from(new Set(product.variants.filter(v => v.stockQuantity > 0).map(v => v.color))),
    [product.variants]
  )

  // Get colors available for selected size (used for size filtering)
  const availableColorsForSize = useMemo(
    () =>
      Array.from(
        new Set(
          product.variants
            .filter(v => v.size === selectedSize && v.stockQuantity > 0)
            .map(v => v.color)
        )
      ),
    [product.variants, selectedSize]
  )

  // Auto-select first available color and size on mount
  useEffect(() => {
    if (!selectedColor && product.variants.length > 0) {
      const firstAvailableColor = product.variants.find(v => v.stockQuantity > 0)?.color
      if (firstAvailableColor) {
        setSelectedColor(firstAvailableColor)
      }
    }
  }, [product.variants, selectedColor])

  useEffect(() => {
    if (selectedColor && !selectedSize && availableSizes.length > 0) {
      setSelectedSize(availableSizes[0])
    }
  }, [selectedColor, availableSizes, selectedSize])

  const handleAddToCart = useCallback(async () => {
    if (!selectedVariant) {
      showError('Please select size and color')
      return
    }

    if (selectedVariant.stockQuantity < quantity) {
      showError('Not enough stock available')
      return
    }

    try {
      await addToCart.mutateAsync({
        variantId: selectedVariant.id,
        quantity,
      })
      success(`Added ${quantity} ${quantity === 1 ? 'item' : 'items'} to cart!`)
      setQuantity(1) // Reset quantity after successful add
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add to cart'
      showError(errorMessage)
    }
  }, [selectedVariant, quantity, addToCart, success, showError])

  const stockStatus = useMemo(() => {
    if (!selectedVariant) {
      return { text: 'Select Size & Color', variant: 'default' as const }
    }
    if (selectedVariant.stockQuantity > 10) {
      return { text: 'In Stock', variant: 'success' as const }
    }
    if (selectedVariant.stockQuantity > 0) {
      return { text: 'Low Stock', variant: 'warning' as const }
    }
    return { text: 'Out of Stock', variant: 'error' as const }
  }, [selectedVariant])

  const handleShare = useCallback(async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: product.name,
          text: `Check out ${product.name} on Yametee!`,
          url: window.location.href,
        })
      } catch (err) {
        // User cancelled or error occurred
      }
    } else {
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(window.location.href)
        success('Link copied to clipboard!')
      } catch (err) {
        showError('Failed to copy link')
      }
    }
  }, [product.name, success, showError])

  return (
    <div className="max-w-7xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
        {/* Image Gallery with Carousel */}
        <div>
          <ImageCarousel
            images={product.images}
            selectedColor={selectedColor}
            productName={product.name}
          />
        </div>

        {/* Product Info */}
        <div className="space-y-6">
          {/* Brand & Title */}
          <div>
            <p className="text-yametee-red font-semibold text-sm uppercase tracking-wide mb-2">
              {product.brand}
            </p>
            <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-4">
              {product.name}
            </h1>

            {selectedVariant && (
              <div className="flex items-baseline gap-3 mt-4">
                <p className="text-4xl font-bold text-yametee-red">
                  {formatPrice(selectedVariant.price)}
                </p>
                <p className="text-gray-400 line-through text-xl">₱799</p>
                <span className="bg-yametee-red/20 text-yametee-red px-2 py-1 rounded text-sm font-semibold">
                  -25%
                </span>
              </div>
            )}
          </div>

          {/* Stock Status */}
          <div className="inline-flex items-center gap-2">
            <Badge variant={stockStatus.variant} size="md">
              <CheckIcon className="w-4 h-4 mr-1" aria-hidden="true" />
              {stockStatus.text}
              {selectedVariant && selectedVariant.stockQuantity > 0 && (
                <span className="ml-1 opacity-75">({selectedVariant.stockQuantity} available)</span>
              )}
            </Badge>
          </div>

          {/* Color Selection */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              Color:{' '}
              <span className="text-gray-600 dark:text-gray-400 font-normal">
                {selectedColor || 'Select'}
              </span>
            </h3>
            <div className="flex gap-3 flex-wrap">
              {enabledColors.map(color => {
                // Check if color has any variants (enabled in admin)
                const hasVariant = product.variants.some(v => v.color === color)
                // Check if color has stock available
                const hasStock = product.variants.some(
                  v => v.color === color && v.stockQuantity > 0
                )
                const isSelected = selectedColor === color

                return (
                  <button
                    key={color}
                    onClick={() => {
                      setSelectedColor(color)
                      if (!availableSizes.includes(selectedSize)) {
                        setSelectedSize('')
                      }
                    }}
                    disabled={!hasVariant}
                    className={`px-6 py-3 rounded-lg font-medium transition-all border-2 ${
                      isSelected
                        ? 'bg-yametee-red text-white border-yametee-red shadow-lg shadow-yametee-red/50'
                        : hasStock
                          ? 'bg-gray-100 dark:bg-yametee-gray text-gray-900 dark:text-white border-gray-300 dark:border-yametee-lightGray hover:border-yametee-red/50 hover:bg-gray-200 dark:hover:bg-yametee-lightGray'
                          : hasVariant
                            ? 'bg-gray-100 dark:bg-yametee-gray text-gray-900 dark:text-white border-gray-300 dark:border-yametee-lightGray opacity-75 hover:opacity-100'
                            : 'bg-gray-50 dark:bg-yametee-dark text-gray-400 dark:text-gray-500 border-gray-200 dark:border-yametee-gray cursor-not-allowed opacity-50'
                    }`}
                  >
                    {color}
                    {hasVariant && !hasStock && (
                      <span className="ml-2 text-xs opacity-75">(Out of Stock)</span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Size Selection */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              Size:{' '}
              <span className="text-gray-600 dark:text-gray-400 font-normal">
                {selectedSize || 'Select'}
              </span>
            </h3>
            <div className="flex gap-3 flex-wrap">
              {SIZES.map(size => {
                const isAvailable = selectedColor
                  ? availableSizes.includes(size)
                  : product.variants.some(v => v.size === size && v.stockQuantity > 0)
                const isSelected = selectedSize === size

                return (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    disabled={!isAvailable}
                    className={`w-14 h-14 rounded-lg font-semibold transition-all border-2 ${
                      isSelected
                        ? 'bg-yametee-red text-white border-yametee-red shadow-lg shadow-yametee-red/50'
                        : isAvailable
                          ? 'bg-gray-100 dark:bg-yametee-gray text-gray-900 dark:text-white border-gray-300 dark:border-yametee-lightGray hover:border-yametee-red/50 hover:bg-gray-200 dark:hover:bg-yametee-lightGray'
                          : 'bg-gray-50 dark:bg-yametee-dark text-gray-400 dark:text-gray-500 border-gray-200 dark:border-yametee-gray cursor-not-allowed opacity-50'
                    }`}
                  >
                    {size}
                  </button>
                )
              })}
            </div>
            <Link
              href="/size-guide"
              className="text-sm text-gray-600 dark:text-gray-400 hover:text-yametee-red mt-2 inline-block"
            >
              Size Guide
            </Link>
          </div>

          {/* Quantity */}
          {selectedVariant && selectedVariant.stockQuantity > 0 && (
            <div>
              <label className="block text-gray-900 dark:text-white mb-2 font-semibold">
                Quantity
              </label>
              <div className="flex items-center gap-4 w-fit">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-12 h-12 bg-gray-100 dark:bg-yametee-gray hover:bg-gray-200 dark:hover:bg-yametee-lightGray text-gray-900 dark:text-white rounded-lg font-bold transition-all border border-gray-300 dark:border-yametee-lightGray"
                >
                  −
                </button>
                <span className="text-gray-900 dark:text-white text-xl font-semibold w-12 text-center">
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity(Math.min(selectedVariant.stockQuantity, quantity + 1))}
                  className="w-12 h-12 bg-gray-100 dark:bg-yametee-gray hover:bg-gray-200 dark:hover:bg-yametee-lightGray text-gray-900 dark:text-white rounded-lg font-bold transition-all border border-gray-300 dark:border-yametee-lightGray"
                >
                  +
                </button>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-4 pt-4">
            <Button
              onClick={handleAddToCart}
              disabled={
                !selectedVariant || selectedVariant.stockQuantity === 0 || addToCart.isPending
              }
              variant="default"
              size="lg"
              className="flex-1 w-full"
            >
              {addToCart.isPending ? 'Adding...' : 'Add to Cart'}
            </Button>
            <Button
              onClick={() => setIsWishlisted(!isWishlisted)}
              variant={isWishlisted ? 'default' : 'outline'}
              size="lg"
              className="w-14 h-14 p-0"
              aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
            >
              {isWishlisted ? (
                <HeartSolidIcon className="w-6 h-6" aria-hidden="true" />
              ) : (
                <HeartIcon className="w-6 h-6" aria-hidden="true" />
              )}
            </Button>
            <Button
              onClick={handleShare}
              variant="outline"
              size="lg"
              className="w-14 h-14 p-0"
              aria-label="Share product"
            >
              <ShareIcon className="w-6 h-6" aria-hidden="true" />
            </Button>
          </div>

          {/* Product Features */}
          <div className="grid grid-cols-3 gap-4 pt-6 border-t border-gray-200 dark:border-yametee-lightGray">
            <div className="flex flex-col items-center text-center">
              <TruckIcon className="w-8 h-8 text-yametee-red mb-2" />
              <p className="text-sm font-semibold text-gray-900 dark:text-white">Free Shipping</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">Over ₱1,000</p>
            </div>
            <div className="flex flex-col items-center text-center">
              <ShieldCheckIcon className="w-8 h-8 text-yametee-red mb-2" />
              <p className="text-sm font-semibold text-gray-900 dark:text-white">Secure Payment</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">100% Protected</p>
            </div>
            <div className="flex flex-col items-center text-center">
              <CheckIcon className="w-8 h-8 text-yametee-red mb-2" />
              <p className="text-sm font-semibold text-gray-900 dark:text-white">Easy Returns</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">7 Days Return</p>
            </div>
          </div>

          {/* Description */}
          {product.description && (
            <div className="pt-6 border-t border-gray-200 dark:border-yametee-lightGray">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Product Details
              </h3>
              <div
                className="text-gray-700 dark:text-gray-300 prose prose-invert dark:prose-invert max-w-none prose-headings:text-gray-900 dark:prose-headings:text-white prose-p:text-gray-700 dark:prose-p:text-gray-300 prose-strong:text-gray-900 dark:prose-strong:text-white"
                dangerouslySetInnerHTML={sanitizeHtmlForReact(product.description)}
              />
            </div>
          )}

          {/* Additional Info */}
          <div className="pt-6 border-t border-gray-200 dark:border-yametee-lightGray space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">SKU</span>
              <span className="text-gray-900 dark:text-white font-semibold">
                {selectedVariant?.sku || 'N/A'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Material</span>
              <span className="text-gray-900 dark:text-white font-semibold">100% Cotton</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Care Instructions</span>
              <span className="text-gray-900 dark:text-white font-semibold">Machine Wash Cold</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default memo(ProductDetailClient)
