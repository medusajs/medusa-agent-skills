# Medusa Backend Integration

## Contents

- [Overview](#overview)
- [Installation](#installation)
- [SDK Setup](#sdk-setup)
- [Vite Configuration](#vite-configuration-tanstack-start-vite-projects)
- [TypeScript Types](#typescript-types)
- [Price Display](#price-display)
- [SDK Organization](#sdk-organization)
- [Critical Medusa Patterns](#critical-medusa-patterns)
- [Region State Management](#region-state-management)

## Overview

Guide for connecting your storefront to Medusa backend using the [Medusa JS SDK](https://docs.medusajs.com/resources/js-sdk).

**When to use this guide:**
- Building a storefront with Medusa backend
- Need to integrate Medusa SDK properly
- Working with multi-region stores
- Handling Medusa-specific pricing and regions

**For general backend patterns**, see `reference/connecting-to-backend.md`.

## ⚠️ CRITICAL: Follow the 5-Step Verification Workflow

**BEFORE writing code that calls Medusa SDK methods**, follow the mandatory workflow from SKILL.md:

1. **PAUSE** - Don't write code yet
2. **QUERY** MCP server or docs (https://docs.medusajs.com/resources/js-sdk) for exact method
3. **VERIFY** with user what you found
4. **WRITE** code using verified method
5. **CHECK** for TypeScript errors - Type errors mean wrong method name or parameters

**If you see TypeScript errors on SDK methods, you used incorrect methods. Go back to Step 2 and verify again.**

**This file shows PATTERNS (what to do), not exact methods (how to do it). Always verify method names with MCP/docs before use.**

## 💡 RECOMMENDED: Set Up Medusa MCP Server

**If the Medusa MCP server is not installed, strongly recommend setting it up.**

**Setup instructions**: add HTTP MCP server with URL https://docs.medusajs.com/mcp

The MCP server provides real-time method verification without leaving your IDE.

## Installation

```bash
npm install @medusajs/js-sdk@latest @medusajs/types@latest
```

Both required: SDK provides functionality, types provide TypeScript support.

## SDK Setup

```typescript
import Medusa from "@medusajs/js-sdk"

export const sdk = new Medusa({
  baseUrl: process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9000",
  debug: process.env.NODE_ENV === "development",
  publishableKey: process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY,
})
```

**CRITICAL: Always set publishableKey.**

- Required for multi-region stores to get correct pricing
- Required for accessing products with regional prices
- Without it, product queries may fail or return incorrect prices
- Get publishable key from Medusa admin dashboard under Settings → Publishable API Keys

## Vite Configuration (TanStack Start, Vite Projects)

**IMPORTANT: For Vite-based projects, configure SSR externals.**

Add this to your `vite.config.ts`:

```typescript
export default defineConfig({
  // ... other config
  ssr: {
    noExternal: ['@medusajs/js-sdk'],
  },
})
```

**Why this is needed:**
- Medusa JS SDK must be processed by Vite during SSR
- Without this config, SDK calls will fail during server-side rendering
- Applies to TanStack Start, vanilla Vite, and other Vite-based frameworks

## TypeScript Types

**IMPORTANT: Always use `@medusajs/types` - never define custom types.**

```typescript
import type {
  StoreProduct,
  StoreCart,
  StoreCartLineItem,
  StoreRegion,
  StoreProductCategory,
  StoreCustomer,
  StoreOrder
} from "@medusajs/types"
```

**Why use official types:**
- Complete and accurate type definitions
- Updated with each Medusa release
- Includes all entity relationships and fields
- Prevents type mismatches with API responses

## Price Display

**CRITICAL: Medusa prices are stored as-is - DO NOT divide by 100.**

Unlike Stripe (where amounts are in cents), Medusa stores prices in their display value.

```typescript
// ❌ WRONG - Dividing by 100
<div>${product.variants[0].prices[0].amount / 100}</div>

// ✅ CORRECT - Display as-is
<div>${product.variants[0].prices[0].amount}</div>
```

**Correct price formatting:**
```typescript
const formatPrice = (amount: number, currencyCode: string) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currencyCode,
  }).format(amount)
}
```

**Price fields to use:**
- `variant.calculated_price.calculated_amount` - Final price including promotions
- `variant.calculated_price.original_amount` - Original price before discounts
- Both are already in display format - no conversion needed

## SDK Organization

The Medusa SDK is organized by resources:
- `sdk.store.product.*` - Product operations
- `sdk.store.cart.*` - Cart operations
- `sdk.store.category.*` - Category operations
- `sdk.store.customer.*` - Customer operations (authenticated)
- `sdk.store.order.*` - Order operations (authenticated)
- `sdk.store.payment.*` - Payment operations
- `sdk.store.fulfillment.*` - Shipping/fulfillment operations
- `sdk.store.region.*` - Region operations

**To find specific methods**: Consult documentation (https://docs.medusajs.com/resources/js-sdk) or use MCP server.

## Critical Medusa Patterns

**IMPORTANT**: The patterns below show WHAT to do, not exact HOW. Always verify method names and signatures with MCP server or documentation before using.

### 1. Always Pass `region_id` for Products

**Pattern**: Product queries require `region_id` parameter for correct pricing.

**Why:** Without `region_id`, `calculated_price` will be missing or incorrect.

**To implement**: Query MCP/docs for product listing and retrieval methods. Pass `region_id: selectedRegion.id` as parameter.

### 2. Cart Updates Pattern

**Pattern**: Line items have dedicated methods (create, update, delete). Other cart properties use a generic update method.

**Line item operations** (verify exact method names with MCP/docs):
- Add item to cart
- Update item quantity
- Remove item from cart

**Other cart updates** (email, addresses, region, promo codes):
- Use cart's generic update method

**To implement**: Query MCP server or documentation for exact cart method signatures:
https://docs.medusajs.com/resources/references/js-sdk/store/cart

### 3. Payment Flow Pattern

**High-level workflow:**
1. Query available payment providers for the cart's region
2. User selects payment method
3. Initialize payment session for selected provider
4. Render provider-specific UI (Stripe Elements, etc.)
5. Complete payment through provider

**To implement**: Query MCP/docs for:
- Payment provider listing method
- Payment session initialization method
- Payment completion method

**Resources**:
- MCP server (if installed)
- Medusa payment docs: https://docs.medusajs.com/resources/references/js-sdk/store/payment
- `reference/layouts/checkout.md` for checkout flow

### 4. Checkout Flow Pattern

**High-level workflow:**
1. Collect shipping address
2. Query available shipping options for cart
3. User selects shipping method
4. Collect payment information
5. Initialize payment session
6. Complete/place order

**To implement**: Query MCP/docs for each step's methods. Don't guess method names.

### 5. Category Fetching

**Pattern**: Fetch categories from `sdk.store.category.*` resource.

**To implement**: Query MCP/docs for category listing method. See `reference/components/navbar.md` for usage patterns.

## Region State Management

**Critical for Medusa**: Region determines currency, pricing, taxes, and available products.

### Why Region Context Matters

Medusa requires region for:
- Creating carts (must pass `region_id`)
- Retrieving products with correct prices
- Determining currency and tax calculations
- Filtering available payment and shipping methods

### Implementation Approach

**High-level workflow:**
1. Fetch available regions on app load (query MCP/docs for region listing method)
2. Detect user's country (IP, browser locale, or user selection)
3. Find region containing that country
4. Store selected region globally (React Context, Zustand, etc.)
5. Use `selectedRegion.id` for all cart and product operations

**When user changes country:**
- Find new region containing the country
- Update cart with new region_id (query MCP/docs for cart update method)
- Store selection in localStorage for persistence

**To implement**: Query MCP server or docs for exact region and cart methods. Don't copy example code without verification.

**For detailed region implementation with code examples**, see:
- `reference/components/country-selector.md`
- Medusa MCP server (if installed)
- Medusa docs: https://docs.medusajs.com/resources/storefront-development/regions/context

## Error Handling

SDK throws `FetchError` with:
- `status`: HTTP status code
- `statusText`: Error code
- `message`: Descriptive message

```typescript
try {
  const data = await sdk.store.customer.retrieve()
} catch (error) {
  const fetchError = error as FetchError
  if (fetchError.statusText === "Unauthorized") {
    redirect('/login')
  }
}
```

## Custom Endpoints

For custom API routes:

```typescript
const data = await sdk.client.fetch(`/custom/endpoint`, {
  method: "POST",
  body: { /* ... */ },
})
```

## Resources

- **Medusa JS SDK docs**: https://docs.medusajs.com/resources/js-sdk
- **Storefront development**: https://docs.medusajs.com/resources/storefront-development
- **Checkout flow**: https://docs.medusajs.com/resources/storefront-development/checkout
- **Region context**: https://docs.medusajs.com/resources/storefront-development/regions/context
- **Use Medusa MCP server** if available for real-time method lookup
