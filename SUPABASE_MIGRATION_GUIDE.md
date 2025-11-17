# 🚀 Migrating to Supabase (Recommended Solution)

## ✅ Why Supabase?

- ✅ **Free tier** available (perfect for testing/small projects)
- ✅ **Managed PostgreSQL** - no infrastructure to manage
- ✅ **Built-in connection pooling** - handles Vercel serverless functions perfectly
- ✅ **Automatic backups** and point-in-time recovery
- ✅ **SSL/TLS** enabled by default
- ✅ **Easy to use** - just update `DATABASE_URL`
- ✅ **No VPN/tunnels needed** - works directly with Vercel

---

## 📋 Step-by-Step Migration

### Step 1: Create Supabase Account

1. Go to [supabase.com](https://supabase.com)
2. Sign up (free account is fine)
3. Create a new project:
   - **Name:** `yametee` (or your preferred name)
   - **Database Password:** Choose a strong password (save it!)
   - **Region:** Choose closest to your users (e.g., `Southeast Asia` for Philippines)
   - Click **Create new project**

### Step 2: Get Your Connection String

1. In Supabase dashboard, go to **Settings** → **Database**
2. Scroll to **Connection string** section
3. Select **URI** tab
4. Copy the connection string (looks like):
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.xxxxx.supabase.co:5432/postgres
   ```

**Important:** Replace `[YOUR-PASSWORD]` with the password you set when creating the project.

### Step 3: Export Data from Proxmox Database

On your **local machine** (or Proxmox container if you have access):

```bash
# Export entire database
pg_dump -h 192.168.120.6 -U itadmin -d yame_tee > yametee_backup.sql

# Or export specific tables only (if you want to be selective)
pg_dump -h 192.168.120.6 -U itadmin -d yame_tee \
  --table=products \
  --table=variants \
  --table=product_images \
  --table=customers \
  --table=orders \
  --table=order_items \
  --table=payments \
  --table=carts \
  --table=cart_items \
  --table=addresses \
  > yametee_backup.sql
```

### Step 4: Import Data to Supabase

**Option A: Via Supabase Dashboard (Easiest)**

1. Go to Supabase Dashboard → **SQL Editor**
2. Click **New query**
3. Open your `yametee_backup.sql` file
4. Copy the contents
5. Paste into SQL Editor
6. Click **Run** (or press Ctrl+Enter)

**Option B: Via Command Line**

```bash
# Install psql if needed
# macOS: brew install postgresql
# Linux: sudo apt install postgresql-client

# Import to Supabase
psql "postgresql://postgres:[YOUR-PASSWORD]@db.xxxxx.supabase.co:5432/postgres" < yametee_backup.sql
```

### Step 5: Run Prisma Migrations

Since Supabase uses standard PostgreSQL, your Prisma schema should work as-is:

```bash
# Generate Prisma Client (if needed)
npx prisma generate

# Push schema to Supabase (creates tables if they don't exist)
npx prisma db push --skip-generate

# OR run migrations
npx prisma migrate deploy
```

**Note:** If you already imported data, tables might exist. Prisma will handle this gracefully.

### Step 6: Update Vercel Environment Variables

1. Go to Vercel Dashboard → Your Project → **Settings** → **Environment Variables**
2. Update `DATABASE_URL`:
   - **Key:** `DATABASE_URL`
   - **Value:** Your Supabase connection string (from Step 2)
   - **Environment:** Select all (Production, Preview, Development)
3. Click **Save**

**Example connection string:**

```
postgresql://postgres:your-password@db.xxxxx.supabase.co:5432/postgres?schema=public&sslmode=require
```

### Step 7: Redeploy Vercel

After updating `DATABASE_URL`, redeploy:

```bash
vercel --prod
```

Or redeploy from Vercel dashboard.

### Step 8: Test Connection

1. Visit: `https://your-app.vercel.app/api/test-db`
2. Should show: `{"status": "connected", ...}`

---

## 🔧 Supabase Connection String Format

### Standard Connection (Direct)

```
postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
```

### With Connection Pooling (Recommended for Vercel)

```
postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres?schema=public&pgbouncer=true
```

**Example:**

```
postgresql://postgres.yyjppisykzofnkfirauj:!admin00@aws-1-ap-south-1.pooler.supabase.com:5432/postgres?schema=public&pgbouncer=true
```

**Note:** Supabase pooler uses port `5432` (not `6543`). The `?pgbouncer=true` parameter is required for Prisma compatibility.

**Benefits of Pooler:**

- Better for serverless functions (Vercel)
- Handles connection limits better
- Faster connection times

**How to get Pooler URL:**

1. Supabase Dashboard → **Settings** → **Database**
2. Scroll to **Connection pooling**
3. Copy the **Connection string** (Transaction mode)

---

## 📊 Supabase Free Tier Limits

- **Database Size:** 500 MB
- **Bandwidth:** 2 GB/month
- **API Requests:** 50,000/month
- **Database Connections:** 60 direct, unlimited via pooler

**For production:** Consider upgrading to Pro plan ($25/month) for:

- 8 GB database
- 50 GB bandwidth
- Better performance

---

## 🔄 Migration Checklist

- [ ] Created Supabase account and project
- [ ] Saved Supabase connection string
- [ ] Exported data from Proxmox database (`pg_dump`)
- [ ] Imported data to Supabase (via SQL Editor or `psql`)
- [ ] Ran Prisma migrations (`npx prisma db push`)
- [ ] Updated Vercel `DATABASE_URL` with Supabase connection string
- [ ] Used **pooler connection** for better performance
- [ ] Redeployed Vercel app
- [ ] Tested `/api/test-db` endpoint
- [ ] Verified data integrity (check products, orders, etc.)
- [ ] Updated PayMongo webhook URL (if needed)

---

## 🧪 Verify Migration

### Check Data in Supabase

1. Go to Supabase Dashboard → **Table Editor**
2. Verify tables exist:
   - `products`
   - `variants`
   - `product_images`
   - `customers`
   - `orders`
   - `order_items`
   - `payments`
   - `carts`
   - `cart_items`
   - `addresses`

### Test Your App

1. **Homepage:** Should show products
2. **Product Pages:** Should load correctly
3. **Cart:** Should work
4. **Checkout:** Should create orders
5. **Admin Panel:** Should load orders/products

---

## 🔒 Security Notes

- ✅ Supabase uses SSL/TLS by default (`sslmode=require`)
- ✅ Connection strings include authentication
- ✅ Free tier includes automatic backups
- ✅ Row Level Security (RLS) available if needed

---

## 🆘 Troubleshooting

### Error: "Connection refused"

- Check connection string format
- Verify password is correct
- Ensure you're using the right project reference

### Error: "Too many connections"

- Use **pooler connection** instead of direct connection
- Pooler URL: `postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543`

### Error: "Table already exists"

- Data was already imported
- Prisma will handle existing tables
- Or drop tables and re-import: `DROP TABLE IF EXISTS products CASCADE;`

### Error: "Authentication failed"

- Double-check password in connection string
- Reset password in Supabase Dashboard → Settings → Database

---

## 💡 Pro Tips

1. **Use Connection Pooling:** Always use the pooler URL for Vercel deployments
2. **Environment Variables:** Store connection string securely in Vercel
3. **Backup Regularly:** Supabase has automatic backups, but export important data periodically
4. **Monitor Usage:** Check Supabase dashboard for database size and bandwidth usage
5. **Upgrade When Needed:** Free tier is great for testing, upgrade for production traffic

---

## 🎯 Next Steps After Migration

1. ✅ Test all functionality
2. ✅ Update documentation with new `DATABASE_URL`
3. ✅ Consider keeping Proxmox database as backup (for a while)
4. ✅ Set up Supabase backups schedule
5. ✅ Monitor Supabase dashboard for performance

---

## 📚 Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Connection Pooling](https://supabase.com/docs/guides/database/connecting-to-postgres#connection-pooler)
- [Prisma with Supabase](https://www.prisma.io/docs/guides/deployment/deployment-guides/deploying-to-supabase)

---

**Ready to migrate? Start with Step 1!** 🚀
