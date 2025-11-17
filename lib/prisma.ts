import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

/**
 * Prisma Client instance configured for PgBouncer compatibility.
 *
 * To use with PgBouncer, add `?pgbouncer=true` to your DATABASE_URL:
 * postgresql://user:pass@host:port/db?schema=public&pgbouncer=true
 *
 * This automatically disables prepared statements, which are not supported
 * by PgBouncer in transaction pooling mode.
 */
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}
