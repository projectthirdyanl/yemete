#!/usr/bin/env tsx
/**
 * Seed default admin user
 * Creates a default admin user if no admins exist
 * 
 * Usage:
 *   tsx scripts/seed-default-admin.ts
 *   tsx scripts/seed-default-admin.ts admin@example.com mypassword
 * 
 * Environment variables:
 *   DEFAULT_ADMIN_EMAIL - default admin email (default: admin@yametee.com)
 *   DEFAULT_ADMIN_PASSWORD - default admin password (default: admin123)
 */

import { prisma } from '../lib/prisma'
import { createAdminUser } from '../lib/auth'
import { logger } from '../lib/logger'

const DEFAULT_EMAIL = process.env.DEFAULT_ADMIN_EMAIL || 'admin@yametee.com'
const DEFAULT_PASSWORD = process.env.DEFAULT_ADMIN_PASSWORD || 'admin123'

async function seedDefaultAdmin() {
  try {
    // Check if any admin exists
    const existingAdmin = await prisma.customer.findFirst({
      where: {
        hashedPassword: { not: null },
      },
    })

    if (existingAdmin) {
      logger.info('Admin user already exists', { email: existingAdmin.email })
      console.log(`✅ Admin user already exists: ${existingAdmin.email}`)
      console.log('   To create a new admin, use: npm run init:admin')
      return
    }

    // Get email and password from command line args or env
    const email = process.argv[2] || DEFAULT_EMAIL
    const password = process.argv[3] || DEFAULT_PASSWORD

    // Validate email format
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new Error(`Invalid email format: ${email}`)
    }

    // Validate password strength
    if (password.length < 6) {
      throw new Error('Password must be at least 6 characters long')
    }

    // Create admin user
    const admin = await createAdminUser(email, password)

    logger.info('Default admin user created', { email: admin.email })
    console.log('✅ Default admin user created successfully!')
    console.log(`   Email: ${email}`)
    console.log(`   Password: ${password}`)
    console.log('')
    console.log('⚠️  SECURITY WARNING:')
    console.log('   Please change the default password immediately after first login!')
    console.log('   You can change it in the admin panel or via API.')
  } catch (error) {
    logger.error('Failed to seed default admin', error)
    console.error('❌ Error creating admin user:', error instanceof Error ? error.message : String(error))
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

seedDefaultAdmin()
