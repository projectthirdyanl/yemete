import { NextResponse } from 'next/server'
import { getClearedAdminSessionCookie } from '@/lib/admin-tokens'

export async function POST() {
  const response = NextResponse.json({ success: true })
  response.cookies.set(getClearedAdminSessionCookie())
  return response
}

