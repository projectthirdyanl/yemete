import Link from 'next/link'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import EmailSignup from '@/components/EmailSignup'
import { prisma } from '@/lib/prisma'
import { formatPrice } from '@/lib/utils'

const heroStats = [
  { label: 'Fabric', value: '240 GSM' },
  { label: 'Runs', value: '100 pcs' },
  { label: 'Ship time', value: '2-3 days' },
]

const capsuleHighlights = [
  {
    title: 'Drop 07 / Bloom Core',
    description:
      'Hand-sketched blossoms meet Neo-Tokyo typography. Every tee is numbered & heat-sealed.',
    status: 'Ships March 01',
    tag: 'New Drop',
  },
  {
    title: 'Studio Uniform Program',
    description:
      'Daily staples in oxidized blacks + bone white. Oversized, pre-shrunk, zero crack prints.',
    status: 'Restock weekly',
    tag: 'Core',
  },
  {
    title: 'Community Nights',
    description: 'Monthly print jams and playlist swaps with Manila creatives. RSVP via Discord.',
    status: 'Next: Mar 14',
    tag: 'Events',
  },
]

const collectionCards = [
  {
    title: 'Staple Program',
    copy: 'Boxy tees built for humidity. Monochrome palette, year-round restocks.',
    href: '/products',
    accent: 'from-[#1f1f21] via-[#121214] to-[#0b0b0d]',
  },
  {
    title: 'Limited Drops',
    copy: 'Small-batch graphics inspired by anime arcs and Manila nights. Never reprinted.',
    href: '/drops',
    accent: 'from-[#2b0b0e] via-[#1a0507] to-[#0b0b0d]',
  },
  {
    title: 'Collaborations',
    copy: 'Artist-led capsules with local illustrators & graffiti writers. Signed and numbered.',
    href: '/about',
    accent: 'from-[#101c2b] via-[#0b0f18] to-[#060608]',
  },
]

const lookbookStories = [
  {
    title: 'Concrete Bloom',
    location: 'BGC // Rooftops',
    note: 'S/S lookbook shot on film by @keisukee',
  },
  {
    title: 'Midnight Commute',
    location: 'EDSA // Ortigas',
    note: 'Motion blur experiments w/ 35mm pushed 2 stops.',
  },
  {
    title: 'Heatwave Radio',
    location: 'Mandaluyong // Studio',
    note: 'Analog press run + playlist recording session.',
  },
]

const studioStories = [
  {
    title: 'Studio Log 032: Bloom Core Process',
    summary:
      'From pencil sketch to four-color pull. We break down the layering and inks we obsessed over.',
    date: 'March 02',
  },
  {
    title: 'Fabric Lab Notes',
    summary: 'Testing new 260 GSM jersey with breathable side panels for peak Manila summer.',
    date: 'February 21',
  },
  {
    title: 'Community Dispatch',
    summary: 'A recap of last month’s screen-print jam + Spotify radio selects from the crew.',
    date: 'February 11',
  },
]

async function getFeaturedProducts() {
  try {
    const products = await prisma.product.findMany({
      where: { status: 'ACTIVE', isFeatured: true },
      include: {
        images: {
          orderBy: [{ isPrimary: 'desc' }, { position: 'asc' }],
          take: 2,
        },
        variants: {
          orderBy: { price: 'asc' },
          take: 1,
        },
      },
      take: 6,
      orderBy: { createdAt: 'desc' },
    })
    return products
  } catch (error) {
    console.error('Error fetching products:', error)
    return []
  }
}

export default async function Home() {
  const products = await getFeaturedProducts()
  const spotlightProducts = products.slice(0, 4)

  return (
    <div className="min-h-screen flex flex-col bg-yametee-bg">
      <Header />

      <main className="flex-1">
        <section className="relative overflow-hidden py-16 md:py-20 px-4">
          <div className="absolute inset-0 opacity-30 blur-3xl bg-gradient-to-br from-[#ff3b30]/20 via-transparent to-transparent pointer-events-none" />
          <div className="container mx-auto relative">
            <div className="grid gap-12 lg:grid-cols-[3fr,2fr] items-start">
              <div className="space-y-7">
                <p className="tag-pill text-yametee-muted">Drop 07 • Bloom Core</p>
                <h1 className="font-heading text-4xl md:text-5xl lg:text-6xl text-yametee-foreground leading-tight max-w-2xl">
                  Anime energy distilled into daily uniforms for Manila streets.
                </h1>
                <p className="text-base md:text-lg text-yametee-muted max-w-2xl leading-relaxed">
                  Heavyweight tees engineered for the climate: pre-shrunk, breathable, and screen
                  printed by hand inside our Mandaluyong studio. Built to take on commutes, gigs,
                  and midnight food runs.
                </p>
                <div className="flex flex-wrap gap-4">
                  <Link
                    href="/products"
                    className="inline-flex items-center gap-3 rounded-full border border-yametee-border bg-white/5 px-6 py-3 text-xs uppercase tracking-[0.3em] text-yametee-foreground hover:bg-white/10 transition-all"
                  >
                    Shop Staples
                  </Link>
                  <Link
                    href="/drops"
                    className="inline-flex items-center gap-3 rounded-full border border-transparent bg-yametee-red px-6 py-3 text-xs font-semibold uppercase tracking-[0.3em] text-white hover:bg-yametee-redDark transition-all"
                  >
                    View Drops
                  </Link>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
                  {heroStats.map(stat => (
                    <div
                      key={stat.label}
                      className="rounded-2xl border border-yametee-border bg-yametee-gray/40 p-4 text-center"
                    >
                      <p className="text-xs uppercase tracking-[0.3em] text-yametee-muted">
                        {stat.label}
                      </p>
                      <p className="font-heading text-2xl text-yametee-foreground mt-1">
                        {stat.value}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="lg:sticky lg:top-28 space-y-4">
                <EmailSignup />
                <div className="rounded-2xl border border-yametee-border bg-yametee-gray/60 p-4 flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.3em] text-yametee-muted">
                      Same-day Metro Manila
                    </p>
                    <p className="text-sm text-yametee-foreground mt-1">
                      Order by 2 PM • Grab / Lalamove ready
                    </p>
                  </div>
                  <span className="text-yametee-red text-xl">↻</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="px-4 pb-12">
          <div className="container mx-auto grid gap-6 md:grid-cols-3">
            {capsuleHighlights.map(capsule => (
              <div
                key={capsule.title}
                className="rounded-3xl border border-yametee-border bg-[var(--yametee-card)] dark:bg-gradient-to-br dark:from-white/5 dark:to-transparent p-6 flex flex-col justify-between min-h-[220px] shadow-[0_12px_50px_rgba(0,0,0,0.05)] dark:shadow-none"
              >
                <p className="text-[10px] uppercase tracking-[0.3em] text-yametee-muted dark:text-white/70">
                  {capsule.tag}
                </p>
                <div className="mt-3 space-y-3">
                  <h3 className="font-heading text-2xl text-yametee-foreground dark:text-white">
                    {capsule.title}
                  </h3>
                  <p className="text-sm text-yametee-muted dark:text-white/70">
                    {capsule.description}
                  </p>
                </div>
                <p className="text-xs uppercase tracking-[0.3em] text-yametee-red mt-4">
                  {capsule.status}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="py-16 px-4">
          <div className="container mx-auto">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-10">
              <div>
                <p className="text-xs uppercase tracking-[0.4em] text-yametee-muted">Featured</p>
                <h2 className="font-heading text-3xl md:text-4xl text-yametee-foreground">
                  Hand-numbered Drops
                </h2>
              </div>
              <Link
                href="/drops"
                className="text-xs uppercase tracking-[0.3em] text-yametee-muted hover:text-yametee-foreground transition-colors"
              >
                View all drops →
              </Link>
            </div>

            {spotlightProducts.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-yametee-border p-10 text-center text-yametee-muted">
                Featured products will appear here once you flag items as featured in the admin.
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2">
                {spotlightProducts.map((product, index) => {
                  const variant = product.variants?.[0]
                  const primaryImage = product.images?.[0]
                  const secondaryImage = product.images?.[1]

                  if (!variant) return null

                  return (
                    <Link
                      key={product.id}
                      href={`/products/${product.slug}`}
                      className="group relative overflow-hidden rounded-3xl border border-yametee-border bg-[var(--yametee-card)] dark:bg-yametee-gray/60 shadow-[0_20px_70px_rgba(0,0,0,0.08)] dark:shadow-none"
                    >
                      <div className="relative aspect-[4/3] overflow-hidden">
                        {primaryImage ? (
                          <>
                            <img
                              src={primaryImage.imageUrl}
                              alt={`${product.name} front`}
                              className={`absolute inset-0 h-full w-full object-cover transition-all duration-300 ${
                                secondaryImage ? 'opacity-100 group-hover:opacity-0' : 'opacity-100'
                              } group-hover:scale-105`}
                            />
                            {secondaryImage && (
                              <img
                                src={secondaryImage.imageUrl}
                                alt={`${product.name} alternate`}
                                className="absolute inset-0 h-full w-full object-cover opacity-0 transition-all duration-300 group-hover:opacity-100 group-hover:scale-105"
                              />
                            )}
                          </>
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center bg-yametee-lightGray/60 dark:bg-yametee-lightGray/40 text-yametee-muted dark:text-white/70">
                            No image
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                        <div className="absolute top-4 left-4 text-[11px] uppercase tracking-[0.4em] text-yametee-muted dark:text-white/70">
                          {`Batch 0${index + 1}`}
                        </div>
                      </div>
                      <div className="p-6 flex items-center justify-between gap-4">
                        <div>
                          <p className="text-xs uppercase tracking-[0.35em] text-yametee-muted dark:text-white/60">
                            Limited run
                          </p>
                          <h3 className="font-heading text-2xl text-yametee-foreground dark:text-white">
                            {product.name}
                          </h3>
                        </div>
                        {variant && (
                          <p className="text-lg font-semibold text-yametee-red">
                            {formatPrice(variant.price.toString())}
                          </p>
                        )}
                      </div>
                    </Link>
                  )
                })}
              </div>
            )}
          </div>
        </section>

        <section className="px-4 pb-16">
          <div className="container mx-auto">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {collectionCards.map(collection => (
                <Link
                  key={collection.title}
                  href={collection.href}
                  className={`rounded-3xl border border-yametee-border bg-[var(--yametee-card)] dark:bg-gradient-to-br ${collection.accent} p-6 flex flex-col justify-between min-h-[240px] hover:-translate-y-1 transition-transform shadow-[0_12px_50px_rgba(0,0,0,0.06)] dark:shadow-none`}
                >
                  <div>
                    <p className="text-xs uppercase tracking-[0.4em] text-yametee-muted dark:text-white/70">
                      Collection
                    </p>
                    <h3 className="font-heading text-3xl text-yametee-foreground dark:text-white mt-2">
                      {collection.title}
                    </h3>
                    <p className="text-sm text-yametee-muted dark:text-white/70 mt-3">
                      {collection.copy}
                    </p>
                  </div>
                  <span className="text-xs uppercase tracking-[0.3em] text-yametee-muted dark:text-white/70 mt-6">
                    Explore →
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="px-4 pb-16">
          <div className="container mx-auto grid gap-8 lg:grid-cols-[2fr,3fr]">
            <div className="rounded-3xl border border-yametee-border bg-[var(--yametee-card)] dark:bg-yametee-gray/60 p-6 flex flex-col justify-between shadow-[0_15px_60px_rgba(0,0,0,0.05)] dark:shadow-none">
              <div>
                <p className="text-xs uppercase tracking-[0.4em] text-yametee-muted dark:text-white/70">
                  Lookbook
                </p>
                <h3 className="font-heading text-3xl text-yametee-foreground dark:text-white mt-3">
                  Studio snapshots across Manila
                </h3>
                <p className="text-sm text-yametee-muted dark:text-white/70 mt-3">
                  We shoot every capsule ourselves—rooftops, trains, and neon corners around the
                  city.
                </p>
              </div>
              <div className="mt-6 space-y-4">
                {lookbookStories.map(story => (
                  <div key={story.title} className="border-t border-yametee-border pt-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs uppercase tracking-[0.3em] text-yametee-muted dark:text-white/60">
                          {story.location}
                        </p>
                        <p className="font-heading text-xl text-yametee-foreground dark:text-white">
                          {story.title}
                        </p>
                      </div>
                      <span className="text-yametee-red text-lg">↗</span>
                    </div>
                    <p className="text-sm text-yametee-muted dark:text-white/70 mt-2">
                      {story.note}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-6">
              {studioStories.map(story => (
                <div
                  key={story.title}
                  className="rounded-3xl border border-yametee-border bg-[var(--yametee-card)] dark:bg-yametee-gray/50 p-5 shadow-[0_15px_55px_rgba(0,0,0,0.05)] dark:shadow-none"
                >
                  <p className="text-xs uppercase tracking-[0.3em] text-yametee-muted dark:text-white/60">
                    {story.date}
                  </p>
                  <h4 className="font-heading text-2xl text-yametee-foreground dark:text-white mt-2">
                    {story.title}
                  </h4>
                  <p className="text-sm text-yametee-muted dark:text-white/70 mt-2">
                    {story.summary}
                  </p>
                  <Link
                    href="/about"
                    className="text-xs uppercase tracking-[0.3em] text-yametee-foreground dark:text-white mt-4 inline-flex items-center gap-2"
                  >
                    Read Journal <span>↗</span>
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
