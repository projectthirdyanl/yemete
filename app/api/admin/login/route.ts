import { NextRequest, NextResponse } from 'next/server'
import { verifyAdmin } from '@/lib/auth'
import { createAdminSessionCookie, createAdminSessionToken } from '@/lib/admin-tokens'
import { logger } from '@/lib/logger'
import { ValidationError, UnauthorizedError, formatErrorResponse } from '@/lib/errors'

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    let body: { email?: string; password?: string }
    try {
      body = await request.json()
    } catch (error) {
      throw new ValidationError('Invalid request body')
    }

    const { email, password } = body

    if (!email || !password) {
      throw new ValidationError('Email and password required')
    }

    // Validate email format
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new ValidationError('Invalid email format')
    }

    // Verify admin credentials (this includes bcrypt comparison which can be slow)
    const customer = await verifyAdmin(email, password)

    if (!customer) {
      logger.warn('Admin login failed: invalid credentials', { email })
      throw new UnauthorizedError('Invalid email or password')
    }

    // Create session token
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
    
    const duration = Date.now() - startTime
    logger.info('Admin login successful', { email, duration })
    
    return response
  } catch (error) {
    const duration = Date.now() - startTime
    logger.error('Admin login error', error, { duration })
    
    const errorResponse = formatErrorResponse(error)
    const statusCode = error instanceof ValidationError || error instanceof UnauthorizedError
      ? error.statusCode
      : 500
    
    return NextResponse.json(errorResponse, { status: statusCode })
  }
}
