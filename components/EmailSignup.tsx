'use client'

import { useState } from 'react'

const perks = ['Priority access to drops', 'Studio journal + playlists', 'Exclusive sample sales']

export default function EmailSignup() {
  const [email, setEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setMessage('')

    setTimeout(() => {
      setMessage('You’re on the list. Watch your inbox for the next drop.')
      setEmail('')
      setIsSubmitting(false)
    }, 900)
  }

  return (
    <div className="relative overflow-hidden rounded-3xl border border-yametee-border bg-gradient-to-br from-yametee-gray/80 via-yametee-gray/40 to-transparent p-6 md:p-8">
      <div className="absolute inset-px rounded-[26px] bg-gradient-to-br from-white/10 via-transparent to-white/10 opacity-40 dark:from-white/5 dark:opacity-30" />
      <div className="relative">
        <p className="tag-pill text-[10px] tracking-[0.3em] text-yametee-foreground/70 dark:text-white/70 mb-3">
          Studio Dispatch
      </p>
        <h3 className="font-heading text-3xl md:text-4xl text-yametee-foreground dark:text-white leading-tight">
          Be first in line for every release.
      </h3>
        <p className="text-sm md:text-base text-yametee-muted dark:text-white/70 mt-3 leading-relaxed">
          Weekly sketches, drop timers, and playlists from the Yametee studio. Zero spam, all signal.
      </p>
      
        <form onSubmit={handleSubmit} className="mt-6 space-y-3">
          <div className="flex flex-col gap-3">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
              placeholder="you@yametee.club"
          required
              className="w-full rounded-2xl border border-yametee-border bg-white/70 dark:bg-yametee-dark/60 px-4 py-3 text-yametee-foreground dark:text-white placeholder-yametee-muted dark:placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-yametee-red/60 focus:border-transparent transition-all"
        />
        <button
          type="submit"
          disabled={isSubmitting}
              className="w-full rounded-2xl bg-yametee-red text-white font-semibold py-3 tracking-[0.3em] uppercase text-xs hover:bg-yametee-redDark transition-all disabled:opacity-70"
        >
              {isSubmitting ? 'Joining...' : 'Join The Signal'}
        </button>
          </div>
          {message && <p className="text-xs text-yametee-red text-center">{message}</p>}
      </form>

        <div className="mt-6 grid gap-3">
          {perks.map((perk) => (
            <div
              key={perk}
              className="flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-yametee-muted dark:text-white/70"
            >
              <span className="text-yametee-red">—</span>
              {perk}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

