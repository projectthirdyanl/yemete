import AdminLayout from '@/components/AdminLayout'
import { prisma } from '@/lib/prisma'
import AdminAccountsClient from './AdminAccountsClient'

async function getAdminAccounts() {
  try {
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

    return admins
  } catch (error) {
    console.error('Error fetching admin accounts:', error)
    return []
  }
}

export default async function AdminAccountsPage() {
  const admins = await getAdminAccounts()

  // Convert Date objects to ISO strings for client component serialization
  const safeAdmins = admins.map(admin => ({
    ...admin,
    createdAt: admin.createdAt.toISOString(),
    updatedAt: admin.updatedAt.toISOString(),
  }))

  return (
    <AdminLayout>
      <AdminAccountsClient initialAdmins={safeAdmins} />
    </AdminLayout>
  )
}
