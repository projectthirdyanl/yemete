import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createAdminUser } from '@/lib/auth'
import { getAdminSession } from '@/lib/server-admin-session'

/**
 * GET /api/admin/accounts
 * List all admin accounts (customers with passwords)
 */
export async function GET() {
  try {
    const session = await getAdminSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const admins = await prisma.customer.findMany({
      where: {
        hashedPassword: { not: null },
      },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            orders: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json({ admins })
  } catch (error) {
    console.error('Error fetching admin accounts:', error)
    return NextResponse.json({ error: 'Failed to fetch admin accounts' }, { status: 500 })
  }
}

/**
 * POST /api/admin/accounts
 * Create a new admin account
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getAdminSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { email, password, name } = body

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 })
    }

    // Validate password strength (minimum 6 characters)
    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long' },
        { status: 400 }
      )
    }

    // Check if email already exists
    const existingCustomer = await prisma.customer.findUnique({
      where: { email },
    })

    if (existingCustomer && existingCustomer.hashedPassword) {
      return NextResponse.json(
        { error: 'An admin account with this email already exists' },
        { status: 400 }
      )
    }

    // Create admin user
    const admin = await createAdminUser(email, password)

    // Update name if provided
    if (name) {
      await prisma.customer.update({
        where: { id: admin.id },
        data: { name },
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Admin account created successfully',
      admin: {
        id: admin.id,
        email: admin.email,
        name: admin.name || name,
      },
    })
  } catch (error) {
    console.error('Error creating admin account:', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to create admin account'
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
