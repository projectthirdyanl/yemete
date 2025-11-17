import { NextRequest, NextResponse } from 'next/server'
import { createAdminUser } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, name } = body

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password required' }, { status: 400 })
    }

    const admin = await createAdminUser(email, password)

    return NextResponse.json({
      success: true,
      message: 'Admin user created successfully',
      admin: {
        id: admin.id,
        email: admin.email,
        name: admin.name,
      },
    })
  } catch (error) {
    console.error('Init admin error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to create admin user'
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
