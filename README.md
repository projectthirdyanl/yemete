# Yametee E-Commerce Platform

An anime-inspired Japanese streetwear e-commerce platform built with Next.js, PostgreSQL, and PayMongo integration.

## Features

- 🛍️ **Full E-Commerce Storefront**
  - Product catalog with size/color variants
  - Shopping cart functionality
  - Checkout flow with PayMongo integration
  - Order tracking and confirmation

- 🎨 **Anime-Inspired Design**
  - Black/Red/White color scheme
  - Modern, clean UI with smooth animations
  - Responsive design for all devices

- 👨‍💼 **Admin Dashboard**
  - Simple product management interface
  - Easy variant creation (size + color combinations)
  - Image upload and management
  - Order management

- 💳 **Payment Integration**
  - PayMongo integration for GCash, PayMaya, and card payments
  - Webhook handling for payment status updates
  - Automatic stock management

## Tech Stack

- **Frontend/Backend:** Next.js 14 (App Router) with TypeScript
- **Styling:** Tailwind CSS
- **Database:** PostgreSQL with Prisma ORM
- **Payments:** PayMongo API
- **Deployment:** Docker + Docker Compose (ready for Proxmox)

## Getting Started

### Prerequisites

- Node.js 20+ and npm
- PostgreSQL database (or use Docker Compose)
- PayMongo account and API keys

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd yametee
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and add your configuration:
   ```env
   DATABASE_URL="postgresql://user:password@localhost:5432/yametee?schema=public"
   PAYMONGO_SECRET_KEY="sk_test_..."
   PAYMONGO_PUBLIC_KEY="pk_test_..."
   PAYMONGO_WEBHOOK_SECRET="whsec_..."
   ADMIN_JWT_SECRET="generate-a-long-random-string"
   # Optional: override default (8h) admin session lifetime
   # ADMIN_SESSION_MAX_AGE=28800
   ```

4. **Set up the database**
   ```bash
   npx prisma generate
   npx prisma db push
   ```

5. **Create default admin user**
   ```bash
   # Seed default admin (recommended)
   npm run seed:admin
   
   # Or with custom credentials
   npm run seed:admin admin@example.com mypassword
   
   # Default credentials:
   # Email: admin@yametee.com
   # Password: admin123
   # ⚠️ Change password after first login!
   ```

6. **Run the development server**
   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser.

## Docker Deployment

### Using Docker Compose

1. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

2. **Build and run**
   ```bash
   docker-compose up -d
   ```

3. **Run database migrations**
   ```bash
   docker-compose exec app npx prisma db push
   ```

4. **Access the application**
   - Storefront: http://localhost:3000
   - Admin: http://localhost:3000/admin/login

### Multi-VM/CT Deployment (Proxmox)

For deploying across multiple VMs/CTs on Proxmox, see:
- **[Complete Deployment Guide](docs/DEPLOYMENT_GUIDE.md)** - Step-by-step multi-VM deployment instructions
- **[Proxmox README](proxmox/README.md)** - Architecture overview and configuration details

**Quick Update Script:**
```bash
# On web platform or worker VM
cd /path/to/yametee
sudo bash proxmox/quick-deploy.sh
```

### For Proxmox Deployment (Legacy)

1. Create a new VM or LXC container with Ubuntu Server
2. Install Docker and Docker Compose
3. Clone this repository
4. Configure environment variables
5. Run `docker-compose up -d`

## Project Structure

```
yametee/
├── app/                    # Next.js App Router pages
│   ├── admin/              # Admin dashboard pages
│   ├── api/                # API routes
│   ├── products/           # Product pages
│   ├── cart/               # Cart page
│   ├── checkout/           # Checkout page
│   └── order/              # Order confirmation
├── components/             # React components
├── lib/                    # Utility functions
│   ├── prisma.ts          # Prisma client
│   ├── auth.ts            # Authentication helpers
│   ├── paymongo.ts        # PayMongo integration
│   └── utils.ts           # General utilities
├── prisma/                 # Prisma schema and migrations
└── public/                 # Static assets
```

## Admin Usage

1. Navigate to `/admin/login`
2. Login with your admin credentials (first login will create the account)
3. Go to `/admin/products` to manage products
4. Click "Add Product" to create a new product
5. Select sizes and colors to auto-generate variants
6. Upload images and set prices/stock for each variant

## PayMongo Setup

1. Sign up for a PayMongo account at https://paymongo.com
2. Get your API keys from the dashboard
3. Set up a webhook endpoint pointing to: `https://yourdomain.com/api/webhooks/paymongo`
4. Add the webhook secret to your `.env` file

## Database Schema

The application uses the following main models:
- `Product` - Product information
- `Variant` - Size/color combinations with pricing and stock
- `ProductImage` - Product images
- `Customer` - Customer information
- `Address` - Shipping addresses
- `Order` - Order records
- `OrderItem` - Individual items in orders
- `Payment` - Payment records and webhook data

## Development

### Database Management

```bash
# Generate Prisma Client
npm run db:generate

# Push schema changes to database
npm run db:push

# Create migration
npm run db:migrate

# Open Prisma Studio (database GUI)
npm run db:studio
```

### Building for Production

```bash
npm run build
npm start
```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | Yes |
| `PAYMONGO_SECRET_KEY` | PayMongo secret API key | Yes |
| `PAYMONGO_PUBLIC_KEY` | PayMongo public API key | Yes |
| `PAYMONGO_WEBHOOK_SECRET` | PayMongo webhook secret | Yes |
| `ADMIN_JWT_SECRET` | Secret used to sign admin session tokens | Yes |
| `ADMIN_SESSION_MAX_AGE` | Custom admin session lifetime in seconds (defaults to 28800) | No |
| `REDIS_URL` | Redis connection URL (defaults to redis://192.168.120.44:6379) | No |
| `NEXTAUTH_URL` | Base URL for authentication callbacks | Yes |
| `NEXTAUTH_SECRET` | Secret for NextAuth session encryption | Yes |
| `MONITORING_ENABLED` | Enable monitoring and alerting (true/false) | No |
| `ALERT_WEBHOOK_URL` | Webhook URL for alerts (Slack, Discord, etc.) | No |
| `ALERT_ERROR_RATE_THRESHOLD` | Error rate threshold for alerts (default: 0.1) | No |
| `ALERT_RESPONSE_TIME_THRESHOLD` | Response time threshold in ms (default: 5000) | No |
| `ALERT_QUEUE_LENGTH_THRESHOLD` | Queue length threshold for alerts (default: 100) | No |

## Monitoring and Health Checks

The application includes built-in monitoring:

- **Health Check**: `GET /api/health` - Service health status
- **Metrics**: `GET /api/metrics` - Prometheus-compatible metrics

See [Monitoring Setup Guide](docs/MONITORING_SETUP.md) for detailed setup instructions.

## License

This project is proprietary software for Yametee.

## Support

For issues or questions, please contact the development team.
