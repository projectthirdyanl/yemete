'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import LoadingSpinner from '@/components/LoadingSpinner'

export const dynamic = 'force-dynamic'

function AdminLoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()

  // Validate redirectTo to prevent open redirects
  const rawRedirect = searchParams.get('redirectTo') || '/admin'
  const redirectTarget =
    rawRedirect.startsWith('/admin') && !rawRedirect.includes('..') && !rawRedirect.includes('//')
      ? rawRedirect
      : '/admin'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let isMounted = true
    const checkExistingSession = async () => {
      try {
        const response = await fetch('/api/admin/session', {
          credentials: 'include',
        })

        if (response.ok && isMounted) {
          router.replace(redirectTarget)
        }
      } catch (error) {
        // Ignore errors – user is likely not authenticated yet
      }
    }

    checkExistingSession()

    return () => {
      isMounted = false
    }
  }, [redirectTarget, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Login failed')
      }

      const data = await response.json()
      console.log('Login response:', data)

      // Small delay to ensure cookie is set
      await new Promise(resolve => setTimeout(resolve, 100))

      // Verify session before redirect
      try {
        const sessionResponse = await fetch('/api/admin/session', {
          credentials: 'include',
          cache: 'no-store',
        })
        
        if (sessionResponse.ok) {
          router.replace(redirectTarget)
        } else {
          throw new Error('Session verification failed')
        }
      } catch (err) {
        console.error('Session verification error:', err)
        setError('Login successful but session verification failed. Please try again.')
        setLoading(false)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Login failed'
      setError(errorMessage)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-yametee-dark px-4 transition-colors duration-300">
      <div className="w-full max-w-md bg-white dark:bg-yametee-gray border border-gray-200 dark:border-gray-700 rounded-lg p-8 shadow-lg">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8 text-center">
          Admin Login
        </h1>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 mb-4 text-red-700 dark:text-red-400 text-sm">
            {error}
            {error.includes('Invalid credentials') && (
              <div className="mt-2 text-xs">
                <p>Default credentials:</p>
                <p>Email: admin@yametee.com</p>
                <p>Password: admin123</p>
              </div>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-gray-900 dark:text-white mb-2">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full bg-white dark:bg-yametee-dark border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-yametee-red focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-gray-900 dark:text-white mb-2">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full bg-white dark:bg-yametee-dark border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-yametee-red focus:border-transparent"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-yametee-red text-white py-3 rounded-lg font-semibold hover:bg-yametee-red/90 transition-all disabled:bg-gray-300 dark:disabled:bg-gray-700 disabled:text-gray-500 dark:disabled:text-gray-400 disabled:cursor-not-allowed"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default function AdminLogin() {
  return (
    <Suspense fallback={<LoadingSpinner fullScreen={true} size="large" />}>
      <AdminLoginForm />
    </Suspense>
  )
}
