import { NextRequest, NextResponse } from 'next/server'
import { verifyAdmin, createAdminUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { createAdminSessionCookie, createAdminSessionToken } from '@/lib/admin-tokens'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password required' }, { status: 400 })
    }

    // Check if this is the first admin user (auto-create if no admins exist)
    const adminCount = await prisma.customer.count({
      where: {
        hashedPassword: { not: null },
      },
    })

    // If no admin exists and email looks like admin, auto-create
    if (adminCount === 0 && (email.includes('admin') || email === 'admin@yametee.com')) {
      console.log('No admin users found. Creating first admin user...')
      await createAdminUser(email, password)
    }

    const customer = await verifyAdmin(email, password)

    if (!customer) {
      return NextResponse.json({ 
        error: 'Invalid credentials. If this is your first login, make sure you use a valid email and password.',
        hint: 'You can create an admin user by calling POST /api/admin/init'
      }, { status: 401 })
    }

    const token = await createAdminSessionToken({
      id: customer.id,
      email: customer.email,
    })

    const response = NextResponse.json({
      customer: {
        id: customer.id,
        email: customer.email,
        name: customer.name,
      },
    })

    response.cookies.set(createAdminSessionCookie(token))
    return response
  } catch (error: any) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: error.message || 'Login failed' },
      { status: 500 }
    )
  }
}
