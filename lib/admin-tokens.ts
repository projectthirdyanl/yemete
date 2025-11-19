import { SignJWT, jwtVerify } from 'jose'

const ADMIN_SESSION_COOKIE = 'yametee_admin_session'
const DEFAULT_SESSION_MAX_AGE = 60 * 60 * 8 // 8 hours
const JWT_ALGORITHM = 'HS256'
const ADMIN_ROLE = 'admin'

const encoder = new TextEncoder()

function getAdminJwtSecret() {
  const secret = process.env.ADMIN_JWT_SECRET
  if (!secret) {
    throw new Error('Missing ADMIN_JWT_SECRET environment variable')
  }

  return encoder.encode(secret)
}

export const ADMIN_SESSION_MAX_AGE = Number(process.env.ADMIN_SESSION_MAX_AGE ?? DEFAULT_SESSION_MAX_AGE)

export interface AdminSession {
  id: string
  email?: string | null
}

export { ADMIN_SESSION_COOKIE }

export async function createAdminSessionToken(admin: AdminSession) {
  const secret = getAdminJwtSecret()

  return new SignJWT({
    email: admin.email,
    role: ADMIN_ROLE,
  })
    .setProtectedHeader({ alg: JWT_ALGORITHM })
    .setSubject(admin.id)
    .setIssuedAt()
    .setExpirationTime(`${ADMIN_SESSION_MAX_AGE}s`)
    .sign(secret)
}

export async function verifyAdminSessionToken(token: string): Promise<AdminSession | null> {
  try {
    const secret = getAdminJwtSecret()
    const { payload } = await jwtVerify(token, secret, {
      algorithms: [JWT_ALGORITHM],
    })

    if (payload.role !== ADMIN_ROLE || !payload.sub) {
      return null
    }

    return {
      id: payload.sub,
      email: typeof payload.email === 'string' ? payload.email : undefined,
    }
  } catch (error) {
    console.error('Failed to verify admin session token:', error)
    return null
  }
}

export function createAdminSessionCookie(token: string) {
  // Only use secure cookies if explicitly set or if using HTTPS
  // In development or behind proxy, secure cookies won't work with HTTP
  const useSecure = process.env.ADMIN_COOKIE_SECURE === 'true' || 
                    (process.env.NODE_ENV === 'production' && process.env.NEXTAUTH_URL?.startsWith('https://'))
  
  return {
    name: ADMIN_SESSION_COOKIE,
    value: token,
    httpOnly: true as const,
    secure: useSecure,
    sameSite: 'lax' as const,
    path: '/',
    maxAge: ADMIN_SESSION_MAX_AGE,
  }
}

export function getClearedAdminSessionCookie() {
  return {
    name: ADMIN_SESSION_COOKIE,
    value: '',
    path: '/',
    maxAge: 0,
  }
}

