import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAdminSession } from '@/lib/server-admin-session'

export async function GET() {
  try {
    const session = await getAdminSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Total sales (completed orders)
    const totalSales = await prisma.order.aggregate({
      where: {
        status: 'COMPLETED',
      },
      _sum: {
        grandTotal: true,
      },
    })

    // Total orders count
    const totalOrders = await prisma.order.count()

    // Pending orders
    const pendingOrders = await prisma.order.count({
      where: {
        status: 'PENDING',
      },
    })

    // Today's sales
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todaySales = await prisma.order.aggregate({
      where: {
        status: 'COMPLETED',
        createdAt: {
          gte: today,
        },
      },
      _sum: {
        grandTotal: true,
      },
    })

    // This month's sales
    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)
    const monthSales = await prisma.order.aggregate({
      where: {
        status: 'COMPLETED',
        createdAt: {
          gte: startOfMonth,
        },
      },
      _sum: {
        grandTotal: true,
      },
    })

    // Total customers
    const totalCustomers = await prisma.customer.count()

    // Low stock products (stock < 10)
    const lowStockProducts = await prisma.variant.count({
      where: {
        stockQuantity: {
          lt: 10,
        },
      },
    })

    // Recent orders (last 10)
    const recentOrders = await prisma.order.findMany({
      take: 10,
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        customer: {
          select: {
            name: true,
            email: true,
          },
        },
        items: {
          include: {
            product: {
              select: {
                name: true,
              },
            },
            variant: {
              select: {
                size: true,
                color: true,
              },
            },
          },
        },
      },
    })

    return NextResponse.json({
      totalSales: totalSales._sum.grandTotal || 0,
      totalOrders,
      pendingOrders,
      todaySales: todaySales._sum.grandTotal || 0,
      monthSales: monthSales._sum.grandTotal || 0,
      totalCustomers,
      lowStockProducts,
      recentOrders,
    })
  } catch (error) {
    console.error('Error fetching stats:', error)
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 })
  }
}
