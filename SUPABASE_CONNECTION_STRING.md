# Supabase Connection String Configuration

## Your Supabase Pooler Connection String

**Formatted for Prisma with PgBouncer:**

```
postgresql://postgres.yyjppisykzofnkfirauj:!admin00@aws-1-ap-south-1.pooler.supabase.com:5432/postgres?schema=public&pgbouncer=true
```

## Connection String Breakdown

- **Protocol:** `postgresql://`
- **User:** `postgres.yyjppisykzofnkfirauj` (pooler user format)
- **Password:** `!admin00`
- **Host:** `aws-1-ap-south-1.pooler.supabase.com`
- **Port:** `5432` (Supabase pooler port)
- **Database:** `postgres`
- **Parameters:**
  - `schema=public` - Required for Prisma
  - `pgbouncer=true` - Required to disable prepared statements

## Setup Instructions

### 1. Update Local Environment (.env)

```bash
DATABASE_URL="postgresql://postgres.yyjppisykzofnkfirauj:!admin00@aws-1-ap-south-1.pooler.supabase.com:5432/postgres?schema=public&pgbouncer=true"
```

### 2. Update Vercel Environment Variables

1. Go to [Vercel Dashboard](https://vercel.com) → Your Project
2. Navigate to **Settings** → **Environment Variables**
3. Update `DATABASE_URL` with the connection string above
4. Select all environments (Production, Preview, Development)
5. Click **Save**
6. **Redeploy** your application

### 3. Test Connection

```bash
# Test locally
npm run dev
# Visit: http://localhost:3000/api/test-db

# Test on Vercel
# Visit: https://your-app.vercel.app/api/test-db
```

## Important Notes

✅ **Correct Format:**

- Includes `?schema=public&pgbouncer=true`
- Uses port `5432` (Supabase pooler port)
- Uses pooler user format: `postgres.[PROJECT-REF]`

❌ **Common Mistakes:**

- Missing `schema=public` parameter
- Missing `pgbouncer=true` parameter
- Using wrong port (should be `5432`, not `6543`)
- Using direct connection instead of pooler

## Why These Parameters?

- **`schema=public`**: Prisma needs to know which schema to use
- **`pgbouncer=true`**: Tells Prisma to disable prepared statements (required for PgBouncer/Supabase pooler)

## Prisma Configuration

The Prisma Client in `lib/prisma.ts` is already configured to work with this connection string. When Prisma detects `?pgbouncer=true`, it automatically:

- Disables prepared statements
- Uses regular queries
- Works seamlessly with Supabase's connection pooler

## Troubleshooting

### Error: "prepared statement does not exist"

**Solution:** Ensure `&pgbouncer=true` is in your connection string

### Error: "schema does not exist"

**Solution:** Ensure `?schema=public` is in your connection string

### Error: "Connection refused"

**Solution:**

- Verify the host and port are correct
- Check if your IP is whitelisted in Supabase (if required)
- Ensure you're using the pooler URL, not the direct connection URL

### Error: "Authentication failed"

**Solution:**

- Verify the password is correct
- Check if you're using the pooler user format: `postgres.[PROJECT-REF]`
- Reset password in Supabase Dashboard if needed

## Next Steps

1. ✅ Update `.env` file with the connection string
2. ✅ Update Vercel environment variables
3. ✅ Run Prisma migrations: `npx prisma db push`
4. ✅ Test connection: Visit `/api/test-db`
5. ✅ Redeploy application

---

**Your connection string is ready to use!** 🚀
