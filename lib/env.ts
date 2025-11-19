/**
 * Environment variable validation and access
 * Ensures all required environment variables are present
 */

// Import logger only after it's safe (avoid circular dependency)
let logger: { error: (msg: string, err?: unknown) => void } | null = null

try {
  // Dynamic import to avoid circular dependency issues
  logger = require('./logger').logger
} catch {
  // Fallback if logger not available
  logger = {
    error: (msg: string, err?: unknown) => {
      console.error(msg, err)
    },
  }
}

function getEnvVar(key: string, defaultValue?: string): string {
  const value = process.env[key] || defaultValue
  if (!value) {
    const error = new Error(`Missing required environment variable: ${key}`)
    logger?.error(`Environment validation failed: ${key}`, error)
    throw error
  }
  return value
}

function getOptionalEnvVar(key: string, defaultValue?: string): string | undefined {
  return process.env[key] || defaultValue
}

export const env = {
  // Database
  DATABASE_URL: getEnvVar('DATABASE_URL'),

  // Redis (optional)
  REDIS_URL: getOptionalEnvVar('REDIS_URL', 'redis://192.168.120.44:6379'),

  // NextAuth
  NEXTAUTH_URL: getEnvVar('NEXTAUTH_URL', 'http://localhost:3000'),
  NEXTAUTH_SECRET: getEnvVar('NEXTAUTH_SECRET'),

  // Admin
  ADMIN_JWT_SECRET: getEnvVar('ADMIN_JWT_SECRET'),

  // PayMongo
  PAYMONGO_SECRET_KEY: getEnvVar('PAYMONGO_SECRET_KEY'),
  PAYMONGO_PUBLIC_KEY: getEnvVar('PAYMONGO_PUBLIC_KEY'),
  PAYMONGO_WEBHOOK_SECRET: getEnvVar('PAYMONGO_WEBHOOK_SECRET'),

  // Application
  NODE_ENV: getOptionalEnvVar('NODE_ENV', 'development') as 'development' | 'production' | 'test',
  NEXT_PUBLIC_URL: getOptionalEnvVar('NEXT_PUBLIC_URL'),
}

// Validate environment variables on module load (only in production)
if (process.env.NODE_ENV === 'production') {
  try {
    // This will throw if any required env vars are missing
    Object.values(env)
  } catch (error) {
    logger?.error('Environment validation failed', error)
    process.exit(1)
  }
}
