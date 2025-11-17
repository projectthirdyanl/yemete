import { NextRequest, NextResponse } from 'next/server'
import { ADMIN_SESSION_COOKIE, verifyAdminSessionToken } from './lib/admin-tokens'

const PUBLIC_ADMIN_PATHS = ['/admin/login', '/api/admin/login', '/api/admin/init']

function isPublicPath(pathname: string): boolean {
  return PUBLIC_ADMIN_PATHS.some(path => {
    // Exact match
    if (pathname === path) return true
    // Path starts with public path followed by /
    if (pathname.startsWith(`${path}/`)) return true
    return false
  })
}

function isValidRedirectPath(path: string): boolean {
  // Only allow redirects to admin routes
  // Prevent open redirects to external URLs
  if (!path.startsWith('/admin')) return false
  // Prevent redirect loops
  if (path === '/admin/login') return false
  // Basic path validation
  if (path.includes('//') || path.includes('..')) return false
  return true
}

function redirectToLogin(request: NextRequest) {
  const loginUrl = new URL('/admin/login', request.url)
  const originalPath = request.nextUrl.pathname

  if (originalPath !== '/admin/login' && isValidRedirectPath(originalPath)) {
    loginUrl.searchParams.set('redirectTo', originalPath)
  }

  return NextResponse.redirect(loginUrl)
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const isAdminRoute = pathname.startsWith('/admin')
  const isAdminApiRoute = pathname.startsWith('/api/admin')

  if (!isAdminRoute && !isAdminApiRoute) {
    return NextResponse.next()
  }

  if (isPublicPath(pathname)) {
    return NextResponse.next()
  }

  const token = request.cookies.get(ADMIN_SESSION_COOKIE)?.value

  if (!token) {
    return isAdminApiRoute
      ? NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      : redirectToLogin(request)
  }

  const session = await verifyAdminSessionToken(token)

  if (!session) {
    return isAdminApiRoute
      ? NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      : redirectToLogin(request)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*'],
}
