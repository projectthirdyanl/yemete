import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAdminSession } from '@/lib/server-admin-session'
import { hashPassword } from '@/lib/auth'

/**
 * DELETE /api/admin/accounts/[id]
 * Delete an admin account (remove password, making them a regular customer)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAdminSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Prevent deleting your own account
    if (id === session.id) {
      return NextResponse.json(
        { error: 'You cannot delete your own admin account' },
        { status: 400 }
      )
    }

    // Check if admin exists
    const admin = await prisma.customer.findUnique({
      where: { id },
    })

    if (!admin || !admin.hashedPassword) {
      return NextResponse.json({ error: 'Admin account not found' }, { status: 404 })
    }

    // Remove admin access by clearing password
    await prisma.customer.update({
      where: { id },
      data: { hashedPassword: null },
    })

    return NextResponse.json({
      success: true,
      message: 'Admin access removed successfully',
    })
  } catch (error) {
    console.error('Error removing admin access:', error)
    return NextResponse.json({ error: 'Failed to remove admin access' }, { status: 500 })
  }
}

/**
 * PATCH /api/admin/accounts/[id]
 * Update admin account (change password or name)
 */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getAdminSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { password, name } = body

    // Check if admin exists
    const admin = await prisma.customer.findUnique({
      where: { id },
    })

    if (!admin || !admin.hashedPassword) {
      return NextResponse.json({ error: 'Admin account not found' }, { status: 404 })
    }

    const updateData: { hashedPassword?: string; name?: string } = {}

    if (password) {
      if (password.length < 6) {
        return NextResponse.json(
          { error: 'Password must be at least 6 characters long' },
          { status: 400 }
        )
      }
      updateData.hashedPassword = await hashPassword(password)
    }

    if (name) {
      updateData.name = name
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
    }

    const updated = await prisma.customer.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json({
      success: true,
      message: 'Admin account updated successfully',
      admin: {
        id: updated.id,
        email: updated.email,
        name: updated.name,
      },
    })
  } catch (error) {
    console.error('Error updating admin account:', error)
    return NextResponse.json({ error: 'Failed to update admin account' }, { status: 500 })
  }
}
