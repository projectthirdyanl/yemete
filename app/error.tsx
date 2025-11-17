'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log error to console in development, or to error tracking service in production
    console.error('Application error:', error)
  }, [error])

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <h1 className="text-6xl font-bold text-yametee-red mb-4">Oops!</h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">
            Something went wrong. We&apos;re working on fixing it.
          </p>
          {process.env.NODE_ENV === 'development' && error.message && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg text-left">
              <p className="text-sm font-mono text-red-800 dark:text-red-200 break-all">
                {error.message}
              </p>
            </div>
          )}
          <div className="flex gap-4 justify-center">
            <button
              onClick={reset}
              className="bg-yametee-red text-white px-6 py-3 rounded-lg font-semibold hover:bg-yametee-red/90 transition-all"
            >
              Try Again
            </button>
            <Link
              href="/"
              className="bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white px-6 py-3 rounded-lg font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 transition-all"
            >
              Go Home
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
