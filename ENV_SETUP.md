# Environment Variables Setup

## Required Environment Variables

### ADMIN_JWT_SECRET ✅ **REQUIRED**

This secret is used to sign and verify admin session tokens. It's critical for admin authentication security.

**Status**: ✅ Added to `.env` file

**Generated Secret**: A secure 128-character random hex string has been generated and added to your `.env` file.

**To generate a new secret** (if needed):

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

**Security Notes**:

- Keep this secret secure and never commit it to version control
- Use different secrets for development and production
- Minimum recommended length: 32 characters
- Current secret length: 128 characters (very secure)

---

## Other Environment Variables

### Database

- `DATABASE_URL` - PostgreSQL connection string

### PayMongo

- `PAYMONGO_SECRET_KEY` - PayMongo secret API key
- `PAYMONGO_PUBLIC_KEY` - PayMongo public API key
- `PAYMONGO_WEBHOOK_SECRET` - PayMongo webhook secret

### NextAuth

- `NEXTAUTH_URL` - Base URL of your application
- `NEXTAUTH_SECRET` - Secret for NextAuth (if using)

### Node Environment

- `NODE_ENV` - `development` or `production`

---

## Verification

After adding `ADMIN_JWT_SECRET`, restart your development server:

```bash
npm run dev
```

The admin login should now work without the "Missing ADMIN_JWT_SECRET" error.

---

**Last Updated**: 2025-01-XX  
**Status**: ✅ ADMIN_JWT_SECRET configured
