import { NextRequest, NextResponse } from 'next/server'
import { ADMIN_SESSION_COOKIE, verifyAdminSessionToken } from './lib/admin-tokens'

const PUBLIC_ADMIN_PATHS = ['/admin/login', '/api/admin/login', '/api/admin/init']

function isPublicPath(pathname: string) {
  return PUBLIC_ADMIN_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`))
}

function redirectToLogin(request: NextRequest) {
  const loginUrl = new URL('/admin/login', request.url)
  if (request.nextUrl.pathname !== '/admin/login') {
    loginUrl.searchParams.set('redirectTo', request.nextUrl.pathname)
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
    return isAdminApiRoute ? NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) : redirectToLogin(request)
  }

  const session = await verifyAdminSessionToken(token)

  if (!session) {
    return isAdminApiRoute ? NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) : redirectToLogin(request)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*'],
}

