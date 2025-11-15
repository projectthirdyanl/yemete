# Quick Setup Guide

## Initial Setup (Development)

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env with your database URL, PayMongo keys, and ADMIN_JWT_SECRET
   ```
   - `ADMIN_JWT_SECRET` is required for signing secure admin sessions (use a long random string).
   - Optional: override session length via `ADMIN_SESSION_MAX_AGE` (seconds, defaults to 28800 / 8 hours).

3. **Set up database**
   ```bash
   npx prisma generate
   npx prisma db push
   ```

4. **Create admin user** (optional)
   ```bash
   npm run init:admin
   # Or login at /admin/login - first login creates the account
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```

## Docker Setup

1. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

2. **Start services**
   ```bash
   docker-compose up -d
   ```

3. **Run migrations**
   ```bash
   docker-compose exec app npx prisma db push
   ```

4. **Access**
   - Storefront: http://localhost:3000
   - Admin: http://localhost:3000/admin/login

## First Steps After Setup

1. **Login to Admin**
   - Go to http://localhost:3000/admin/login
   - Use any email/password (first login creates account)

2. **Create Your First Product**
   - Go to Admin → Products → Add Product
   - Fill in product details
   - Select sizes (S, M, L, XL, 2XL)
   - Select colors (Black, White, Red)
   - Set prices and stock for each variant
   - Upload product images
   - Set status to "Active"
   - Save

3. **Test the Storefront**
   - Visit http://localhost:3000
   - Browse products
   - Add items to cart
   - Test checkout flow

## PayMongo Configuration

1. **Get API Keys**
   - Sign up at https://paymongo.com
   - Go to Settings → API Keys
   - Copy Secret Key and Public Key

2. **Set up Webhook**
   - Go to Settings → Webhooks
   - Add webhook URL: `https://yourdomain.com/api/webhooks/paymongo`
   - Select events: `payment.paid`, `payment.failed`
   - Copy webhook secret

3. **Add to .env**
   ```env
   PAYMONGO_SECRET_KEY=sk_test_...
   PAYMONGO_PUBLIC_KEY=pk_test_...
   PAYMONGO_WEBHOOK_SECRET=whsec_...
   ```

## Troubleshooting

### Database Connection Issues
- Verify DATABASE_URL is correct
- Ensure PostgreSQL is running
- Check database credentials

### PayMongo Errors
- Verify API keys are correct
- Check webhook URL is accessible
- Ensure webhook secret matches

### Image Upload Issues
- Currently uses data URLs (base64)
- For production, configure cloud storage (S3, Cloudinary, etc.)
- Update image upload logic in ProductForm component

### Admin Login Not Working
- Clear browser cookies for the site (admin auth now uses HTTP-only cookies)
- Confirm `.env` has a strong `ADMIN_JWT_SECRET` and restart the dev server after changes
- Try creating admin via: `npm run init:admin`
- Check database connection

## Production Deployment

1. **Update environment variables**
   - Use production PayMongo keys
   - Set NEXTAUTH_URL to your domain
   - Use strong NEXTAUTH_SECRET

2. **Configure image storage**
   - Set up cloud storage (S3, Cloudinary)
   - Update image upload in ProductForm
   - Update image URLs in database

3. **Set up SSL**
   - Configure nginx reverse proxy
   - Use Let's Encrypt for SSL
   - Update NEXTAUTH_URL to HTTPS

4. **Database backups**
   - Set up regular PostgreSQL backups
   - Store backups securely

5. **Monitoring**
   - Set up error tracking (Sentry, etc.)
   - Monitor PayMongo webhook deliveries
   - Track order completion rates
