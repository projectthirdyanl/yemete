# 🚀 Migration Roadmap: Next.js 14 Monolith → Enterprise Architecture 2025

**Current State**: Next.js 14 monolith with API routes, Context API, Prisma + PostgreSQL  
**Target State**: Enterprise-grade monorepo with Next.js 16, NestJS backend, React Query, Zustand, Redis, BullMQ, Cloudflare infrastructure

**Migration Strategy**: Incremental, low-risk, feature-flag driven migration with rollback capabilities at each phase.

---

## 📊 Migration Overview

| Phase       | Focus                         | Duration  | Risk Level | Business Impact          |
| ----------- | ----------------------------- | --------- | ---------- | ------------------------ |
| **Phase 0** | Foundation & Preparation      | 2-3 weeks | Low        | Low (prep work)          |
| **Phase 1** | Frontend Modernization        | 4-6 weeks | Medium     | High (UX improvements)   |
| **Phase 2** | State Management Migration    | 3-4 weeks | Medium     | Medium (performance)     |
| **Phase 3** | API Standardization           | 2-3 weeks | Low        | Medium (maintainability) |
| **Phase 4** | Backend Extraction            | 6-8 weeks | High       | High (scalability)       |
| **Phase 5** | Infrastructure & Queue System | 4-6 weeks | High       | High (reliability)       |
| **Phase 6** | Monitoring & Optimization     | 2-3 weeks | Low        | Medium (observability)   |

**Total Estimated Duration**: 23-33 weeks (~6-8 months)

---

## 🎯 Phase 0: Foundation & Preparation (Weeks 1-3)

### Objectives

- Set up monorepo structure
- Create shared type definitions
- Establish development standards
- Set up CI/CD foundation

### Tasks

#### 0.1 Monorepo Setup

- [ ] Initialize Turborepo or Nx workspace
- [ ] Create folder structure:
  ```
  yametee/
  ├── apps/
  │   └── frontend/          # Current Next.js app (migrated)
  ├── packages/
  │   ├── types/            # Shared TypeScript types
  │   ├── ui/               # Shared UI components
  │   ├── utils/            # Shared utilities
  │   └── config/           # Shared configs
  ├── turbo.json
  └── package.json
  ```
- [ ] Configure workspace dependencies
- [ ] Set up build scripts

**Success Criteria**: Monorepo builds successfully, all existing code works

#### 0.2 Shared Type Definitions

- [ ] Create `packages/types/src/index.ts` with:
  - API request/response types
  - Database model types (from Prisma)
  - Domain entity types
  - Common enums and constants
- [ ] Export Prisma types as shared package
- [ ] Update existing code to use shared types

**Success Criteria**: Zero duplicate type definitions, all imports resolve

#### 0.3 Development Standards

- [ ] Set up ESLint + Prettier configs
- [ ] Create `.editorconfig`
- [ ] Document coding standards
- [ ] Set up pre-commit hooks (Husky)
- [ ] Configure path aliases (`@/` imports)

**Success Criteria**: Consistent code style, automated formatting

#### 0.4 CI/CD Foundation

- [ ] Set up GitHub Actions workflows
- [ ] Configure build pipelines
- [ ] Set up test framework (Jest + React Testing Library)
- [ ] Create deployment scripts

**Success Criteria**: Automated builds, tests run on PR

### Dependencies

- None (foundation phase)

### Rollback Plan

- Keep current structure as `legacy/` folder
- Can revert git commits if needed

---

## 🎨 Phase 1: Frontend Modernization (Weeks 4-9)

### Objectives

- Upgrade to Next.js 16
- Integrate shadcn/ui components
- Migrate to React Query for server state
- Improve component architecture

### Tasks

#### 1.1 Next.js 16 Upgrade

- [ ] Upgrade Next.js: `14.2.5` → `16.x`
- [ ] Update React: `18.3.1` → `19.x` (if compatible)
- [ ] Test all pages and API routes
- [ ] Update middleware for Next.js 16
- [ ] Fix breaking changes:
  - App Router changes
  - Image component updates
  - Metadata API changes
  - Server Components behavior

**Success Criteria**: All pages render, no console errors, build succeeds

#### 1.2 shadcn/ui Integration

- [ ] Install shadcn/ui: `npx shadcn-ui@latest init`
- [ ] Configure Tailwind CSS 4.1.x
- [ ] Migrate existing components to shadcn/ui:
  - Button → `components/ui/button.tsx`
  - Input → `components/ui/input.tsx`
  - Card → `components/ui/card.tsx`
  - Dialog → `components/ui/dialog.tsx`
  - Form → `components/ui/form.tsx`
  - Table → `components/ui/table.tsx`
- [ ] Create custom components using shadcn/ui primitives
- [ ] Update admin dashboard with shadcn/ui components

**Success Criteria**: UI looks identical/better, component library established

#### 1.3 React Query v5 Setup

- [ ] Install: `@tanstack/react-query@^5.x`
- [ ] Create `lib/react-query.ts`:

  ```typescript
  import { QueryClient } from '@tanstack/react-query'

  export const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000,
        retry: 1,
      },
    },
  })
  ```

- [ ] Wrap app with `QueryClientProvider`
- [ ] Create custom hooks:
  - `hooks/useProducts.ts`
  - `hooks/useCart.ts`
  - `hooks/useOrders.ts`
  - `hooks/useAdminProducts.ts`
- [ ] Migrate Context API → React Query gradually:
  - Start with read-only data (products)
  - Then cart (hybrid: React Query + Context)
  - Finally admin data

**Success Criteria**: All data fetching uses React Query, cache works correctly

#### 1.4 Component Architecture

- [ ] Refactor components into:
  - `components/ui/` - shadcn/ui components
  - `components/features/` - Feature-specific components
  - `components/layout/` - Layout components
- [ ] Create reusable patterns:
  - Loading states
  - Error boundaries
  - Empty states
  - Form validation
- [ ] Add Storybook (optional) for component documentation

**Success Criteria**: Component structure is clear, reusable patterns established

### Dependencies

- Phase 0 complete

### Rollback Plan

- Feature flags for React Query usage
- Keep Context API as fallback
- Can revert Next.js upgrade via git

### Testing Strategy

- Visual regression testing
- E2E tests for critical flows (cart, checkout)
- Component unit tests

---

## 🔄 Phase 2: State Management Migration (Weeks 10-13)

### Objectives

- Migrate from Context API to Zustand
- Implement proper state management patterns
- Optimize re-renders

### Tasks

#### 2.1 Zustand v5 Setup

- [ ] Install: `zustand@^5.x`
- [ ] Create store structure:
  ```
  stores/
  ├── cart.store.ts
  ├── auth.store.ts
  ├── ui.store.ts
  └── index.ts
  ```
- [ ] Create cart store:
  ```typescript
  interface CartStore {
    items: CartItem[]
    addItem: (variantId: string, quantity: number) => Promise<void>
    removeItem: (itemId: string) => void
    updateQuantity: (itemId: string, quantity: number) => Promise<void>
    clearCart: () => void
  }
  ```
- [ ] Migrate CartContext → Zustand store
- [ ] Update components to use store

**Success Criteria**: Cart works identically, fewer re-renders

#### 2.2 Auth Store Migration

- [ ] Create auth store for admin authentication
- [ ] Migrate admin session management
- [ ] Implement token refresh logic
- [ ] Add auth guards using Zustand

**Success Criteria**: Admin auth works, session persists correctly

#### 2.3 UI State Management

- [ ] Create UI store for:
  - Theme (dark/light mode)
  - Sidebar state
  - Modal states
  - Toast notifications
- [ ] Migrate ThemeContext → Zustand
- [ ] Migrate ToastContext → Zustand

**Success Criteria**: All UI state managed in Zustand, no Context API remaining

#### 2.4 Performance Optimization

- [ ] Use Zustand selectors to prevent unnecessary re-renders
- [ ] Implement middleware for:
  - Persistence (localStorage)
  - DevTools integration
  - Logging
- [ ] Profile and optimize re-render cycles

**Success Criteria**: Reduced re-renders, improved performance metrics

### Dependencies

- Phase 1 complete (React Query setup)

### Rollback Plan

- Keep Context API code commented out
- Feature flag to switch between Context/Zustand

---

## 🔌 Phase 3: API Standardization (Weeks 14-16)

### Objectives

- Standardize API response formats
- Create centralized API client
- Add request/response validation
- Improve error handling

### Tasks

#### 3.1 API Response Standardization

- [ ] Create standard response types:

  ```typescript
  interface ApiResponse<T> {
    success: boolean
    data?: T
    error?: string
    message?: string
  }

  interface PaginatedResponse<T> {
    data: T[]
    pagination: {
      page: number
      limit: number
      total: number
      totalPages: number
    }
  }
  ```

- [ ] Update all API routes to use standard format
- [ ] Create response helpers:
  ```typescript
  export function successResponse<T>(data: T, message?: string)
  export function errorResponse(error: string, status: number)
  export function paginatedResponse<T>(data: T[], pagination: Pagination)
  ```

**Success Criteria**: All APIs return consistent format

#### 3.2 API Client Layer

- [ ] Create `lib/api-client.ts`:
  ```typescript
  class ApiClient {
    private baseURL: string
    async get<T>(path: string): Promise<ApiResponse<T>>
    async post<T>(path: string, data: any): Promise<ApiResponse<T>>
    async put<T>(path: string, data: any): Promise<ApiResponse<T>>
    async delete<T>(path: string): Promise<ApiResponse<T>>
  }
  ```
- [ ] Add interceptors for:
  - Auth token injection
  - Error handling
  - Request/response logging
  - Retry logic
- [ ] Create typed API methods:
  - `api.products.get()`
  - `api.cart.add()`
  - `api.admin.products.create()`

**Success Criteria**: All API calls go through client, consistent error handling

#### 3.3 Zod Validation

- [ ] Create Zod schemas for all API endpoints:
  ```typescript
  export const createProductSchema = z.object({
    name: z.string().min(1).max(200),
    slug: z.string().regex(/^[a-z0-9-]+$/),
    // ...
  })
  ```
- [ ] Add validation middleware to API routes
- [ ] Validate request bodies
- [ ] Return clear validation errors

**Success Criteria**: All inputs validated, clear error messages

#### 3.4 Error Handling

- [ ] Create error types:
  ```typescript
  class ApiError extends Error {
    status: number
    code: string
    details?: any
  }
  ```
- [ ] Implement error boundaries
- [ ] Add error logging (Sentry integration)
- [ ] Create user-friendly error messages

**Success Criteria**: Errors handled gracefully, logged properly

### Dependencies

- Phase 1 complete (shared types)

### Rollback Plan

- Keep old API routes, route new ones via feature flag

---

## 🏗️ Phase 4: Backend Extraction (Weeks 17-24)

### Objectives

- Extract API routes to NestJS backend
- Set up microservices architecture
- Implement proper authentication
- Migrate database access layer

### Tasks

#### 4.1 NestJS Backend Setup

- [ ] Create `apps/backend-api/` directory
- [ ] Initialize NestJS 11 project:
  ```bash
  nest new backend-api
  ```
- [ ] Configure:
  - Prisma module
  - CORS
  - Validation (class-validator)
  - Swagger/OpenAPI
  - Environment config
- [ ] Set up project structure:
  ```
  backend-api/
  ├── src/
  │   ├── modules/
  │   │   ├── auth/
  │   │   ├── products/
  │   │   ├── orders/
  │   │   ├── cart/
  │   │   └── admin/
  │   ├── common/
  │   │   ├── guards/
  │   │   ├── interceptors/
  │   │   ├── filters/
  │   │   └── decorators/
  │   └── config/
  ```

**Success Criteria**: NestJS app runs, connects to database

#### 4.2 Module Migration (Incremental)

Migrate one module at a time:

**4.2.1 Auth Module**

- [ ] Create `auth.module.ts`
- [ ] Implement:
  - Login endpoint
  - Session management
  - JWT token generation
  - Admin guard
- [ ] Test with frontend

**4.2.2 Products Module**

- [ ] Create `products.module.ts`
- [ ] Implement:
  - GET `/products` (list)
  - GET `/products/:id` (detail)
  - POST `/admin/products` (create)
  - PUT `/admin/products/:id` (update)
  - DELETE `/admin/products/:id` (delete)
- [ ] Migrate Prisma queries
- [ ] Add validation
- [ ] Test with frontend

**4.2.3 Cart Module**

- [ ] Create `cart.module.ts`
- [ ] Implement cart endpoints
- [ ] Migrate session-based cart logic
- [ ] Test with frontend

**4.2.4 Orders Module**

- [ ] Create `orders.module.ts`
- [ ] Implement order creation
- [ ] Migrate checkout logic
- [ ] Test with frontend

**4.2.5 Admin Module**

- [ ] Create `admin.module.ts`
- [ ] Migrate all admin endpoints:
  - Products management
  - Orders management
  - Customers management
  - Stats endpoint
- [ ] Test admin dashboard

**Success Criteria**: All endpoints migrated, frontend works with backend

#### 4.3 Authentication & Authorization

- [ ] Implement Auth.js (NextAuth v4) or custom JWT
- [ ] Create auth guards:
  - `JwtAuthGuard` - Verify JWT token
  - `AdminGuard` - Check admin role
- [ ] Implement role-based access control (RBAC)
- [ ] Add rate limiting per endpoint
- [ ] Implement refresh token flow

**Success Criteria**: Secure authentication, proper authorization

#### 4.4 Database Access Layer

- [ ] Create Prisma service:
  ```typescript
  @Injectable()
  export class PrismaService extends PrismaClient {
    async onModuleInit() {
      await this.$connect()
    }
    async onModuleDestroy() {
      await this.$disconnect()
    }
  }
  ```
- [ ] Create repositories for each entity:
  - `ProductsRepository`
  - `OrdersRepository`
  - `CartRepository`
- [ ] Migrate all Prisma queries to repositories
- [ ] Add database transaction support

**Success Criteria**: Clean data access layer, transactions work

#### 4.5 API Gateway Setup

- [ ] Set up Cloudflare Tunnel or API Gateway
- [ ] Configure routing:
  - Frontend → Vercel
  - `/api/*` → NestJS backend
- [ ] Set up SSL/TLS
- [ ] Configure CORS properly

**Success Criteria**: API routes accessible, secure connection

#### 4.6 Frontend API Migration

- [ ] Update API client base URL
- [ ] Point to NestJS backend
- [ ] Test all endpoints
- [ ] Handle CORS issues
- [ ] Update error handling

**Success Criteria**: Frontend works with new backend

### Dependencies

- Phase 3 complete (API standardization)
- Infrastructure ready (Phase 5.1)

### Rollback Plan

- Keep Next.js API routes as fallback
- Feature flag to switch between Next.js API / NestJS backend
- Can route specific endpoints gradually

### Testing Strategy

- Integration tests for each module
- E2E tests for critical flows
- Load testing for API endpoints

---

## ⚡ Phase 5: Infrastructure & Queue System (Weeks 25-30)

### Objectives

- Set up Redis caching
- Implement BullMQ job queues
- Configure Cloudflare infrastructure
- Set up file storage (R2)

### Tasks

#### 5.1 Redis Setup

- [ ] Deploy Redis 7.4 container (Docker)
- [ ] Install `ioredis` or `@redis/client`
- [ ] Create Redis service:
  ```typescript
  @Injectable()
  export class RedisService {
    private client: Redis
    async get<T>(key: string): Promise<T | null>
    async set(key: string, value: any, ttl?: number): Promise<void>
    async del(key: string): Promise<void>
  }
  ```
- [ ] Implement caching for:
  - Product listings (5 min TTL)
  - Product details (10 min TTL)
  - Admin stats (1 min TTL)
- [ ] Add cache invalidation on updates

**Success Criteria**: Cache reduces database load, faster responses

#### 5.2 BullMQ Queue System

- [ ] Install `bullmq` and `@nestjs/bullmq`
- [ ] Set up Redis connection for queues
- [ ] Create queues:
  ```
  queues/
  ├── email.queue.ts
  ├── order.queue.ts
  ├── image.queue.ts
  └── webhook.queue.ts
  ```
- [ ] Create processors:
  ```
  processors/
  ├── email.processor.ts      # Send order confirmations
  ├── order.processor.ts       # Process orders
  ├── image.processor.ts       # Resize/optimize images
  └── webhook.processor.ts     # Handle PayMongo webhooks
  ```
- [ ] Migrate async tasks:
  - Order confirmation emails → email queue
  - PayMongo webhooks → webhook queue
  - Image processing → image queue
- [ ] Set up workers:
  ```
  apps/workers/
  ├── src/
  │   ├── queues/
  │   ├── processors/
  │   └── main.ts
  ```

**Success Criteria**: All async tasks use queues, workers process jobs

#### 5.3 Cloudflare R2 Storage

- [ ] Set up Cloudflare R2 bucket
- [ ] Install `@aws-sdk/client-s3` (R2 compatible)
- [ ] Create storage service:
  ```typescript
  @Injectable()
  export class StorageService {
    async uploadFile(file: Buffer, key: string): Promise<string>
    async deleteFile(key: string): Promise<void>
    getPublicUrl(key: string): string
  }
  ```
- [ ] Migrate image uploads to R2
- [ ] Update product image URLs
- [ ] Set up CDN for images

**Success Criteria**: Images stored in R2, CDN working

#### 5.4 Cloudflare Zero Trust Setup

- [ ] Configure Cloudflare Tunnel
- [ ] Set up private network routing
- [ ] Configure WAF rules:
  - SQL injection protection
  - XSS protection
  - Rate limiting
  - Bot mitigation
- [ ] Set up access policies
- [ ] Test secure backend access

**Success Criteria**: Backend accessible only via tunnel, WAF active

#### 5.5 Database Optimization

- [ ] Set up PgBouncer for connection pooling
- [ ] Configure connection limits
- [ ] Add database indexes (if needed)
- [ ] Set up TimescaleDB for analytics (optional)
- [ ] Configure backup strategy

**Success Criteria**: Database handles load, connections pooled

### Dependencies

- Phase 4 complete (backend extraction)
- Infrastructure access (Proxmox/Docker)

### Rollback Plan

- Keep file uploads working with current storage
- Queues can be disabled via feature flag
- Redis cache can be bypassed

---

## 📊 Phase 6: Monitoring & Optimization (Weeks 31-33)

### Objectives

- Set up comprehensive monitoring
- Implement error tracking
- Optimize performance
- Document everything

### Tasks

#### 6.1 Sentry Integration

- [ ] Install Sentry SDKs:
  - `@sentry/nextjs` (frontend)
  - `@sentry/node` (backend)
- [ ] Configure error tracking
- [ ] Set up release tracking
- [ ] Configure alerting rules
- [ ] Test error reporting

**Success Criteria**: Errors tracked, alerts configured

#### 6.2 Grafana + Prometheus

- [ ] Deploy Prometheus
- [ ] Deploy Grafana
- [ ] Set up metrics collection:
  - API response times
  - Database query times
  - Redis cache hit rates
  - Queue job processing times
  - Error rates
- [ ] Create dashboards:
  - API performance
  - Database metrics
  - Queue metrics
  - System health
- [ ] Set up alerting

**Success Criteria**: Metrics visible, dashboards created

#### 6.3 Uptime Kuma

- [ ] Deploy Uptime Kuma
- [ ] Configure monitors:
  - Frontend (Vercel)
  - Backend API health
  - Database connectivity
  - Redis connectivity
- [ ] Set up notifications
- [ ] Test downtime detection

**Success Criteria**: Uptime monitoring active, alerts working

#### 6.4 Performance Optimization

- [ ] Profile application:
  - Frontend bundle size
  - API response times
  - Database queries
  - Cache hit rates
- [ ] Optimize:
  - Code splitting
  - Image optimization
  - Database indexes
  - Cache strategies
  - API response caching
- [ ] Run load tests
- [ ] Optimize based on results

**Success Criteria**: Performance metrics improved, load tests pass

#### 6.5 Documentation

- [ ] Document architecture
- [ ] API documentation (Swagger/OpenAPI)
- [ ] Deployment guides
- [ ] Runbooks for common issues
- [ ] Developer onboarding guide
- [ ] Update README

**Success Criteria**: Complete documentation, team can operate system

### Dependencies

- All previous phases complete

### Rollback Plan

- Monitoring can be disabled without affecting functionality

---

## 🎯 Success Metrics

### Performance

- [ ] API response time < 200ms (p95)
- [ ] Frontend First Contentful Paint < 1.5s
- [ ] Database query time < 50ms (p95)
- [ ] Cache hit rate > 80%

### Reliability

- [ ] Uptime > 99.9%
- [ ] Error rate < 0.1%
- [ ] Queue job success rate > 99%

### Developer Experience

- [ ] Build time < 2 minutes
- [ ] Test coverage > 80%
- [ ] TypeScript strict mode enabled
- [ ] All APIs documented

### Business Metrics

- [ ] Checkout completion rate maintained/improved
- [ ] Admin productivity improved
- [ ] Zero data loss during migration

---

## 🚨 Risk Mitigation

### High-Risk Areas

1. **Backend Extraction (Phase 4)**
   - Risk: Downtime, breaking changes
   - Mitigation: Gradual migration, feature flags, parallel running

2. **Database Migration**
   - Risk: Data loss, schema conflicts
   - Mitigation: Backups, migrations in transactions, rollback scripts

3. **Infrastructure Changes**
   - Risk: Service disruption
   - Mitigation: Staging environment, gradual rollout, monitoring

### Rollback Procedures

- Each phase has rollback plan
- Keep old code in `legacy/` folder
- Feature flags for gradual rollout
- Database backups before each phase
- Git tags at each phase completion

---

## 📅 Timeline Summary

```
Weeks 1-3:   Phase 0 - Foundation
Weeks 4-9:   Phase 1 - Frontend Modernization
Weeks 10-13: Phase 2 - State Management
Weeks 14-16: Phase 3 - API Standardization
Weeks 17-24: Phase 4 - Backend Extraction
Weeks 25-30: Phase 5 - Infrastructure
Weeks 31-33: Phase 6 - Monitoring

Total: 23-33 weeks (6-8 months)
```

---

## 👥 Team Requirements

### Recommended Team Structure

- **1-2 Frontend Developers** (Phases 1-2)
- **1-2 Backend Developers** (Phases 3-4)
- **1 DevOps Engineer** (Phases 5-6)
- **1 QA Engineer** (All phases)

### Skills Needed

- Next.js 16, React 19
- NestJS, TypeScript
- Redis, BullMQ
- Docker, Cloudflare
- Monitoring tools

---

## 📝 Next Steps

1. **Review & Approve Roadmap**
   - Stakeholder review
   - Resource allocation
   - Timeline confirmation

2. **Set Up Phase 0**
   - Initialize monorepo
   - Create shared types
   - Set up CI/CD

3. **Begin Phase 1**
   - Next.js 16 upgrade
   - shadcn/ui integration
   - React Query setup

---

## 🔗 Related Documents

- `webapp_architecture_blueprint.md` - Target architecture
- `PROJECT_SUMMARY.md` - Current state
- `FRONTEND_GUIDE.md` - Frontend patterns
- `SETUP.md` - Setup instructions

---

**Last Updated**: 2025-01-XX  
**Status**: Draft - Awaiting Approval  
**Owner**: Development Team
