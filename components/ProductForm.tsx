'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { slugify } from '@/lib/utils'

const SIZES = ['S', 'M', 'L', 'XL', '2XL']
const COLORS = ['Navy Blue', 'Black', 'Gray', 'White', 'Red', 'Khaki']

interface Variant {
  id?: string
  size: string
  color: string
  sku: string
  price: string
  stockQuantity: number
}

interface ProductImage {
  id?: string
  imageUrl: string
  color?: string | null
  isPrimary: boolean
  position: number
}

interface Product {
  id: string
  name: string
  slug: string
  description: string
  status: string
  isFeatured: boolean
  isDrop: boolean
  isStandard: boolean
  images: ProductImage[]
  variants: Variant[]
}

interface ProductFormProps {
  product?: Product
}

type PlacementKey = 'isFeatured' | 'isDrop' | 'isStandard'

type FormState = {
  name: string
  slug: string
  description: string
  status: string
  isFeatured: boolean
  isDrop: boolean
  isStandard: boolean
}

const PLACEMENT_OPTIONS: Array<{
  key: PlacementKey
  title: string
  description: string
}> = [
  {
    key: 'isFeatured',
    title: 'Featured',
    description: 'Spotlight this design on the homepage featured grid.',
  },
  {
    key: 'isDrop',
    title: 'Drops',
    description: 'Limited releases that appear on the Drops page & announcements.',
  },
  {
    key: 'isStandard',
    title: 'Shop Tees',
    description: 'Evergreen designs listed under Shop Tees on the store.',
  },
]

export default function ProductForm({ product }: ProductFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<FormState>({
    name: product?.name || '',
    slug: product?.slug || '',
    description: product?.description || '',
    status: product?.status || 'DRAFT',
    isFeatured: product?.isFeatured ?? false,
    isDrop: product?.isDrop ?? false,
    isStandard: product?.isStandard ?? true,
  })
  // Get unique colors from existing variants
  const getUniqueColors = (variants: Variant[]) => {
    return [...new Set(variants.map(v => v.color))]
  }

  // Get sizes for a specific color from existing variants
  const getSizesForColor = (variants: Variant[], color: string) => {
    return [...new Set(variants.filter(v => v.color === color).map(v => v.size))]
  }

  // Initialize color-to-sizes mapping from existing variants
  const initializeColorSizes = (variants: Variant[]) => {
    const colorSizesMap: Record<string, string[]> = {}
    const colors = getUniqueColors(variants)
    colors.forEach(color => {
      colorSizesMap[color] = getSizesForColor(variants, color)
    })
    return colorSizesMap
  }

  const [selectedColors, setSelectedColors] = useState<string[]>(
    product?.variants ? getUniqueColors(product.variants) : []
  )
  // Map each color to its available sizes
  const [colorSizesMap, setColorSizesMap] = useState<Record<string, string[]>>(
    product?.variants ? initializeColorSizes(product.variants) : {}
  )
  const [variants, setVariants] = useState<Variant[]>(product?.variants || [])
  const [images, setImages] = useState<ProductImage[]>(product?.images || [])

  const handlePlacementToggle = (key: PlacementKey) => {
    setFormData(prev => ({
      ...prev,
      [key]: !prev[key],
    }))
  }

  useEffect(() => {
    if (!product && formData.name) {
      setFormData(prev => ({
        ...prev,
        slug: slugify(formData.name),
      }))
    }
  }, [formData.name, product])

  // Generate variants based on color-specific size selections
  useEffect(() => {
    if (selectedColors.length > 0) {
      setVariants(currentVariants => {
        const variantMap = new Map<string, Variant>()

        // Generate variants based on color-specific sizes
        selectedColors.forEach(color => {
          const sizesForColor = colorSizesMap[color] || []
          sizesForColor.forEach(size => {
            const key = `${size}-${color}`
            // Check if variant already exists in current variants
            const existingVariant = currentVariants.find(v => v.size === size && v.color === color)

            if (existingVariant) {
              // Preserve existing variant with all its data (price, stock, SKU, etc.)
              variantMap.set(key, existingVariant)
            } else {
              // Create new variant if it doesn't exist
              const sku = `${formData.slug.toUpperCase().slice(0, 5)}-${size}-${color.slice(0, 3).toUpperCase()}`
              variantMap.set(key, {
                size,
                color,
                sku,
                price: currentVariants[0]?.price || '599',
                stockQuantity: 0,
              })
            }
          })
        })

        // Return variants in a consistent order (sorted by color, then size)
        return Array.from(variantMap.values()).sort((a, b) => {
          if (a.color !== b.color) {
            return a.color.localeCompare(b.color)
          }
          const sizeOrder = ['S', 'M', 'L', 'XL', '2XL']
          return sizeOrder.indexOf(a.size) - sizeOrder.indexOf(b.size)
        })
      })
    } else {
      // If no colors selected, clear variants
      setVariants([])
    }
  }, [selectedColors, colorSizesMap, formData.slug])

  // Handle color selection/deselection
  const handleColorToggle = (color: string) => {
    if (selectedColors.includes(color)) {
      // Remove color and its size mappings
      setSelectedColors(selectedColors.filter(c => c !== color))
      setColorSizesMap(prev => {
        const newMap = { ...prev }
        delete newMap[color]
        return newMap
      })
    } else {
      // Add color with empty sizes (user will select sizes)
      setSelectedColors([...selectedColors, color])
      setColorSizesMap(prev => ({
        ...prev,
        [color]: [],
      }))
    }
  }

  // Handle size toggle for a specific color
  const handleSizeToggleForColor = (color: string, size: string) => {
    setColorSizesMap(prev => {
      const currentSizes = prev[color] || []
      const newSizes = currentSizes.includes(size)
        ? currentSizes.filter(s => s !== size)
        : [...currentSizes, size]

      return {
        ...prev,
        [color]: newSizes,
      }
    })
  }

  const handleImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    color?: string | null
  ) => {
    const files = e.target.files
    if (!files) return

    // Reset the input so the same file can be selected again
    e.target.value = ''

    // In production, upload to cloud storage (S3, Cloudinary, etc.)
    // For now, we'll use data URLs
    const fileArray = Array.from(files)
    const newImages: ProductImage[] = []

    // Process all files
    const promises = fileArray.map(file => {
      return new Promise<ProductImage>(resolve => {
        const reader = new FileReader()
        reader.onload = event => {
          const imageUrl = event.target?.result as string
          resolve({
            imageUrl,
            color: color || null,
            isPrimary: false, // Will be set below
            position: 0, // Will be set below
          })
        }
        reader.readAsDataURL(file)
      })
    })

    // Wait for all files to be read
    const loadedImages = await Promise.all(promises)

    // Use functional state update to avoid race conditions
    setImages(currentImages => {
      // Check for duplicates by comparing imageUrl
      const existingUrls = new Set(currentImages.map(img => img.imageUrl))
      const uniqueNewImages = loadedImages.filter(img => !existingUrls.has(img.imageUrl))

      if (uniqueNewImages.length === 0) {
        return currentImages // No new images to add
      }

      // Set positions and primary flag
      const updatedNewImages = uniqueNewImages.map((img, index) => ({
        ...img,
        position: currentImages.length + index,
        isPrimary: currentImages.length === 0 && index === 0, // First image is primary if no images exist
      }))

      return [...currentImages, ...updatedNewImages]
    })
  }

  const handleBulkPriceUpdate = (price: string) => {
    setVariants(variants.map(v => ({ ...v, price })))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.isDrop && !formData.isStandard) {
      alert('Select at least one store placement (Drops or Shop Tees)')
      return
    }
    setLoading(true)

    try {
      const payload = {
        ...formData,
        images,
        variants,
      }

      const url = product ? `/api/admin/products/${product.id}` : '/api/admin/products'
      const method = product ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to save product')
      }

      router.push('/admin/products')
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to save product'
      alert(errorMessage)
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Basic Info */}
      <div className="bg-white dark:bg-yametee-gray border border-gray-200 dark:border-gray-700 rounded-lg p-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Basic Information</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-gray-900 dark:text-white mb-2">Product Name *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              className="w-full bg-white dark:bg-yametee-dark border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-yametee-red focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-gray-900 dark:text-white mb-2">Slug *</label>
            <input
              type="text"
              required
              value={formData.slug}
              onChange={e => setFormData({ ...formData, slug: e.target.value })}
              className="w-full bg-white dark:bg-yametee-dark border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-yametee-red focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-gray-900 dark:text-white mb-2">Description</label>
            <textarea
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              rows={6}
              className="w-full bg-white dark:bg-yametee-dark border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-yametee-red focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-gray-900 dark:text-white mb-2">Status</label>
            <select
              value={formData.status}
              onChange={e => setFormData({ ...formData, status: e.target.value })}
              className="w-full bg-white dark:bg-yametee-dark border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-yametee-red focus:border-transparent"
            >
              <option value="DRAFT">Draft</option>
              <option value="ACTIVE">Active</option>
              <option value="HIDDEN">Hidden</option>
            </select>
          </div>
          <div>
            <label className="block text-gray-900 dark:text-white mb-2">Store Placement</label>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Choose where this product should appear across the storefront. Combine options as
              needed.
            </p>
            <div className="grid gap-4 md:grid-cols-3">
              {PLACEMENT_OPTIONS.map(option => {
                const isActive = formData[option.key]
                return (
                  <button
                    key={option.key}
                    type="button"
                    aria-pressed={isActive}
                    onClick={() => handlePlacementToggle(option.key)}
                    className={`w-full text-left border rounded-xl p-4 transition-all ${
                      isActive
                        ? 'border-yametee-red bg-yametee-red/5 shadow-[0_0_0_1px_rgba(229,9,20,0.4)]'
                        : 'border-gray-200 dark:border-gray-700 hover:border-yametee-red/60'
                    }`}
                  >
                    <span
                      className={`block text-lg font-semibold mb-2 ${
                        isActive ? 'text-yametee-red' : 'text-gray-900 dark:text-white'
                      }`}
                    >
                      {option.title}
                    </span>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {option.description}
                    </span>
                  </button>
                )
              })}
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-3">
              Select <span className="font-semibold">Drops</span> for limited releases and{' '}
              <span className="font-semibold">Shop Tees</span> for standard shirts. Use{' '}
              <span className="font-semibold">Featured</span> to highlight the item on the main
              site.
            </p>
            {!formData.isDrop && !formData.isStandard && (
              <p className="text-sm text-yellow-600 dark:text-yellow-400 mt-2">
                Select either Drops or Shop Tees so customers can discover this product.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Images */}
      <div className="bg-white dark:bg-yametee-gray border border-gray-200 dark:border-gray-700 rounded-lg p-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Product Images</h2>

        {/* General Images (for all colors) */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
            General Images (All Colors)
          </h3>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={e => handleImageUpload(e, null)}
            className="mb-4 text-gray-900 dark:text-white bg-white dark:bg-yametee-dark border border-gray-300 dark:border-gray-600 rounded-lg p-2"
          />
        </div>

        {/* Color-Specific Images */}
        {selectedColors.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
              Color-Specific Images
            </h3>
            <div className="space-y-4">
              {selectedColors.map(color => {
                const colorImages = images.filter(img => img.color === color)
                return (
                  <div
                    key={color}
                    className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
                  >
                    <h4 className="text-gray-900 dark:text-white font-medium mb-2">
                      {color} Color Images
                    </h4>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={e => handleImageUpload(e, color)}
                      className="mb-3 text-gray-900 dark:text-white bg-white dark:bg-yametee-dark border border-gray-300 dark:border-gray-600 rounded-lg p-2 w-full"
                    />
                    {colorImages.length > 0 && (
                      <div className="grid grid-cols-4 gap-2 mt-3">
                        {colorImages.map((image, idx) => {
                          const globalIndex = images.findIndex(img => img === image)
                          return (
                            <div key={idx} className="relative">
                              <img
                                src={image.imageUrl}
                                alt={`${color} ${idx + 1}`}
                                className="w-full aspect-square object-cover rounded-lg border-2 border-gray-300 dark:border-gray-600"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  setImages(currentImages =>
                                    currentImages.filter(img => img.imageUrl !== image.imageUrl)
                                  )
                                }}
                                className="absolute top-1 right-1 bg-yametee-red text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                              >
                                ×
                              </button>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* All Images Preview */}
        {images.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
              All Images Preview
            </h3>
            <div className="grid grid-cols-4 gap-4">
              {images.map((image, index) => (
                <div key={index} className="relative">
                  <img
                    src={image.imageUrl}
                    alt={`Product ${index + 1}`}
                    className="w-full aspect-square object-cover rounded-lg border-2 border-gray-300 dark:border-gray-600"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setImages(currentImages => currentImages.filter((_, i) => i !== index))
                    }}
                    className="absolute top-2 right-2 bg-yametee-red text-white rounded-full w-6 h-6 flex items-center justify-center text-xs"
                  >
                    ×
                  </button>
                  <div className="absolute bottom-2 left-2 flex gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        setImages(currentImages =>
                          currentImages.map((img, i) => ({
                            ...img,
                            isPrimary: i === index,
                          }))
                        )
                      }}
                      className={`px-2 py-1 rounded text-xs ${
                        image.isPrimary
                          ? 'bg-yametee-red text-white'
                          : 'bg-gray-600 dark:bg-gray-800 text-white'
                      }`}
                    >
                      Primary
                    </button>
                    {image.color && (
                      <span className="px-2 py-1 bg-gray-600 dark:bg-gray-800 text-white rounded text-xs">
                        {image.color}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Variants */}
      <div className="bg-white dark:bg-yametee-gray border border-gray-200 dark:border-gray-700 rounded-lg p-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Variants</h2>

        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
            Select Colors
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
            Select colors first, then choose available sizes for each color
          </p>
          <div className="flex gap-2 flex-wrap">
            {COLORS.map(color => (
              <button
                key={color}
                type="button"
                onClick={() => handleColorToggle(color)}
                className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                  selectedColors.includes(color)
                    ? 'bg-yametee-red text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {color}
              </button>
            ))}
          </div>
        </div>

        {/* Per-Color Size Selection */}
        {selectedColors.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
              Select Sizes for Each Color
            </h3>
            <div className="space-y-4">
              {selectedColors.map(color => {
                const sizesForColor = colorSizesMap[color] || []
                return (
                  <div
                    key={color}
                    className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
                  >
                    <h4 className="text-gray-900 dark:text-white font-medium mb-3">
                      {color} - Available Sizes
                    </h4>
                    <div className="flex gap-2 flex-wrap">
                      {SIZES.map(size => (
                        <button
                          key={size}
                          type="button"
                          onClick={() => handleSizeToggleForColor(color, size)}
                          className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                            sizesForColor.includes(size)
                              ? 'bg-yametee-red text-white'
                              : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-600'
                          }`}
                        >
                          {size}
                        </button>
                      ))}
                    </div>
                    {sizesForColor.length === 0 && (
                      <p className="text-sm text-yellow-600 dark:text-yellow-400 mt-2">
                        ⚠️ No sizes selected for {color}. Variants will not be created for this
                        color.
                      </p>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {variants.length > 0 && (
          <>
            <div className="mb-4">
              <label className="block text-gray-900 dark:text-white mb-2">Bulk Set Price</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder="599"
                  className="bg-white dark:bg-yametee-dark border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-yametee-red focus:border-transparent"
                  onBlur={e => {
                    if (e.target.value) {
                      handleBulkPriceUpdate(e.target.value)
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={e => {
                    const input = e.currentTarget.previousElementSibling as HTMLInputElement
                    if (input.value) {
                      handleBulkPriceUpdate(input.value)
                    }
                  }}
                  className="bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white px-4 py-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
                >
                  Apply to All
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left p-2 text-gray-900 dark:text-white">Size</th>
                    <th className="text-left p-2 text-gray-900 dark:text-white">Color</th>
                    <th className="text-left p-2 text-gray-900 dark:text-white">SKU</th>
                    <th className="text-left p-2 text-gray-900 dark:text-white">Price</th>
                    <th className="text-left p-2 text-gray-900 dark:text-white">Stock</th>
                  </tr>
                </thead>
                <tbody>
                  {variants.map((variant, index) => (
                    <tr key={index} className="border-b border-gray-200 dark:border-gray-700">
                      <td className="p-2 text-gray-900 dark:text-white">{variant.size}</td>
                      <td className="p-2 text-gray-900 dark:text-white">{variant.color}</td>
                      <td className="p-2">
                        <input
                          type="text"
                          value={variant.sku}
                          onChange={e => {
                            const newVariants = [...variants]
                            newVariants[index].sku = e.target.value
                            setVariants(newVariants)
                          }}
                          className="w-full bg-white dark:bg-yametee-dark border border-gray-300 dark:border-gray-600 rounded px-2 py-1 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-yametee-red focus:border-transparent"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="number"
                          value={variant.price}
                          onChange={e => {
                            const newVariants = [...variants]
                            newVariants[index].price = e.target.value
                            setVariants(newVariants)
                          }}
                          className="w-full bg-white dark:bg-yametee-dark border border-gray-300 dark:border-gray-600 rounded px-2 py-1 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-yametee-red focus:border-transparent"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="number"
                          value={variant.stockQuantity}
                          onChange={e => {
                            const newVariants = [...variants]
                            newVariants[index].stockQuantity = parseInt(e.target.value) || 0
                            setVariants(newVariants)
                          }}
                          className="w-full bg-white dark:bg-yametee-dark border border-gray-300 dark:border-gray-600 rounded px-2 py-1 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-yametee-red focus:border-transparent"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      <div className="flex gap-4">
        <button
          type="submit"
          disabled={loading}
          className="bg-yametee-red text-white px-6 py-3 rounded-lg font-semibold hover:bg-yametee-red/90 transition-all disabled:bg-gray-300 dark:disabled:bg-gray-700 disabled:text-gray-500 dark:disabled:text-gray-400 disabled:cursor-not-allowed"
        >
          {loading ? 'Saving...' : product ? 'Update Product' : 'Create Product'}
        </button>
        <button
          type="button"
          onClick={() => router.push('/admin/products')}
          className="bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white px-6 py-3 rounded-lg font-semibold hover:bg-gray-200 dark:hover:bg-gray-600 transition-all"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}
