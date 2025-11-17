import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

/**
 * Test database connection endpoint
 * Useful for verifying DATABASE_URL is configured correctly in Vercel
 *
 * GET /api/test-db
 */
export async function GET() {
  try {
    // Test basic connection
    await prisma.$queryRaw`SELECT 1`

    // Test a simple query
    const productCount = await prisma.product.count()
    const orderCount = await prisma.order.count()

    return NextResponse.json({
      status: 'connected',
      timestamp: new Date().toISOString(),
      database: {
        connected: true,
        productCount,
        orderCount,
      },
      message: 'Database connection successful! ✅',
    })
  } catch (error: any) {
    console.error('Database connection test failed:', error)

    return NextResponse.json(
      {
        status: 'error',
        timestamp: new Date().toISOString(),
        error: error.message || 'Unknown error',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
        message: 'Database connection failed ❌',
        troubleshooting: {
          check: [
            'DATABASE_URL is set in Vercel environment variables',
            'Database is accessible from internet (if using public IP)',
            'Firewall allows connections on port 5432',
            'PostgreSQL is running and listening',
            'Username and password are correct',
          ],
        },
      },
      { status: 500 }
    )
  }
}
