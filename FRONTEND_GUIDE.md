# Frontend Development Guide - Yametee

## Architecture Principles

### Component-First Thinking

- **Reusable & Composable**: Every component should be self-contained and reusable
- **Single Responsibility**: Each component has one clear purpose
- **Props Interface**: Always define TypeScript interfaces for props
- **Default Props**: Provide sensible defaults where appropriate

### Performance Budgets

- **Target Load Time**: < 3 seconds on 3G connection
- **First Contentful Paint**: < 1.5s
- **Time to Interactive**: < 3.5s
- **Lighthouse Score**: > 90 for Performance, Accessibility, Best Practices

### Mobile-First Responsive Design

- Start with mobile styles, enhance for larger screens
- Breakpoints: `sm: 640px`, `md: 768px`, `lg: 1024px`, `xl: 1280px`, `2xl: 1536px`
- Touch targets: Minimum 44x44px
- Test on real devices, not just browser dev tools

### Accessibility (WCAG 2.1 AA Compliance)

- **Semantic HTML**: Use proper HTML5 elements (`<nav>`, `<main>`, `<article>`, etc.)
- **ARIA Labels**: All interactive elements must have accessible names
- **Keyboard Navigation**: Full functionality via keyboard only
- **Focus Management**: Visible focus indicators, logical tab order
- **Screen Readers**: Test with NVDA/JAWS/VoiceOver
- **Color Contrast**: Minimum 4.5:1 for text, 3:1 for UI components

## Component Patterns

### Standard Component Structure

````tsx
'use client'

import { memo, useCallback } from 'react'
import type { ComponentProps } from 'react'

interface ComponentNameProps {
  // Required props
  requiredProp: string
  // Optional props with defaults
  optionalProp?: boolean
  // Event handlers
  onClick?: () => void
  // Children
  children?: React.ReactNode
}

/**
 * ComponentName - Brief description
 *
 * @example
 * ```tsx
 * <ComponentName requiredProp="value" />
 * ```
 */
export const ComponentName = memo(function ComponentName({
  requiredProp,
  optionalProp = false,
  onClick,
  children,
}: ComponentNameProps) {
  const handleClick = useCallback(() => {
    onClick?.()
  }, [onClick])

  return (
    <div role="..." aria-label="..." onClick={handleClick} className="...">
      {children}
    </div>
  )
})
````

### Performance Optimization Patterns

#### 1. Memoization

```tsx
import { memo, useMemo } from 'react'

// Memoize expensive computations
const expensiveValue = useMemo(() => {
  return heavyCalculation(data)
}, [data])

// Memoize component to prevent unnecessary re-renders
export const ExpensiveComponent = memo(
  function ExpensiveComponent({ data }) {
    // ...
  },
  (prevProps, nextProps) => {
    // Custom comparison function
    return prevProps.data.id === nextProps.data.id
  }
)
```

#### 2. Code Splitting

```tsx
import dynamic from 'next/dynamic'

// Lazy load heavy components
const HeavyComponent = dynamic(() => import('./HeavyComponent'), {
  loading: () => <Skeleton />,
  ssr: false, // Only if component doesn't need SSR
})
```

#### 3. Image Optimization

```tsx
import Image from 'next/image'

;<Image
  src={imageUrl}
  alt="Descriptive alt text"
  width={800}
  height={600}
  loading="lazy" // Lazy load below fold
  placeholder="blur" // Use blur placeholder
  quality={85} // Optimize quality
/>
```

#### 4. Event Handler Optimization

```tsx
import { useCallback } from 'react'

// Memoize event handlers passed to child components
const handleClick = useCallback(
  (id: string) => {
    // Handler logic
  },
  [
    /* dependencies */
  ]
)
```

## State Management

### Context API Pattern

```tsx
'use client'

import { createContext, useContext, useReducer, useCallback } from 'react'

interface State {
  // State shape
}

type Action = { type: 'ACTION_TYPE'; payload: any }

const initialState: State = {
  // Initial state
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'ACTION_TYPE':
      return { ...state /* updates */ }
    default:
      return state
  }
}

const Context = createContext<{
  state: State
  dispatch: React.Dispatch<Action>
} | null>(null)

export function Provider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState)

  return <Context.Provider value={{ state, dispatch }}>{children}</Context.Provider>
}

export function useCustomHook() {
  const context = useContext(Context)
  if (!context) {
    throw new Error('useCustomHook must be used within Provider')
  }
  return context
}
```

### Server State (React Query Pattern)

For server state, prefer:

- Server Components when possible (Next.js 14)
- SWR or React Query for client-side server state
- Optimistic updates for better UX

## Styling Guidelines

### Tailwind CSS Best Practices

1. **Use Design Tokens**: Always use custom colors from `tailwind.config.ts`

   ```tsx
   // ✅ Good
   className = 'bg-yametee-red text-yametee-foreground'

   // ❌ Bad
   className = 'bg-red-500 text-gray-900'
   ```

2. **Responsive Classes**: Mobile-first approach

   ```tsx
   className = 'text-sm md:text-base lg:text-lg'
   ```

3. **Dark Mode**: Use `dark:` prefix for dark mode styles

   ```tsx
   className = 'bg-white dark:bg-yametee-gray'
   ```

4. **Custom Utilities**: Use `@layer utilities` in `globals.css` for reusable patterns

### CSS-in-JS (if needed)

For complex dynamic styles, consider:

- CSS Modules for component-scoped styles
- Styled-components only if Tailwind is insufficient

## Accessibility Checklist

### Every Component Should Have:

- [ ] Semantic HTML element (`<button>`, `<nav>`, `<main>`, etc.)
- [ ] Accessible name (`aria-label` or visible text)
- [ ] Keyboard navigation support
- [ ] Focus indicators
- [ ] ARIA roles where appropriate
- [ ] Proper heading hierarchy (h1 → h2 → h3)
- [ ] Alt text for images
- [ ] Form labels and error messages

### Interactive Elements:

- [ ] Focusable with keyboard (Tab)
- [ ] Activatable with keyboard (Enter/Space)
- [ ] Focus visible indicator
- [ ] Disabled state properly communicated

### Forms:

- [ ] All inputs have `<label>` elements
- [ ] Error messages associated with inputs (`aria-describedby`)
- [ ] Required fields marked (`aria-required` or `required`)
- [ ] Validation feedback accessible

## Testing Strategy

### Unit Tests

- Test component rendering
- Test user interactions
- Test edge cases
- Test accessibility

### Integration Tests

- Test component composition
- Test state management
- Test API interactions

### E2E Tests

- Critical user flows
- Cross-browser testing
- Mobile device testing

## Performance Monitoring

### Metrics to Track:

- **LCP** (Largest Contentful Paint): < 2.5s
- **FID** (First Input Delay): < 100ms
- **CLS** (Cumulative Layout Shift): < 0.1
- **TTFB** (Time to First Byte): < 600ms

### Tools:

- Lighthouse CI
- WebPageTest
- Chrome DevTools Performance
- React DevTools Profiler

## Code Quality

### TypeScript

- Strict mode enabled
- No `any` types (use `unknown` if needed)
- Proper type definitions for all props
- Use type guards for runtime checks

### ESLint Rules

- Follow Next.js recommended rules
- Custom rules for accessibility (`eslint-plugin-jsx-a11y`)
- Import order consistency

### Code Review Checklist

- [ ] TypeScript types are correct
- [ ] No console.logs in production code
- [ ] Error handling implemented
- [ ] Loading states handled
- [ ] Accessibility requirements met
- [ ] Performance optimizations applied
- [ ] Mobile responsive
- [ ] Dark mode support

## Component Library Structure

```
components/
  ui/              # Reusable UI primitives
    Button.tsx
    Card.tsx
    Badge.tsx
    Input.tsx
    Modal.tsx
  layout/          # Layout components
    Header.tsx
    Footer.tsx
  features/        # Feature-specific components
    ProductCard.tsx
    CartItem.tsx
  shared/          # Shared utilities/components
    LoadingSpinner.tsx
    ErrorBoundary.tsx
```

## Common Patterns

### Loading States

```tsx
{
  loading ? <Skeleton className="h-64 w-full" /> : <Content />
}
```

### Error States

```tsx
{
  error ? (
    <div role="alert" aria-live="polite">
      <p>Error: {error.message}</p>
    </div>
  ) : (
    <Content />
  )
}
```

### Empty States

```tsx
{
  items.length === 0 ? (
    <div className="text-center py-12">
      <p className="text-yametee-muted">No items found</p>
    </div>
  ) : (
    <ItemList items={items} />
  )
}
```

## Resources

- [React Documentation](https://react.dev)
- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [WCAG Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [Web.dev Performance](https://web.dev/performance/)
- [React TypeScript Cheatsheet](https://react-typescript-cheatsheet.netlify.app/)
