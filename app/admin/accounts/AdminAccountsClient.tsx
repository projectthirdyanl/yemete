'use client'

import { useState } from 'react'
import {
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Input,
  Label,
} from '@/components/ui'
import { useToast } from '@/contexts/ToastContext'

interface Admin {
  id: string
  email: string | null
  name: string | null
  phone: string | null
  createdAt: string // ISO string from server
  updatedAt: string // ISO string from server
  _count: {
    orders: number
  }
}

interface AdminAccountsClientProps {
  initialAdmins: Admin[]
}

export default function AdminAccountsClient({ initialAdmins }: AdminAccountsClientProps) {
  const { success, error: showError } = useToast()
  const [admins, setAdmins] = useState(initialAdmins)
  const [loading, setLoading] = useState(false)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
  })
  const [editFormData, setEditFormData] = useState({
    password: '',
    name: '',
  })

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/admin/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create admin account')
      }

      success('Admin account created successfully!')
      setFormData({ email: '', password: '', name: '' })
      setCreateDialogOpen(false)

      // Refresh admin list
      const refreshResponse = await fetch('/api/admin/accounts')
      const refreshData = await refreshResponse.json()
      if (refreshResponse.ok) {
        setAdmins(refreshData.admins)
      }
    } catch (err: any) {
      showError(err.message || 'Failed to create admin account')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateAdmin = async (adminId: string, e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch(`/api/admin/accounts/${adminId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editFormData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update admin account')
      }

      success('Admin account updated successfully!')
      setEditFormData({ password: '', name: '' })
      setEditDialogOpen(null)

      // Refresh admin list
      const refreshResponse = await fetch('/api/admin/accounts')
      const refreshData = await refreshResponse.json()
      if (refreshResponse.ok) {
        setAdmins(refreshData.admins)
      }
    } catch (err: any) {
      showError(err.message || 'Failed to update admin account')
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveAdmin = async (adminId: string) => {
    if (
      !confirm(
        'Are you sure you want to remove admin access from this account? They will no longer be able to log in.'
      )
    ) {
      return
    }

    setLoading(true)

    try {
      const response = await fetch(`/api/admin/accounts/${adminId}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to remove admin access')
      }

      success('Admin access removed successfully!')

      // Refresh admin list
      const refreshResponse = await fetch('/api/admin/accounts')
      const refreshData = await refreshResponse.json()
      if (refreshResponse.ok) {
        setAdmins(refreshData.admins)
      }
    } catch (err: any) {
      showError(err.message || 'Failed to remove admin access')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Admin Accounts</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage admin users who can access the admin panel
          </p>
        </div>
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="default">Create Admin Account</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Admin Account</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateAdmin} className="space-y-4">
              <div>
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  placeholder="admin@yametee.com"
                />
              </div>
              <div>
                <Label htmlFor="password">Password *</Label>
                <Input
                  id="password"
                  type="password"
                  required
                  minLength={6}
                  value={formData.password}
                  onChange={e => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Minimum 6 characters"
                />
              </div>
              <div>
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Admin Name"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? 'Creating...' : 'Create Admin'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Admin Accounts Table */}
      <div className="bg-white dark:bg-yametee-gray border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
        {admins.length === 0 ? (
          <div className="p-8 text-center text-gray-600 dark:text-gray-400">
            No admin accounts found. Create your first admin account to get started.
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
                    Created
                  </th>
                  <th className="text-left p-4 text-gray-900 dark:text-white font-semibold">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {admins.map(admin => (
                  <tr
                    key={admin.id}
                    className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-yametee-dark/50 transition-colors"
                  >
                    <td className="p-4 text-gray-900 dark:text-white font-medium">
                      {admin.name || 'N/A'}
                    </td>
                    <td className="p-4 text-gray-900 dark:text-white">{admin.email || 'N/A'}</td>
                    <td className="p-4 text-gray-600 dark:text-gray-400">{admin.phone || 'N/A'}</td>
                    <td className="p-4 text-gray-900 dark:text-white">{admin._count.orders}</td>
                    <td className="p-4 text-gray-600 dark:text-gray-400 text-sm">
                      {new Date(admin.createdAt).toLocaleDateString()}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <Dialog
                          open={editDialogOpen === admin.id}
                          onOpenChange={open => setEditDialogOpen(open ? admin.id : null)}
                        >
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              Edit
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Edit Admin Account</DialogTitle>
                            </DialogHeader>
                            <form
                              onSubmit={e => handleUpdateAdmin(admin.id, e)}
                              className="space-y-4"
                            >
                              <div>
                                <Label>Email</Label>
                                <Input value={admin.email || ''} disabled />
                                <p className="text-xs text-gray-500 mt-1">
                                  Email cannot be changed
                                </p>
                              </div>
                              <div>
                                <Label htmlFor={`password-${admin.id}`}>New Password</Label>
                                <Input
                                  id={`password-${admin.id}`}
                                  type="password"
                                  minLength={6}
                                  value={editFormData.password}
                                  onChange={e =>
                                    setEditFormData({ ...editFormData, password: e.target.value })
                                  }
                                  placeholder="Leave blank to keep current password"
                                />
                              </div>
                              <div>
                                <Label htmlFor={`name-${admin.id}`}>Name</Label>
                                <Input
                                  id={`name-${admin.id}`}
                                  type="text"
                                  value={editFormData.name || admin.name || ''}
                                  onChange={e =>
                                    setEditFormData({ ...editFormData, name: e.target.value })
                                  }
                                  placeholder="Admin Name"
                                />
                              </div>
                              <div className="flex justify-end gap-2">
                                <Button
                                  type="button"
                                  variant="outline"
                                  onClick={() => {
                                    setEditDialogOpen(null)
                                    setEditFormData({ password: '', name: '' })
                                  }}
                                >
                                  Cancel
                                </Button>
                                <Button type="submit" disabled={loading}>
                                  {loading ? 'Updating...' : 'Update'}
                                </Button>
                              </div>
                            </form>
                          </DialogContent>
                        </Dialog>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleRemoveAdmin(admin.id)}
                          disabled={loading}
                        >
                          Remove Access
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
