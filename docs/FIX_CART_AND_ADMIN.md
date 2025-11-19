# Fix Cart and Admin Issues

## Issues Fixed

1. ✅ **Cart API Response Format** - Fixed mismatch between API and frontend
2. ✅ **Product Loading Performance** - Added limits and filters
3. ✅ **Admin Account Creation** - Script provided

## Step 1: Fix Cart Issue

The cart API was returning `{success: true, data: {items: [...]}}` but the frontend expected `{items: [...]}`. This has been fixed in the code.

**After deploying the fix:**
- Cart should work correctly
- Items will actually be added to cart
- Cart will persist across page reloads

## Step 2: Create Admin Account

Run this on your **web platform VM**:

```bash
cd /opt/apps/yemete

# Option 1: Use the seed script (recommended)
npm run seed:admin

# Or with custom credentials
npm run seed:admin admin@example.com mypassword

# Option 2: Use the create-admin script
bash proxmox/create-admin-account.sh
```

**Default credentials:**
- Email: `admin@yametee.com`
- Password: `admin123`

⚠️ **Change password after first login!**

## Step 3: Optimize Performance

The product loading has been optimized with:
- Limit of 50 products per page
- Only show variants with stock
- Better query optimization

**Additional performance improvements you can make:**

### Add Database Indexes

Run these SQL commands on your database:

```sql
-- Index for products
CREATE INDEX IF NOT EXISTS idx_product_status ON "Product"(status);
CREATE INDEX IF NOT EXISTS idx_product_created_at ON "Product"("createdAt");

-- Index for variants
CREATE INDEX IF NOT EXISTS idx_variant_stock ON "Variant"("stockQuantity");
CREATE INDEX IF NOT EXISTS idx_variant_product ON "Variant"("productId");

-- Index for cart items
CREATE INDEX IF NOT EXISTS idx_cartitem_cart ON "CartItem"("cartId");
CREATE INDEX IF NOT EXISTS idx_cartitem_variant ON "CartItem"("variantId");

-- Index for images
CREATE INDEX IF NOT EXISTS idx_productimage_product ON "ProductImage"("productId");
CREATE INDEX IF NOT EXISTS idx_productimage_primary ON "ProductImage"("isPrimary");
```

### Enable Redis Caching

Make sure Redis is configured in your `.env`:

```bash
REDIS_URL="redis://192.168.120.44:6379"
```

## Step 4: Deploy the Fixes

After making the code changes, deploy:

```bash
cd /opt/apps/yemete

# Pull latest changes
git pull

# Update and rebuild
bash proxmox/quick-deploy.sh
```

Or manually:

```bash
cd /opt/apps/yemete
git pull
npm ci --production=false
npx prisma generate
npm run build
systemctl restart yametee-web
```

## Step 5: Verify Everything Works

### Test Cart
1. Go to products page
2. Click "Add to Cart" on a product
3. Check cart icon - should show item count
4. Go to cart page - items should be there
5. Refresh page - items should persist

### Test Admin Login
1. Go to `/admin/login`
2. Login with credentials created in Step 2
3. Should redirect to admin dashboard

### Check Performance
1. Open browser DevTools (F12)
2. Go to Network tab
3. Load products page
4. Check load time - should be < 2 seconds

## Troubleshooting

### Cart Still Not Working

Check browser console for errors:
```javascript
// Open browser console (F12)
// Look for errors related to /api/cart
```

Check server logs:
```bash
journalctl -u yametee-web -f
```

Test API directly:
```bash
curl http://localhost:3000/api/cart
```

### Admin Login Fails

1. Verify admin account exists:
```bash
cd /opt/apps/yemete
npx prisma studio
# Check Customer table for admin user
```

2. Check admin login endpoint:
```bash
curl -X POST http://localhost:3000/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@yametee.com","password":"admin123"}'
```

3. Check JWT secret in .env:
```bash
grep ADMIN_JWT_SECRET /opt/apps/yemete/.env
```

### Products Loading Slowly

1. Check database connection:
```bash
psql "postgresql://itadmin:thirdynalforever@192.168.120.6:5432/yame_tee" -c "SELECT COUNT(*) FROM \"Product\""
```

2. Check if indexes exist:
```sql
SELECT indexname FROM pg_indexes WHERE tablename = 'Product';
```

3. Check Redis connection:
```bash
redis-cli -h 192.168.120.44 ping
```

4. Check server resources:
```bash
htop
# or
free -h
```

## Next Steps

1. ✅ Deploy the fixes
2. ✅ Create admin account
3. ✅ Add database indexes
4. ✅ Test cart functionality
5. ✅ Test admin login
6. ✅ Monitor performance

If issues persist, check the logs and share the error messages.
