'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import ThemeToggle from './ThemeToggle'
import AnnouncementBar from './AnnouncementBar'
import Logo from './Logo'
import { usePathname } from 'next/navigation'

export default function Header() {
  const [cartCount, setCartCount] = useState(0)
  const pathname = usePathname()

  useEffect(() => {
    const updateCartCount = async () => {
      try {
        const response = await fetch('/api/cart/count')
        const data = await response.json()
        if (response.ok) {
          setCartCount(data.count || 0)
        }
      } catch (error) {
        console.error('Failed to get cart count:', error)
        setCartCount(0)
      }
    }

    updateCartCount()
    const handleCartUpdate = () => {
      updateCartCount()
    }
    window.addEventListener('cartUpdated', handleCartUpdate)
    return () => window.removeEventListener('cartUpdated', handleCartUpdate)
  }, [])

  const navLinks = [
    { href: '/products', label: 'Shop All' },
    { href: '/drops', label: 'Drops' },
    { href: '/about', label: 'Story' },
    { href: '/faq', label: 'FAQ' },
    { href: '/contact', label: 'Support' },
  ]

  const metaLinks = [
    { label: 'Drop 07 / BLOOM CORE', value: 'Ships 3.01' },
    { label: 'Studio', value: 'Manila, PH' },
    { label: 'Shipping', value: 'Nationwide 2-3 days' },
  ]

  return (
    <>
      <AnnouncementBar />
      
      <div className="bg-yametee-lightGray/40 border-b border-yametee-border backdrop-blur-sm">
        <div className="container mx-auto px-4 py-2 text-[11px] md:text-xs uppercase tracking-[0.35em] text-yametee-muted flex flex-wrap gap-4 justify-center">
          {metaLinks.map((meta) => (
            <span key={meta.label} className="flex items-center gap-2 text-yametee-muted">
              <span className="font-semibold text-yametee-foreground">{meta.label}</span>
            <span className="text-yametee-red">•</span>
              <span className="text-yametee-foreground/80">{meta.value}</span>
            </span>
          ))}
        </div>
      </div>

      <header className="sticky top-0 z-50 bg-yametee-bg/85 backdrop-blur-xl border-b border-yametee-border">
        <nav className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-6">
            <Link href="/" className="flex items-center gap-3 group">
              <Logo size="default" />
              <div className="hidden lg:block text-[10px] uppercase tracking-[0.5em] text-yametee-muted">
                <p className="group-hover:text-yametee-red transition-colors">YAMETEE STUDIO</p>
                <p className="tracking-[0.3em]">MANILA</p>
              </div>
            </Link>
            
            <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full border border-yametee-border text-[11px] uppercase tracking-[0.3em] text-yametee-muted">
              <span className="text-yametee-red">●</span> core drop shipping now
            </div>

            <div className="flex items-center gap-3">
              <ThemeToggle />
              <Link
                href="/cart"
                className="relative flex items-center gap-2 px-4 py-2 rounded-full border border-yametee-border text-xs font-semibold tracking-[0.2em] uppercase text-yametee-foreground hover:border-yametee-red transition-all"
              >
                Cart
                {cartCount > 0 && (
                  <span className="inline-flex items-center justify-center w-5 h-5 text-[10px] rounded-full bg-yametee-red text-white font-bold">
                    {cartCount}
                  </span>
                )}
              </Link>
              <Link
                href="/products"
                className="hidden lg:inline-flex items-center gap-2 px-5 py-2 rounded-full bg-yametee-red text-white text-xs font-semibold tracking-[0.3em] uppercase hover:bg-yametee-redDark transition-all"
              >
                Shop
              </Link>
            </div>
          </div>

          <div className="mt-4 hidden md:flex items-center justify-center gap-1">
              {navLinks.map((link) => {
                const isProductsLink = link.href === '/products'
                const isDropsLink = link.href === '/drops'
                const isActive =
                  pathname === link.href ||
                  (isProductsLink && pathname?.startsWith('/products')) ||
                  (isDropsLink && pathname?.startsWith('/drops'))
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                  className={`px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] rounded-full transition-all ${
                    isActive
                      ? 'text-yametee-red border border-yametee-red/60 bg-yametee-lightGray/40'
                      : 'text-yametee-muted hover:text-yametee-foreground hover:border-yametee-border border border-transparent'
                  }`}
                  >
                    {link.label}
                  </Link>
                )
              })}
            </div>
            
          <div className="md:hidden mt-4 pb-2 flex items-center gap-3 overflow-x-auto scrollbar-hide">
            {navLinks.map((link) => {
              const isProductsLink = link.href === '/products'
              const isDropsLink = link.href === '/drops'
              const isActive =
                pathname === link.href ||
                (isProductsLink && pathname?.startsWith('/products')) ||
                (isDropsLink && pathname?.startsWith('/drops'))
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-3 py-1.5 text-[11px] uppercase tracking-[0.3em] rounded-full border ${
                    isActive
                      ? 'text-yametee-red border-yametee-red/60'
                      : 'text-yametee-muted border-yametee-border hover:text-yametee-foreground'
                  }`}
                >
                  {link.label}
                </Link>
              )
            })}
          </div>
        </nav>
      </header>
    </>
  )
}
