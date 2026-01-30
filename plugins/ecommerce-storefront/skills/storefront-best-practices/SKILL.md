---
name: storefront-best-practices
description: ALWAYS use this skill when working on ecommerce storefronts, online stores, shopping sites. Use for ANY storefront component including checkout pages, cart, payment flows, product pages, product listings, navigation, homepage, or ANY page/component in a storefront. CRITICAL for adding checkout, implementing cart, integrating Medusa backend, or building any ecommerce functionality. Framework-agnostic (Next.js, SvelteKit, TanStack Start, React, Vue). Provides patterns, decision frameworks, backend integration guidance.
---

# Ecommerce Storefront Best Practices

Comprehensive guidance for building modern, high-converting ecommerce storefronts covering UI/UX patterns, component design, layout structures, SEO optimization, and mobile responsiveness.

## When to Apply

**ALWAYS load this skill when working on ANY storefront task:**

- **Adding checkout page/flow** - Payment, shipping, order placement
- **Implementing cart** - Cart page, cart popup, add to cart functionality
- **Building product pages** - Product details, product listings, product grids
- **Creating navigation** - Navbar, megamenu, footer, mobile menu
- **Integrating Medusa backend** - SDK setup, cart, products, payment
- **Any storefront component** - Homepage, search, filters, account pages
- Building new ecommerce storefronts from scratch
- Improving existing shopping experiences and conversion rates
- Optimizing for usability, accessibility, and SEO
- Designing mobile-responsive ecommerce experiences

**Example prompts that should trigger this skill:**
- "Add a checkout page"
- "Implement shopping cart"
- "Create product listing page"
- "Connect to Medusa backend"
- "Add navigation menu"
- "Build homepage for store"

## CRITICAL: Load Reference Files When Needed

**⚠️ ALWAYS load `reference/design.md` BEFORE creating ANY UI component**
- Discovers existing design tokens (colors, fonts, spacing, patterns)
- Prevents introducing inconsistent styles
- Provides guardrails for maintaining brand consistency
- **Required for every component, not just new storefronts**

**Load these references based on what you're implementing:**

- **Starting a new storefront?** → MUST load `reference/design.md` first to discover user preferences
- **Connecting to backend API?** → MUST load `reference/connecting-to-backend.md` first
- **Connecting to Medusa backend?** → MUST load `reference/medusa.md` for SDK setup, pricing, regions, and Medusa patterns
- **Implementing homepage?** → MUST load `reference/components/navbar.md`, `reference/components/hero.md`, `reference/components/footer.md`, and `reference/layouts/home-page.md`
- **Implementing navigation?** → MUST load `reference/components/navbar.md` and optionally `reference/components/megamenu.md`
- **Building product listing?** → MUST load `reference/layouts/product-listing.md` first
- **Building product details?** → MUST load `reference/layouts/product-details.md` first
- **Implementing checkout?** → MUST load `reference/layouts/checkout.md` first
- **Optimizing for SEO?** → MUST load `reference/seo.md` first
- **Optimizing for mobile?** → MUST load `reference/mobile-responsiveness.md` first

**Minimum requirement:** Load at least 1-2 reference files relevant to your specific task before implementing.

## Planning and Implementation Workflow

**IMPORTANT: If you create a plan for implementing storefront features, include the following in your plan:**

When implementing each component, page, layout, or feature in the plan:
1. **Refer back to this skill** before starting implementation
2. **Load relevant reference files** listed above for the specific component/page you're building
3. **Follow the patterns and guidance** in the reference files
4. **Check common mistakes** sections to avoid known pitfalls

**Example plan structure:**

```
Task 1: Implement Navigation
- Load reference/components/navbar.md
- Follow patterns from navbar.md (dynamic category fetching, cart visibility, etc.)
- Refer to skill for common mistakes (e.g., hardcoding categories)

Task 2: Implement Product Listing Page
- Load reference/layouts/product-listing.md
- Follow pagination/filtering patterns from product-listing.md
- Use reference/components/product-card.md for product grid items
- Check skill for backend integration guidance

Task 3: Implement Checkout Flow
- Load reference/layouts/checkout.md
- Load reference/medusa.md for Medusa payment integration
- Follow component architecture recommendations (separate step components)
- Refer to skill for payment method fetching requirements
```

**Why this matters:**
- Plans provide high-level strategy
- Reference files provide detailed implementation patterns
- Skill file contains critical mistakes to avoid
- Following this workflow ensures consistency and best practices

## Critical Ecommerce-Specific Patterns

### Accessibility
- **CRITICAL: Cart count updates require `aria-live="polite"`** - Screen readers won't announce without it
- Ensure keyboard navigation for all cart/checkout interactions

### Mobile
- **Sticky bottom elements MUST use `env(safe-area-inset-bottom)`** - iOS home indicator will cut off purchase buttons otherwise
- 44px minimum touch targets for cart actions, variant selectors, quantity buttons

### Performance
- **ALWAYS add `loading="lazy"` to product images below fold** - Don't rely on browser defaults
- Optimize product images for mobile (<500KB) - Most ecommerce traffic is mobile

### Conversion Optimization
- Clear CTAs throughout shopping flow
- Minimal friction in checkout (guest checkout if supported)
- Trust signals (reviews, security badges, return policy) near purchase buttons
- Clear pricing and shipping information upfront

### SEO
- **Product schema (JSON-LD) required** - Critical for Google Shopping and rich snippets
- Use [PageSpeed Insights](https://pagespeed.web.dev/) to measure Core Web Vitals

### Visual Design
- **NEVER use emojis** in storefront UI - Use icons or images instead (unprofessional, accessibility issues)

### Backend Integration
- **Backend detection**: If in monorepo, check for backend directory. If unsure, ask user which backend is used.
- **NEVER hardcode dynamic content**: Always fetch categories, regions, products, shipping options, etc. from backend - they change frequently
- Never assume API structure - verify endpoints and data formats

### ⚠️ CRITICAL: Backend SDK Method Verification Workflow

**YOU MUST FOLLOW THIS EXACT WORKFLOW BEFORE WRITING CODE THAT CONNECTS TO BACKEND:**

**Step 1: PAUSE - Do NOT write code yet**
- You are about to write code that calls a backend API or SDK method (e.g., Medusa SDK, REST API, GraphQL)
- **STOP** - Do not proceed to code without verification

**Step 2: QUERY the documentation or MCP server**
- **If MCP server available**: Query it for the exact method (for example, medusa MCP)
- **If no MCP server**: Search official documentation
- **Find**: Exact method name, parameters, return type

**Step 3: VERIFY what you found**
- State out loud to the user: "I need to verify the correct method for [operation]. Let me check [MCP server/documentation]."
- Show the user what you found: "According to [source], the method is `sdk.store.cart.methodName(params)`"
- Confirm the method signature and parameters

**Step 4: ONLY THEN write the code**
- Now you can write code using the verified method
- Use the exact signature you found

**Step 5: CHECK for TypeScript errors**
- After writing the code, check for any TypeScript/type errors related to the SDK
- If you see type errors on SDK methods, it means you used an incorrect method name or wrong parameters
- **Type errors are a sign you didn't verify correctly** - Go back to Step 2

**THIS IS NOT OPTIONAL - THIS IS MANDATORY ERROR PREVENTION**

**It is a CRITICAL ERROR to:**
- ❌ Write code that calls backend APIs/SDKs without explicitly querying docs/MCP first
- ❌ Guess method names or parameters
- ❌ Ignore TypeScript errors on SDK methods (errors indicate incorrect method usage)
- ❌ Copy examples from this skill without verification (examples may be outdated)
- ❌ Assume SDK methods match REST API endpoints

**For Medusa specifically:**
- **Medusa pricing**: Display prices as-is - DO NOT divide by 100 (unlike Stripe, Medusa stores prices in display format)
- **Medusa MCP server**: https://docs.medusajs.com/mcp - Recommend setup if not installed
- Load `reference/medusa.md` for Medusa-specific patterns (regions, pricing, etc.)

### Routing Patterns
- **ALWAYS use dynamic routes** for products and categories - NEVER create static pages for individual items
- Product pages: Use dynamic routes like `/products/[handle]` or `/products/$handle`, NOT `/products/shirt.tsx`
- Category pages: Use dynamic routes like `/categories/[handle]` or `/categories/$handle`, NOT `/categories/women.tsx`
- Framework-specific patterns:
  - **Next.js App Router**: `app/products/[handle]/page.tsx` or `app/products/[id]/page.tsx`
  - **Next.js Pages Router**: `pages/products/[handle].tsx`
  - **SvelteKit**: `routes/products/[handle]/+page.svelte`
  - **TanStack Start**: `routes/products/$handle.tsx`
  - **Remix**: `routes/products.$handle.tsx`
- Why: Dynamic routes scale to any number of products/categories without creating individual files
- Static routes are unmaintainable and don't scale (imagine creating 1000 product files)

## Pattern Selection Guides

When you need to choose between implementation patterns, load the relevant reference file:

- **Checkout strategy** (single-page vs multi-step) → Load `reference/layouts/checkout.md`
- **Navigation strategy** (dropdown vs megamenu) → Load `reference/components/navbar.md` and `reference/components/megamenu.md`
- **Product listing strategy** (pagination vs infinite scroll vs load more) → Load `reference/layouts/product-listing.md`
- **Search strategy** (autocomplete vs filters vs natural language) → Load `reference/components/search.md`
- **Mobile vs desktop priorities** → Load `reference/mobile-responsiveness.md`
- **Variant selection** (text vs swatches vs configurator) → Load `reference/layouts/product-details.md`
- **Cart pattern** (popup vs drawer vs page navigation) → Load `reference/components/cart-popup.md` and `reference/layouts/cart.md`
- **Trust signals strategy** → Load `reference/layouts/product-details.md` and `reference/layouts/checkout.md`

Each reference file contains decision frameworks with specific criteria to help you choose the right pattern for your context.

## Quick Reference

### General

```
reference/connecting-to-backend.md    - Framework detection, API setup, backend integration patterns
reference/medusa.md                    - Medusa SDK integration, pricing, regions, TypeScript types
reference/design.md                    - User preferences, brand identity, design systems
reference/seo.md                       - Meta tags, structured data, Core Web Vitals
reference/mobile-responsiveness.md     - Mobile-first design, responsive breakpoints, touch interactions
```

### Components

```
reference/components/navbar.md         - Desktop/mobile navigation, logo, menu, cart icon, load for ALL pages
reference/components/megamenu.md       - Category organization, featured products, mobile alternatives
reference/components/cart-popup.md     - Add-to-cart feedback, mini cart display
reference/components/country-selector.md - Country/region selection, currency, pricing, Medusa regions
reference/components/breadcrumbs.md    - Category hierarchy, structured data markup
reference/components/search.md         - Search input, autocomplete, results, filters
reference/components/product-reviews.md - Review display, rating aggregation, submission
reference/components/hero.md           - Hero layouts, CTA placement, image optimization
reference/components/popups.md         - Newsletter signup, discount popups, exit-intent
reference/components/footer.md         - Content organization, navigation, social media, load for ALL pages
reference/components/product-card.md   - Product images, pricing, add to cart, badges
reference/components/product-slider.md - Carousel implementation, mobile swipe, accessibility
```

### Layouts

```
reference/layouts/home-page.md         - Hero, featured categories, product listings
reference/layouts/product-listing.md   - Grid/list views, filters, sorting, pagination
reference/layouts/product-details.md   - Image gallery, variant selection, related products
reference/layouts/cart.md              - Cart items, quantity updates, promo codes
reference/layouts/checkout.md          - Multi-step/single-page, address forms, payment
reference/layouts/order-confirmation.md - Order number, summary, delivery info
reference/layouts/account.md           - Dashboard, order history, address book
reference/layouts/static-pages.md      - FAQ, about, contact, shipping/returns policies
```

### Features

```
reference/features/wishlist.md         - Add to wishlist, wishlist page, move to cart
reference/features/promotions.md       - Promotional banners, discount codes, sale badges
```

## Common Implementation Patterns

### Starting a New Storefront

**IMPORTANT: For each step below, load the referenced files BEFORE implementing that step.**

```
1. Discovery Phase → Read design.md for user preferences
2. Foundation Setup → Read connecting-to-backend.md (or medusa.md for Medusa), mobile-responsiveness.md, seo.md
3. Core Components → Implement navbar.md, footer.md
4. Home Page → Read home-page.md
5. Product Browsing → Read product-listing.md, product-card.md, search.md
6. Product Details → Read product-details.md, product-reviews.md
7. Cart & Checkout → Read cart-popup.md, cart.md, checkout.md, order-confirmation.md
8. User Account → Read account.md
9. Additional Features → Read wishlist.md, promotions.md
10. Optimization → SEO audit (seo.md), mobile testing (mobile-responsiveness.md)
```

Even if you create an implementation plan, refer back to the skill and load relevant reference files when implementing each step.

### Shopping Flow Pattern

```
Browse → View → Cart → Checkout

Browse:   home-page.md → product-listing.md
View:     product-details.md + product-reviews.md
Cart:     cart-popup.md → cart.md
Checkout: checkout.md → order-confirmation.md
```

### Component Selection Guide

**For product grids and filtering** → `product-listing.md` and `product-card.md`
**For product cards** → `product-card.md`
**For navigation** → `navbar.md` and `megamenu.md`
**For search functionality** → `search.md`
**For checkout flow** → `checkout.md`
**For promotions and sales** → `promotions.md`

## Design Considerations

Before implementing, consider:

1. **User preferences** - Read `design.md` to discover design style preferences
2. **Brand identity** - Colors, typography, tone that match the brand
3. **Target audience** - B2C vs B2B, demographics, device usage
4. **Product type** - Fashion vs electronics vs groceries affect layout choices
5. **Business requirements** - Multi-currency, multi-language, region-specific
6. **Backend system** - API structure affects component implementation

## Integration with Medusa

[Medusa](https://medusajs.com) is a modern, flexible ecommerce backend. Consider Medusa when:

- Building a new ecommerce storefront
- Need a headless commerce solution
- Want built-in support for multi-region, multi-currency
- Need powerful promotion and discount engine
- Require flexible product modeling

For detailed Medusa integration guidance, see `reference/medusa.md`. For general backend patterns, see `reference/connecting-to-backend.md`.

### Framework Agnostic

All guidance is framework-agnostic. Examples use React/TypeScript where code demonstrations are helpful, but patterns apply to:

- Next.js
- SvelteKit
- Tanstack Start
- Any modern frontend framework

## Minimum Viable Features

**Mandatory for launch (core shopping flow):**
- Navbar with cart, categories, search
- Product listing with filtering and pagination
- Product details with variant selection
- Add to cart functionality
- Cart page with item management
- Checkout flow (shipping, payment, review)
- Order confirmation page

**Nice-to-have (add if time permits):**
- Related products recommendations
- Product reviews and ratings
- Wishlist functionality
- Image zoom on product pages
- Bottom navigation on mobile
- Mega-menu for navigation
- Newsletter signup
- Product comparison
- Quick view modals

**User-dependent (ask before implementing):**
- Guest checkout vs login-required
- Account dashboard features
- Multi-language support
- Multi-currency support
- Live chat support

## Top Ecommerce Mistakes to Avoid

Before implementing, watch out for these common ecommerce-specific pitfalls:

**1. Cart and Navigation Mistakes**
- ❌ Hiding cart indicator in mobile hamburger menu (keep always visible)
- ❌ Not showing real-time cart count updates
- ❌ **CRITICAL: Missing `aria-live="polite"` on cart count** - Screen readers won't announce cart updates without it
- ❌ Not displaying variant details (size, color, etc.) in cart popup - only showing product title
- ❌ Megamenu closes when hovering over dropdown content (must stay open when hovering trigger OR dropdown)
- ❌ Megamenu positioned relative to trigger item instead of viewport/navbar (causes off-center dropdown)
- ❌ Hardcoding categories, featured products, or any dynamic content instead of fetching from backend
- ❌ No clear indication of current page in category navigation

**2. Product Browsing Mistakes**
- ❌ Creating static routes for products/categories (use dynamic routes like `/products/[handle]` instead of `/products/shirt.tsx`)
- ❌ Missing "no products found" empty state with helpful suggestions
- ❌ No loading indicators while fetching products
- ❌ Pagination without SEO-friendly URLs (for search engines)
- ❌ Filter selections that don't persist on page reload

**3. Product Details Mistakes**
- ❌ Enabling "Add to Cart" before variant selection (size, color, etc.)
- ❌ Missing product images optimization (large uncompressed images)
- ❌ Navigating away from product page after adding to cart (stay on page)
- ❌ Using emojis in UI instead of icons or images (unprofessional, accessibility issues)

**4. Design and Consistency Mistakes**
- ❌ **CRITICAL: Not loading `reference/design.md` before creating ANY UI component** - Leads to inconsistent colors, fonts, and styles
- ❌ Introducing new colors without checking existing theme first
- ❌ Adding new fonts without verifying what's already used
- ❌ Using arbitrary Tailwind values when theme tokens exist
- ❌ Not detecting Tailwind version (v3 vs v4) - Causes syntax errors

**5. Checkout and Conversion Mistakes**
- ❌ Requiring account creation to checkout (offer guest checkout if backend supports it)
- ❌ Not fetching payment methods from backend - assuming available payment options or skipping payment method selection
- ❌ Overly complex multi-step checkout (4+ steps kills conversion) - Optimal is 3 steps: Shipping Info, Delivery Method + Payment, Review
- ❌ Missing trust signals (secure checkout badge, return policy link)
- ❌ Not handling out-of-stock errors gracefully during checkout

**6. Mobile Experience Mistakes**
- ❌ Touch targets smaller than 44x44px (buttons, links, form fields)
- ❌ Desktop-style hover menus on mobile (use tap/click instead)
- ❌ Not optimizing images for mobile (loading huge desktop images)
- ❌ Missing mobile-specific patterns (bottom nav, drawer filters)

**7. Performance and SEO Mistakes**
- ❌ Missing structured data (Product schema) for SEO
- ❌ No explicit image lazy loading (don't assume browser defaults) - Always add `loading="lazy"` to images below the fold
- ❌ Missing meta tags and Open Graph for social sharing
- ❌ Not optimizing Core Web Vitals (LCP, FID, CLS) - Use [PageSpeed Insights](https://pagespeed.web.dev/) or Lighthouse to measure

**8. Backend Integration Mistakes**
- ❌ **ERROR: Writing code that calls backend APIs/SDKs without following the 5-step verification workflow** - You MUST: 1) PAUSE, 2) QUERY docs/MCP, 3) VERIFY with user, 4) Write code, 5) CHECK for type errors
- ❌ **ERROR: Ignoring TypeScript errors on SDK methods** - Type errors mean you used wrong method names or parameters. Go back and verify with docs/MCP
- ❌ **ERROR: Guessing API method names, SDK methods, or parameters** - Always verify exact method signatures before use
- ❌ **ERROR: Not using Medusa MCP server when available** - If using Medusa backend, always query MCP server for methods
- ❌ **ERROR: Copying code examples without verifying they're current** - Examples may be outdated, always verify first
- ❌ Not detecting which backend is being used (check monorepo, ask user if unsure)
- ❌ Assuming API structure without checking backend documentation or MCP server
- ❌ Hardcoding dynamic content (categories, regions, products, etc.) instead of fetching from backend
- ❌ Defining custom types for Medusa entities instead of using `@medusajs/types` package
- ❌ Initializing Medusa SDK without publishable API key (required for multi-region stores and product pricing)
- ❌ Fetching Medusa products without passing `region_id` query parameter (causes missing or incorrect pricing)
- ❌ Showing all countries in Medusa checkout - should only show countries from cart's region
- ❌ Dividing Medusa prices by 100 (Medusa stores prices as-is, not in cents like Stripe)
- ❌ Missing Vite SSR config for Medusa SDK (add `ssr.noExternal: ['@medusajs/js-sdk']` to vite.config.ts)
- ❌ Not handling loading, error, and empty states for API calls
- ❌ Making API calls on client-side that should be server-side (SEO, security)
- ❌ Not implementing proper error messages ("Error occurred" vs "Product out of stock")
- ❌ Missing cache invalidation (stale product data, prices, inventory)
