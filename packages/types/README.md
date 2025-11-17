# @yametee/types

Shared TypeScript types for the Yametee e-commerce platform.

## Installation

This package is part of the Yametee monorepo and is automatically available via workspace linking.

```bash
# Install dependencies (from root)
npm install
```

## Usage

```typescript
import type {
  ApiResponse,
  ProductResponse,
  CartResponse,
  CreateProductRequest,
} from '@yametee/types'
```

## Types Included

### API Types

- `ApiResponse<T>` - Standard API response wrapper
- `PaginatedResponse<T>` - Paginated data responses
- Product types (Create, Update, Response)
- Cart types (Request, Response, Items)
- Order types (Request, Response, Items)
- Admin types (Login, Session, Stats)

### Database Types

- Prisma model types (Product, Variant, Order, etc.)
- Helper types for common query patterns
- Type-safe database operations

## Development

```bash
# Type check
npm run type-check

# Build
npm run build
```

## Notes

- This package depends on `@prisma/client` which must be generated first
- Run `npm run db:generate` from the root before using these types
- Types are automatically exported from `src/index.ts`
