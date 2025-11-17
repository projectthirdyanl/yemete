# PgBouncer Configuration Guide

This guide explains how to configure Prisma Client to work with PgBouncer connection pooling.

## What is PgBouncer?

PgBouncer is a lightweight connection pooler for PostgreSQL. It helps manage database connections efficiently, especially important for:

- **Serverless environments** (like Vercel) where many concurrent connections can overwhelm the database
- **High-traffic applications** that need connection pooling
- **Reducing connection overhead** and improving performance

## Prisma and PgBouncer Compatibility

Prisma uses **prepared statements** by default, which are not supported by PgBouncer when running in **transaction pooling mode** (the most common mode).

To use Prisma with PgBouncer, you need to disable prepared statements by adding `?pgbouncer=true` to your connection string.

## Configuration Steps

### 1. Update Your DATABASE_URL

Add `?pgbouncer=true` to your PostgreSQL connection string:

**Before (Direct Connection):**

```
postgresql://user:pass@host:5432/db?schema=public
```

**After (PgBouncer Connection):**

```
postgresql://user:pass@host:5432/db?schema=public&pgbouncer=true
```

### 2. Update Environment Variables

#### Local Development (.env)

```bash
DATABASE_URL="postgresql://user:pass@localhost:6432/db?schema=public&pgbouncer=true"
```

#### Vercel Environment Variables

1. Go to Vercel Dashboard → Your Project → **Settings** → **Environment Variables**
2. Update `DATABASE_URL` to include `&pgbouncer=true`
3. Redeploy your application

### 3. Verify Configuration

The Prisma Client in `lib/prisma.ts` is already configured to work with PgBouncer. When Prisma detects `?pgbouncer=true` in the connection string, it automatically:

- Disables prepared statements
- Uses regular queries instead
- Works seamlessly with PgBouncer's transaction pooling mode

## PgBouncer Setup

### Installing PgBouncer

**Ubuntu/Debian:**

```bash
sudo apt-get update
sudo apt-get install pgbouncer
```

**macOS:**

```bash
brew install pgbouncer
```

**Docker:**

```bash
docker run -d --name pgbouncer \
  -p 6432:6432 \
  -e DATABASES_HOST=your-postgres-host \
  -e DATABASES_PORT=5432 \
  -e DATABASES_USER=your-user \
  -e DATABASES_PASSWORD=your-password \
  -e DATABASES_DBNAME=your-database \
  edoburu/pgbouncer
```

### PgBouncer Configuration

Edit `/etc/pgbouncer/pgbouncer.ini` (or your config file):

```ini
[databases]
your_db = host=your-postgres-host port=5432 dbname=your-database

[pgbouncer]
listen_addr = 0.0.0.0
listen_port = 6432
auth_type = md5
auth_file = /etc/pgbouncer/userlist.txt
pool_mode = transaction
max_client_conn = 1000
default_pool_size = 25
```

**Key Settings:**

- `pool_mode = transaction` - Transaction-level pooling (recommended)
- `max_client_conn` - Maximum client connections
- `default_pool_size` - Connections per database/user

### Connection String Format

When connecting through PgBouncer, use the PgBouncer port (typically 6432) instead of PostgreSQL's port (5432):

```
postgresql://user:pass@pgbouncer-host:6432/db?schema=public&pgbouncer=true
```

## Benefits of Using PgBouncer

1. **Connection Efficiency**: Reduces the number of actual PostgreSQL connections
2. **Serverless Friendly**: Perfect for Vercel and other serverless platforms
3. **Better Performance**: Faster connection establishment
4. **Resource Management**: Prevents database connection exhaustion

## Troubleshooting

### Error: "prepared statement does not exist"

**Cause:** PgBouncer is being used but `?pgbouncer=true` is not in the connection string.

**Solution:** Add `&pgbouncer=true` to your `DATABASE_URL`.

### Error: "too many connections"

**Cause:** Not using connection pooling or pool size is too small.

**Solution:**

- Ensure PgBouncer is configured correctly
- Increase `default_pool_size` in PgBouncer config
- Verify your app is connecting through PgBouncer (port 6432)

### Connection Timeout

**Cause:** PgBouncer might be overloaded or misconfigured.

**Solution:**

- Check PgBouncer logs: `tail -f /var/log/pgbouncer/pgbouncer.log`
- Verify PgBouncer can reach PostgreSQL
- Check firewall rules

## Testing the Setup

### 1. Test Direct Connection

```bash
psql "postgresql://user:pass@postgres-host:5432/db"
```

### 2. Test PgBouncer Connection

```bash
psql "postgresql://user:pass@pgbouncer-host:6432/db"
```

### 3. Test from Application

Visit your test endpoint:

```
https://your-app.vercel.app/api/test-db
```

Should return: `{"status": "connected", ...}`

## Alternative: Managed Database Pooling

Many managed PostgreSQL services provide built-in connection pooling:

- **Supabase**: Use pooler connection string with `?pgbouncer=true`
- **Neon**: Automatic connection pooling
- **Railway**: Built-in pooling support
- **Vercel Postgres**: Integrated pooling

Example (Supabase Pooler):

```
postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres?schema=public&pgbouncer=true
```

**Real Example:**

```
postgresql://postgres.yyjppisykzofnkfirauj:!admin00@aws-1-ap-south-1.pooler.supabase.com:5432/postgres?schema=public&pgbouncer=true
```

**Important:**

- Supabase pooler uses port `5432` (not `6543`)
- Always include `?schema=public&pgbouncer=true` for Prisma compatibility

## Additional Resources

- [Prisma PgBouncer Documentation](https://www.prisma.io/docs/guides/performance-and-optimization/connection-management#pgbouncer)
- [PgBouncer Official Docs](https://www.pgbouncer.org/)
- [Connection Pooling Best Practices](https://www.prisma.io/docs/guides/performance-and-optimization/connection-management)

## Summary

✅ **To use PgBouncer with Prisma:**

1. Add `?pgbouncer=true` to your `DATABASE_URL`
2. Connect through PgBouncer port (typically 6432)
3. Prisma will automatically disable prepared statements
4. Your application will work seamlessly with connection pooling

The Prisma Client in this project is already configured to support PgBouncer - just update your connection string!
