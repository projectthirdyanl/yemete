import Link from 'next/link'

const footerColumns = [
  {
    title: 'Shop',
    links: [
      { label: 'All Products', href: '/products' },
      { label: 'Latest Drops', href: '/drops' },
      { label: 'Size Guide', href: '/size-guide' },
      { label: 'Gift Cards', href: '/contact' },
    ],
  },
  {
    title: 'Support',
    links: [
      { label: 'Shipping & Delivery', href: '/shipping' },
      { label: 'Returns & Exchanges', href: '/returns' },
      { label: 'FAQ', href: '/faq' },
      { label: 'Contact', href: '/contact' },
    ],
  },
  {
    title: 'Studio',
    links: [
      { label: 'About Yametee', href: '/about' },
      { label: 'Journal', href: '/about' },
      { label: 'Careers', href: '/contact' },
      { label: 'Wholesale', href: '/contact' },
    ],
  },
]

const socialLinks = [
  { label: 'Instagram', href: 'https://instagram.com', handle: '@yametee.studio' },
  { label: 'TikTok', href: 'https://tiktok.com', handle: '@yameteeph' },
  { label: 'Spotify', href: 'https://spotify.com', handle: 'Yametee Radio' },
]

export default function Footer() {
  return (
    <footer className="bg-[var(--yametee-card)] dark:bg-yametee-gray/60 border-t border-yametee-border mt-20 backdrop-blur-xl shadow-[0_15px_70px_rgba(0,0,0,0.05)] dark:shadow-none">
      <div className="container mx-auto px-4 py-12 lg:py-16">
        <div className="grid gap-10 lg:gap-16 lg:grid-cols-[2fr,1fr,1fr,1fr]">
          <div>
            <p className="tag-pill text-yametee-muted dark:text-white/70 mb-4">YAMETEE CLOTHING</p>
            <p className="font-heading text-3xl text-yametee-foreground dark:text-white max-w-sm leading-tight">
              Anime-inspired streetwear engineered for Manila humidity.
            </p>
            <p className="text-sm text-yametee-muted dark:text-white/70 mt-4 max-w-md">
              Built in small batches, printed by hand, delivered nationwide. Follow the studio for new silhouettes,
              collaborations, and playlists straight from our Mandaluyong lab.
            </p>
            <div className="flex flex-wrap gap-3 mt-6">
              {socialLinks.map((social) => (
                <Link
                  key={social.label}
                  href={social.href}
                  className="flex flex-col bg-yametee-lightGray/50 dark:bg-yametee-lightGray/40 border border-yametee-border px-4 py-3 rounded-xl text-xs uppercase tracking-[0.3em] text-yametee-muted dark:text-white/70 hover:text-yametee-foreground dark:hover:text-white transition-all"
                >
                  {social.label}
                  <span className="text-sm font-semibold tracking-tight text-yametee-foreground dark:text-white">
                    {social.handle}
                  </span>
                </Link>
              ))}
          </div>
          </div>

          {footerColumns.map((column) => (
            <div key={column.title}>
              <p className="text-xs uppercase tracking-[0.4em] text-yametee-muted dark:text-white/60 mb-4">{column.title}</p>
            <ul className="space-y-2">
                {column.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-yametee-muted dark:text-white/70 hover:text-yametee-foreground dark:hover:text-white transition-colors tracking-wide"
                    >
                      {link.label}
                </Link>
              </li>
                ))}
            </ul>
          </div>
          ))}
        </div>

        <div className="border-t border-yametee-border mt-12 pt-6 flex flex-col md:flex-row justify-between items-start gap-4 text-sm text-yametee-muted dark:text-white/60">
          <p>© {new Date().getFullYear()} Yametee Studio. All rights reserved.</p>
          <p className="uppercase tracking-[0.4em] text-xs text-yametee-muted dark:text-white/60">
            MANILA / TOKYO / ONLINE
          </p>
        </div>
      </div>
    </footer>
  )
}
