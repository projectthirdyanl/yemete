import AdminLayout from '@/components/AdminLayout'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

async function getCustomers() {
  try {
    const customers = await prisma.customer.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        _count: {
          select: {
            orders: true,
          },
        },
      },
    })

    return customers
  } catch (error) {
    console.error('Error fetching customers:', error)
    return []
  }
}

export default async function AdminCustomersPage() {
  const customers = await getCustomers()

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Customers</h1>
        </div>

        {/* Customers Table */}
        <div className="bg-white dark:bg-yametee-gray border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
          {customers.length === 0 ? (
            <div className="p-8 text-center text-gray-600 dark:text-gray-400">
              No customers found
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-yametee-dark border-b border-gray-200 dark:border-gray-700">
                  <tr>
                    <th className="text-left p-4 text-gray-900 dark:text-white font-semibold">
                      Name
                    </th>
                    <th className="text-left p-4 text-gray-900 dark:text-white font-semibold">
                      Email
                    </th>
                    <th className="text-left p-4 text-gray-900 dark:text-white font-semibold">
                      Phone
                    </th>
                    <th className="text-left p-4 text-gray-900 dark:text-white font-semibold">
                      Orders
                    </th>
                    <th className="text-left p-4 text-gray-900 dark:text-white font-semibold">
                      Member Since
                    </th>
                    <th className="text-left p-4 text-gray-900 dark:text-white font-semibold">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {customers.map(customer => (
                    <tr
                      key={customer.id}
                      className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-yametee-dark/50 transition-colors"
                    >
                      <td className="p-4 text-gray-900 dark:text-white font-medium">
                        {customer.name || 'N/A'}
                      </td>
                      <td className="p-4 text-gray-900 dark:text-white">
                        {customer.email || 'N/A'}
                      </td>
                      <td className="p-4 text-gray-600 dark:text-gray-400">
                        {customer.phone || 'N/A'}
                      </td>
                      <td className="p-4 text-gray-900 dark:text-white">
                        {customer._count.orders}
                      </td>
                      <td className="p-4 text-gray-600 dark:text-gray-400 text-sm">
                        {new Date(customer.createdAt).toLocaleDateString()}
                      </td>
                      <td className="p-4">
                        <Link
                          href={`/admin/customers/${customer.id}`}
                          className="text-yametee-red hover:text-yametee-red/80 text-sm font-medium"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  )
}
