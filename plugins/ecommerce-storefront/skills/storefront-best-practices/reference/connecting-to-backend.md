# Connecting to Backend

## Contents

- [Overview](#overview)
- [Detecting the Backend](#detecting-the-backend-critical)
- [Framework Detection](#framework-detection)
- [Environment Configuration](#environment-configuration)
- [Backend-Specific Integration](#backend-specific-integration)
- [Authentication Patterns](#authentication-patterns)
- [Cart State Management](#cart-state-management)
- [Error Handling for Ecommerce](#error-handling-for-ecommerce)
- [Performance Patterns](#performance-patterns)
  - [Data Fetching with TanStack Query](#data-fetching-with-tanstack-query-recommended)
- [Checklist](#checklist)

## Overview

Best practices for connecting storefront to ecommerce backend APIs. Framework-agnostic patterns for authentication, cart state management, error handling, and performance optimization.

**For Medusa-specific integration**, see `reference/medusa.md` for SDK setup, pricing, regions, and Medusa patterns.

## Detecting the Backend (CRITICAL)

**Before implementing any backend integration, identify which ecommerce backend is being used.**

### Detection Strategy

**1. Check for monorepo structure:**
```bash
# Look for backend directory
ls -la ../backend
ls -la ./backend
ls -la ../../apps/backend
```

Common monorepo patterns:
- `/apps/storefront` + `/apps/backend`
- `/frontend` + `/backend`
- `/packages/web` + `/packages/api`

**2. Check package.json dependencies:**
```json
{
  "dependencies": {
    "@medusajs/js-sdk": "...",  // Medusa
    // check other ecommerce frameworks...
  }
}
```

**3. Check environment variables:**
```bash
# Look in .env, .env.local, .env.example
grep -i "api\|backend\|medusa\|shopify\|commerce" .env*
```

Common patterns:
- `NEXT_PUBLIC_MEDUSA_BACKEND_URL` → Medusa
- Custom `API_URL` or `BACKEND_URL` → Other backend

**4. If unsure, ASK THE USER:**

```markdown
I need to connect to the ecommerce backend. Which backend are you using?

Options:
- Medusa (open-source headless commerce)
- Custom backend
- Other
```

### Backend Documentation and MCP Servers

**ALWAYS refer to the backend's official documentation or MCP server for:**

- API endpoints and data structures
- Authentication requirements
- SDK usage and installation
- Environment configuration
- Rate limits and best practices

**For Medusa:**
- Documentation: https://docs.medusajs.com
- MCP Server: If available, use Medusa MCP server for real-time API information
- JS SDK docs: https://docs.medusajs.com/resources/js-sdk
- See `reference/medusa.md` for detailed integration guide

**For other backends:**
- Check the backend's documentation portal
- Look for MCP server if available
- Verify API endpoints and authentication methods
- Never assume API structure without verification

**Important:** Do not guess API endpoints or data formats. Always verify with documentation or ask the user to confirm the backend's API structure.

## Framework Detection

Identify the frontend framework to determine appropriate data fetching patterns:

**Next.js:**
- App Router: Server Components (async/await), Client Components (useEffect/TanStack Query)
- Pages Router: getServerSideProps/getStaticProps (server), useEffect (client)

**SvelteKit:**
- Load functions for server-side data
- Client-side: fetch in component lifecycle

**TanStack Start:**
- Server functions for server-side data
- Client-side: fetch with React hooks

**General Rule:**
- **Server-side for initial load**: SEO, performance, security (product pages, listings)
- **Client-side for interactions**: Cart, filters, search, user-specific data

## Environment Configuration

**Store API URLs and keys in environment variables:**

```typescript
// .env.local
NEXT_PUBLIC_API_URL=https://api.example.com
NEXT_PUBLIC_PUBLISHABLE_KEY=pk_...
```

**Framework-specific prefixes:**
- Next.js: `NEXT_PUBLIC_` for client-side
- SvelteKit: `PUBLIC_` for client-side
- Vite-based (TanStack Start): `VITE_` for client-side

**Security:**
- ❌ NEVER expose secret/admin keys in client-side code
- ✅ Publishable keys are safe for client (Medusa, Stripe)
- ✅ Secret keys only in server-side code or environment

## Backend-Specific Integration

### Medusa Backend

**For complete Medusa integration guide**, see `reference/medusa.md` which covers:
- SDK installation and setup
- Vite configuration (for TanStack Start, etc.)
- TypeScript types from `@medusajs/types`
- Price display (never divide by 100)
- Common operations (products, cart, categories, customers)
- Custom endpoints
- Region state management
- Error handling with SDK

### Other Backends

For non-Medusa backends (custom APIs, third-party platforms):

**1. Consult backend's API documentation** for:
   - Authentication requirements
   - Available endpoints
   - Request/response formats
   - SDK availability (check if official SDK exists)

**2. Use backend's official SDK if available** - provides type safety, error handling, and best practices

**3. If no SDK, create API client wrapper:**
   - Centralize API calls in one module
   - Group by resource (products, cart, customers, orders)
   - Handle authentication (include tokens/cookies)
   - Handle errors consistently
   - Use native fetch or axios

## Authentication Patterns

### Customer Authentication

**Session-based (cookies):**
- Backend manages session via cookies
- No manual token management needed
- Works across page refreshes
- Common in traditional ecommerce backends
- Call backend login endpoint, check auth state, logout methods

**Token-based (JWT, OAuth):**
- Store token in localStorage or secure cookie after login
- Include token in Authorization header for all authenticated requests
- Common in headless/API-first backends
- Format: `Authorization: Bearer {token}`

### Protecting Customer Routes

**Check authentication before rendering customer-specific pages** (account, orders, addresses):

- **Server-side**: Check auth in server functions (getServerSideProps, load functions, etc.). Redirect to login if not authenticated.
- **Client-side**: Check auth state on mount. Redirect to login if not authenticated.

Use framework-specific auth patterns for redirects.

### Cart Access Pattern

**Guest carts:**
- Store cart ID in localStorage or cookie
- Check for existing cart ID on app load
- Create new cart if none exists
- Allows shopping without account
- Persists across sessions

**Logged-in carts:**
- Associate cart with customer account
- Syncs across devices
- **CRITICAL: Merge guest cart with customer cart on login** - Transfer guest cart items to customer's account cart, then clear guest cart ID from localStorage

## Cart State Management

**Critical ecommerce pattern**: Cart must be accessible throughout the app.

### Global Cart State

**React Context (for simple cases):**
- Create CartContext and CartProvider
- Store cart state and cartId (from localStorage)
- Load cart on mount if cartId exists
- Provide methods: addItem, removeItem, updateQuantity, clearCart
- Update cart state after each operation

**State management libraries (Zustand, Redux):**
- Use for complex state requirements
- Better for large applications
- Easier to debug with DevTools
- Same pattern: Store cart, provide actions, sync with backend

**Key requirements:**
- Cart accessible from any component
- Real-time cart count updates
- Optimistic UI updates (update UI immediately, sync with backend)

## Error Handling for Ecommerce

### Ecommerce-Specific Errors

**Out of stock:**
- Catch errors when adding to cart
- Check for "out of stock" or "inventory" in error message
- Show user-friendly message: "Sorry, this item is now out of stock"
- Update product availability UI to show out of stock

**Price changed during checkout:**
- Compare cart total with expected total
- If different, show warning: "Prices have been updated. Please review your cart."
- Highlight changed prices in cart

**Payment failed:**
- Catch errors during order completion
- Check for specific payment errors: payment_declined, insufficient_funds, etc.
- Show specific messages:
  - Payment declined → "Payment declined. Please try a different payment method."
  - Insufficient funds → "Insufficient funds. Please use a different card."
  - Generic → "Payment failed. Please try again or contact support."

**Session expired:**
- Catch 401/Unauthorized errors
- Clear auth state
- Redirect to login with message: "Your session has expired. Please log in again."

### User-Friendly Error Messages

**Transform technical errors to clear messages:**
- Network/fetch errors → "Unable to connect. Please check your internet connection."
- Timeout errors → "Request timed out. Please try again."
- Inventory errors → "This item is no longer available in the requested quantity."
- Generic fallback → "Something went wrong. Please try again or contact support."

**Pattern**: Check error message or status code, map to user-friendly message, show in UI (toast, banner, inline).

## Performance Patterns

### Data Fetching with TanStack Query (RECOMMENDED)

**Use TanStack Query for all backend API calls** - provides automatic caching, request deduplication, loading/error states, and optimistic updates.

**Installation:** `npm install @tanstack/react-query`

**Setup:**
- Create QueryClient with default options (staleTime: 5 min, retry: 1)
- Wrap app with QueryClientProvider

**Query pattern (for fetching data):**
- Use `useQuery` with queryKey and queryFn
- queryKey: Array with resource and identifier `['products', categoryId]`
- queryFn: API call function
- Returns: `data`, `isLoading`, `error`
- Use for: Products, cart, customer data, categories

**Mutation pattern (for modifying data):**
- Use `useMutation` with mutationFn
- mutationFn: API operation (add to cart, update, delete)
- onSuccess: Update cache or invalidate queries
- Returns: `mutate` function, `isPending` state
- Use for: Add to cart, remove from cart, update quantities, place order

**Benefits:**
- Automatic caching (no manual cache management)
- Built-in loading/error states
- Request deduplication
- Optimistic updates (update UI before server responds)
- Cache invalidation strategies

**Ecommerce-specific usage:**
- Products: Long stale time (5-10 min) - products don't change often
- Cart: Short or no stale time - prices/inventory can change
- Categories: Long stale time - rarely change

### Caching Strategy

**Client-side caching:**
- TanStack Query handles automatically with `staleTime` and `cacheTime`
- Configure globally or per-query
- Product data: 5-10 min stale time
- Cart data: Fresh on every fetch
- Categories: Long stale time

**Server-side caching (framework-specific):**
- Next.js: Use `revalidate` export or cache configuration
- Set revalidation period (e.g., 300 seconds for product pages)
- Static generation with ISR for product pages

### Request Deduplication

TanStack Query and modern frameworks handle this automatically - multiple components requesting same data result in single request.

### Pagination Pattern

**Offset-based:** Pass limit and offset parameters to API `limit: 24, offset: page * 24`

**Cursor-based (better performance):** Pass limit and cursor (last item ID) `limit: 24, cursor: lastProductId`

Check backend documentation for supported pagination type.

## Checklist

**Essential backend integration:**

- [ ] Backend detected (Medusa, Shopify, custom, etc.)
- [ ] Environment variables configured (API URL, keys)
- [ ] Framework-specific data fetching patterns identified
- [ ] **RECOMMENDED: TanStack Query installed and configured for API calls**
- [ ] Server-side fetching for product pages (SEO)
- [ ] Client-side fetching for cart and user interactions (use TanStack Query)
- [ ] Authentication flow implemented (login/logout)
- [ ] Cart ID persisted in localStorage or cookies
- [ ] Global cart state management (context or store)
- [ ] Cart count synced across app
- [ ] Optimistic UI updates for cart operations
- [ ] Error handling for out of stock scenarios
- [ ] Error handling for payment failures
- [ ] Session expiration handling (redirect to login)
- [ ] User-friendly error messages (not technical)
- [ ] Caching strategy for product data
- [ ] Stock availability checks before checkout
- [ ] Price change detection and warnings

**For Medusa backends, also check:**
- [ ] Medusa SDK installed (`@medusajs/js-sdk` + `@medusajs/types`)
- [ ] SDK initialized with baseUrl and publishableKey
- [ ] Vite SSR config added (if using TanStack Start/Vite)
- [ ] Using official types from `@medusajs/types`
- [ ] Not dividing prices by 100 (display as-is)
- [ ] Region context implemented for multi-region stores
- [ ] Region passed to cart and product queries

See `reference/medusa.md` for complete Medusa integration guide.
