import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAdminSession } from '@/lib/server-admin-session'
import { logger } from '@/lib/logger'

export async function GET() {
  try {
    const session = await getAdminSession()

    if (!session) {
      logger.debug('Admin session check failed: no session', {})
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const customer = await prisma.customer.findUnique({
      where: { id: session.id },
      select: {
        id: true,
        email: true,
        name: true,
      },
    })

    if (!customer) {
      logger.warn('Admin session check failed: customer not found', { sessionId: session.id })
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    return NextResponse.json({ customer })
  } catch (error) {
    logger.error('Admin session check error', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

