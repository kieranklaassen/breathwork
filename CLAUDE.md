# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **Satūs** (Next.js 16 + React 19.2) application starter by darkroom.engineering. Satūs is a modern, high-performance React application with advanced WebGL capabilities, Tailwind CSS v4, and cutting-edge React features.

**Tech Stack:**
- Next.js 16.0.1 with App Router, Turbopack, Cache Components
- React 19.2.0 with Activity component, useEffectEvent, cacheSignal
- React Compiler (automatic optimization - no manual memoization)
- TypeScript with strict mode
- Tailwind CSS 4.1.16 (CSS-first configuration)
- Bun as package manager and runtime
- Biome 2.3.3 for linting and formatting

## Development Commands

```bash
# Development
bun dev                     # Start dev server with Turbopack
bun dev:https               # Start dev server with HTTPS
bun build                   # Production build
bun start                   # Start production server

# Code Quality
bun lint                    # Run Biome linter
bun lint:fix                # Fix linting issues
bun format                  # Format code with Biome
bun typecheck               # TypeScript validation

# Utilities
bun setup:styles            # Generate style files (runs automatically in dev)
bun validate:env            # Check environment variables
bun cleanup:integrations    # List unused integrations for removal
bun analyze                 # Bundle analysis

# Sanity CMS
bun sanity:schema-extract   # Extract Sanity schema
bun sanity:typegen          # Generate TypeScript types from Sanity schema
```

## Testing

```bash
# Run all tests (if configured)
bun test

# Type checking (most important for this codebase)
bun typecheck
```

## Code Architecture

### Path Aliases

All imports use the `~/` prefix to reference the project root:

```tsx
import { Link } from '~/components/link'
import { sanityFetch } from '~/integrations/sanity/live'
import { metadata } from '~/libs/metadata'
```

### Directory Structure

```
breathwork/
├── app/                    # Next.js App Router
│   ├── (pages)/           # Route groups for pages
│   │   ├── (components)/  # Shared layout components (footer, nav, etc.)
│   │   ├── home/          # Home page
│   │   ├── shopify/       # Shopify integration demos
│   │   ├── sanity/        # Sanity CMS demos
│   │   └── r3f/           # React Three Fiber demos
│   ├── api/               # API routes (draft-mode, revalidate)
│   ├── studio/            # Sanity Studio (if Sanity configured)
│   └── layout.tsx         # Root layout
├── components/            # Reusable UI components
├── hooks/                 # Custom React hooks
├── integrations/          # Third-party integrations
│   ├── sanity/           # Headless CMS
│   ├── shopify/          # E-commerce
│   ├── hubspot/          # Forms/marketing
│   ├── mailchimp/        # Email marketing
│   └── mandrill/         # Transactional emails
├── libs/                  # Utility functions
├── orchestra/             # Debug tools (CMD+O in dev)
├── styles/                # Global styles and CSS system
├── webgl/                 # WebGL/Three.js components
└── public/                # Static assets
```

### React Compiler & Memoization

**React Compiler is enabled (`reactCompiler: true`)** - this automatically optimizes re-renders and memoization.

**DO NOT use:**
- `useMemo` for computations
- `useCallback` for function memoization
- `React.memo` for component memoization

**Exception:** Use `useRef` for object instantiation to prevent infinite loops:

```tsx
// ❌ Bad: Creates new object every render
const options = { foo: 'bar' }

// ✅ Good: Stable reference
const options = useRef({ foo: 'bar' }).current
```

### Images & Links

**Always use custom components, never Next.js defaults:**

```tsx
// ✅ Correct
import { Link } from '~/components/link'        // Smart link with auto-detection
import { Image } from '~/components/image'      // For DOM
import { Image } from '~/webgl/components/image' // For WebGL contexts

// ❌ Never use
import Link from 'next/link'
import Image from 'next/image'
```

The custom Link component:
- Auto-detects external vs internal links
- Smart prefetching behavior
- Handles scroll restoration

### Styling System

**Hybrid approach: CSS Modules + Tailwind CSS v4**

**CSS Modules:**
```tsx
import s from './component.module.css'

function Component() {
  return <div className={s.wrapper} />
}
```

**Responsive viewport functions:**
```css
.element {
  width: mobile-vw(150);    /* 150px at mobile viewport */
  height: desktop-vh(100);  /* 100px at desktop viewport */
}
```

**Tailwind CSS v4 (CSS-first):**
- Configuration in CSS files, not JS
- Use `@theme` directive for customization
- Custom utilities with `@utility` directive
- Project-specific utilities: `dr-*` classes

### Component Structure

Standard pattern for all components:

```tsx
import { type ComponentProps, forwardRef } from 'react'
import s from './component.module.css'

type ComponentType = ComponentProps<'div'> & {
  // Custom props
}

export const Component = forwardRef<HTMLDivElement, ComponentType>(
  function Component({ ...props }, ref) {
    return <div ref={ref} className={s.wrapper} {...props} />
  }
)
```

### GSAP & Animations

**Setup:** Add `<GSAPRuntime />` in `app/layout.tsx` for ScrollTrigger + Lenis integration.

```tsx
import { GSAPRuntime } from '~/components/gsap/runtime'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <GSAPRuntime />
        {children}
      </body>
    </html>
  )
}
```

No manual ticker setup needed - GSAPRuntime handles everything.

### React 19.2 Features

**Activity Component** - Manage off-screen component visibility:
```tsx
import { Activity } from 'react'

<Activity mode={isVisible ? 'visible' : 'hidden'}>
  <ExpensiveComponent />
</Activity>
```

**useEffectEvent Hook** - Separate event logic from effect dependencies:
```tsx
import { useEffect, useEffectEvent } from 'react'

const onConnected = useEffectEvent(() => {
  showNotification('Connected!', theme)
})

useEffect(() => {
  connect()
  return () => disconnect()
}, [url]) // Only reconnect when url changes, not theme
```

**cacheSignal (Server Components)** - Auto-abort requests on cache expiry:
```tsx
import { cacheSignal } from 'react'

async function fetchData(id: string) {
  const signal = cacheSignal()
  const response = await fetch(`/api/data/${id}`, { signal })
  return response.json()
}
```

### Next.js 16 Cache Components

**Enabled:** `cacheComponents: true` in next.config.ts

**Critical Gotchas:**

1. **Server Components Only** - Cache Components don't work in Client Components
2. **Suspense Required** - Must wrap cached components in Suspense boundaries
3. **Never cache user-specific data** - Risk of data leakage between users
4. **Never cache real-time data** - Stock prices, live feeds, etc.
5. **Test both environments** - Caching behaves differently in dev vs production
6. **Use `'use cache'` directive** explicitly when needed
7. **Dynamic routes** - Use `revalidateTag` or `revalidatePath` for invalidation

```tsx
// ✅ Good: Public product catalog with revalidation
export async function getProducts() {
  'use cache'
  const response = await fetch('/api/products', {
    next: { tags: ['products'], revalidate: 3600 }
  })
  return response.json()
}

// ❌ Bad: User-specific data should never be cached
export async function getUserCart(userId: string) {
  const response = await fetch(`/api/cart/${userId}`, {
    cache: 'no-store' // Must opt out
  })
  return response.json()
}
```

### Integrations

**Sanity CMS:**
- Studio at `/studio`
- Visual editing with draft mode
- Use `sanityFetch` from `~/integrations/sanity/live` for auto-revalidation
- Type generation: `bun sanity:typegen`

**Shopify:**
- Product catalog and cart functionality
- Always use `cache: 'no-store'` for cart operations
- Environment vars: `SHOPIFY_STORE_DOMAIN`, `SHOPIFY_STOREFRONT_ACCESS_TOKEN`

**HubSpot:**
- Forms integration
- Use `<EmbedHubspotForm formId="..." />`

**Managing Integrations:**
- Run `bun validate:env` to check configuration
- Run `bun cleanup:integrations` to identify unused integrations
- Remove unused integrations to save 250-400KB bundle size

### WebGL/Three.js

**Structure:**
- Canvas component: `~/webgl/components/canvas`
- WebGL images: `~/webgl/components/image` (not `~/components/image`)
- Post-processing effects pipeline
- Fluid simulations with flowmaps

```tsx
import { Canvas } from '~/webgl/components/canvas'
import { Image } from '~/webgl/components/image'

export default function Scene() {
  return (
    <Canvas postprocessing>
      <Image src="/texture.jpg" />
    </Canvas>
  )
}
```

### Debug Tools (Orchestra)

**Toggle with CMD+O (or Ctrl+O on Windows)**

Available tools:
- Theatre.js Studio (animation choreography)
- FPS Meter (performance monitoring)
- Grid Overlay (layout debugging)
- Minimap (page overview)

State persists in localStorage and syncs across tabs.

### Git Workflow

**Lefthook pre-commit hooks:**
- Biome linting and formatting (auto-fixes staged files)

**Lefthook post-merge hooks:**
- Auto-pull environment variables from Vercel
- Auto-install dependencies

### Environment Variables

Required variables (see `.env.example`):

```env
# Sanity CMS
NEXT_PUBLIC_SANITY_PROJECT_ID="..."
NEXT_PUBLIC_SANITY_DATASET="production"
SANITY_API_WRITE_TOKEN="..."

# Base URL (required for preview resolution)
NEXT_PUBLIC_BASE_URL="http://localhost:3000"

# Shopify (if using)
SHOPIFY_STORE_DOMAIN="..."
SHOPIFY_STOREFRONT_ACCESS_TOKEN="..."

# HubSpot (if using)
HUBSPOT_ACCESS_TOKEN="..."
NEXT_PUBLIC_HUBSPOT_PORTAL_ID="..."
```

### Performance Best Practices

1. **Server Components by default** - Only use Client Components when needed
2. **Dynamic imports** for code splitting:
   ```tsx
   const Component = dynamic(() => import('./component'))
   ```
3. **Proper cache tags** for fetch requests
4. **Optimize images** through custom Image component
5. **Test with `bun analyze`** to check bundle size

### Development vs Production

**Key differences:**
- Console logs removed in production (except `console.error`, `console.warn`)
- Orchestra debug tools excluded from production builds
- Cache behavior differs (test both environments)
- React DevTools available in development only

### Type Safety

**TypeScript configuration:**
- Strict mode enabled
- Path alias: `~/*` maps to project root
- Auto-generated types for Next.js routes (`typedRoutes: true`)
- Sanity types generated from schema

### Common Patterns

**Metadata generation:**
```tsx
import { metadata } from '~/libs/metadata'

export const metadata = metadata({
  title: 'Page Title',
  description: 'Page description',
})
```

**Server Actions:**
```tsx
'use server'

export async function formAction(formData: FormData) {
  // Server-side logic
  revalidatePath('/path')
}
```

**Zustand state management:**
```tsx
import { create } from 'zustand'

export const useStore = create((set) => ({
  value: 0,
  increment: () => set((state) => ({ value: state.value + 1 }))
}))
```

## Important Implementation Notes

1. **Never manually memoize** - React Compiler handles this
2. **Always use custom Image/Link** - Never Next.js defaults
3. **Check integration configuration** before using features
4. **Use cacheSignal in Server Components** for auto-cleanup
5. **Never cache user-specific data** with Cache Components
6. **Test caching behavior** in both dev and production
7. **Run `bun setup:styles`** if styles don't update
8. **Use `~/` path prefix** for all imports

## Security

- Input validation required for all user inputs
- CSRF protection built into Next.js Server Actions
- Security headers configured in `next.config.ts`
- Never commit `.env.local` files
- Use `SANITY_API_WRITE_TOKEN` only server-side

## Deployment

**Recommended:** Vercel

**Pre-deployment checklist:**
1. Environment variables configured in platform
2. Sanity webhooks set up for revalidation
3. GSAP license valid (if using premium features)
4. Run `bun build` to verify
5. Test with `bun start` locally

**Revalidation webhook:** `https://your-domain.com/api/revalidate`

## Additional Resources

- Project README: `/README.md`
- Production README: `/PROD-README.md`
- Cursor AI Rules: `/.cursor/rules/` (5 consolidated rule files)
- Component docs: `/components/README.md`
- Integration docs: `/integrations/README.md`
- WebGL docs: `/webgl/README.md`
