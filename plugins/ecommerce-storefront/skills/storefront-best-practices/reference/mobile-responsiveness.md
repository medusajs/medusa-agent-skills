# Mobile Responsiveness for Ecommerce Storefronts

## Contents

- [Overview](#overview)
- [Mobile Ecommerce Patterns](#mobile-ecommerce-patterns)
- [Touch-Friendly Interactions](#touch-friendly-interactions)
- [Mobile Performance](#mobile-performance)
- [Safe Area Insets (iOS)](#safe-area-insets-ios)
- [Common Mobile Mistakes](#common-mobile-mistakes)

## Overview

Over 60% of ecommerce traffic is mobile. Mobile-first design is essential for conversion.

### Key Requirements

- Mobile-first CSS (min-width media queries)
- 44x44px minimum touch targets
- Sticky header with cart access
- Large form inputs (48px height minimum)
- Optimized images for mobile
- Fast loading (LCP < 2.5s)

**Assumed knowledge**: AI agents already know mobile-first design principles, breakpoints, and responsive CSS. This guide focuses on ecommerce-specific mobile patterns.

## Mobile Ecommerce Patterns

### Sticky Elements (Critical for Conversion)

**Cart access always visible:**
- Sticky header with cart icon (top-right)
- Or: Sticky bottom navigation with cart
- Never hide cart in hamburger drawer
- Shows count badge, updates in real-time

**Sticky "Add to Cart" bar (product pages):**
- Fixed at bottom of screen
- Shows: Price + "Add to Cart" button
- Appears after scrolling past fold
- Always accessible without scrolling
- **CRITICAL: Must use `env(safe-area-inset-bottom)` for iOS devices** (see Safe Area Insets section)
- Significantly higher conversion rates

### Mobile Navigation Patterns

**Bottom navigation (optional pattern):**
- Consider for mobile-heavy stores (>70% mobile traffic)
- 4-5 primary actions: Home, Categories, Cart, Account, Search
- Fixed at bottom (easier thumb access)
- Icons + labels for clarity

**When to use:**
- Mobile-first brands (fashion, beauty)
- Younger demographic (18-34)
- App-like experience desired

**When NOT to use:**
- Desktop-heavy traffic
- Complex navigation needs (>5 items)
- B2B stores (desktop-focused)

### Mobile Product Browsing

**Image galleries:**
- Full-width swipeable carousel
- Pinch to zoom
- Tap to open full-screen view
- Dot indicators (1/5, 2/5)

**Filter drawer:**
- "Filters" button with badge count (e.g., "Filters (3)")
- Slide-out drawer (full-screen or 80% width)
- Accordion sections for filter categories
- "Apply" button at bottom (batch filtering)
- "Clear All" option at top

**Why batch filtering on mobile:**
- Prevents multiple re-renders on slow connections
- User adjusts multiple filters before applying
- Less disruptive mobile UX

### Mobile Checkout Optimization

**Digital wallets priority (CRITICAL for mobile conversion):**
- Apple Pay / Google Pay buttons prominent at top (if supported in ecommerce backend)
- Can improve mobile checkout conversion by 20-40%
- One-click payment with pre-filled shipping addresses (if supported in ecommerce backend)
- Consider making digital wallet the default on mobile

**Decision: Order summary placement**
- Collapsible at top (recommended): Saves screen space for form, expandable for review
- Fixed at bottom: Always visible but takes space from form
- Use collapsible on mobile to prioritize form completion

**Form optimizations:**
- Single-column layout (never multi-column on mobile)
- 44-48px input height minimum
- Proper keyboard types (`inputMode="email"`, `"numeric"`, `"tel"`)
- Autocomplete attributes for autofill (`autocomplete="email"`, `"name"`, `"address-line1"`)
- Consider single-page layout over multi-step (less friction on mobile)

## Touch-Friendly Interactions

**Standard touch targets:** 44x44px minimum for all interactive elements. Pay special attention to:
- Filter checkboxes on product listings
- Quantity +/- buttons on product pages
- Small action buttons on product cards
- Modal close buttons

**Swipe gestures for ecommerce:**
- Product image galleries (critical - users expect swipeable images)
- Related product sliders
- Category carousels

**Mobile input optimization:**
- 16px minimum font size for inputs (prevents iOS auto-zoom)
- Proper `inputMode` attributes: `"email"`, `"numeric"`, `"tel"`
- Autocomplete attributes: `autocomplete="email"`, `"name"`, `"address-line1"`

## Mobile Performance

**Ecommerce performance priorities:**

1. **Product images** (highest impact): Optimize for mobile (<500KB), lazy load below-fold, responsive images with appropriate sizes
2. **Optimistic UI**: Cart count updates immediately, instant feedback on add to cart
3. **Skeleton screens**: Show loading placeholders for product grids, not blank pages

**Critical mobile performance issues:**
- Unoptimized product images (>1MB) - most common issue
- Loading entire product catalog at once - use pagination or infinite scroll
- Heavy analytics scripts on checkout - defer to post-purchase

**Target**: LCP < 2.5s, mobile-optimized images, server-side rendering for product pages

## Safe Area Insets (iOS)

Use `env(safe-area-inset-*)` to handle iOS notches and rounded corners on:
- Sticky headers (top inset)
- Sticky bottom navigation or add-to-cart bars (bottom inset)
- Full-screen modals

**Critical for ecommerce**: Bottom "Add to Cart" bars will be cut off by iOS home indicator without bottom inset (~34px). Test on real iOS devices with notches.

## Common Mobile Mistakes

**Ecommerce-specific mobile issues:**

1. **Hiding cart in drawer** - Cart icon hidden in hamburger menu. Keep cart always visible in header (top-right).

2. **No sticky cart access** - Cart scrolls off screen on product pages. Use sticky header or sticky bottom "Add to Cart" bar.

3. **Desktop-sized images** - Serving 2MB+ product images to mobile. Use responsive images optimized for mobile (<500KB).

4. **Poor form experience** - Small inputs, wrong keyboards, no autocomplete. Use 48px inputs, proper `inputMode`, autocomplete attributes.

5. **Hover-only interactions** - Quick view, wishlist only work on hover. Add tap handlers, show on tap instead.

6. **Ignoring safe area insets** - Bottom "Add to Cart" bars cut off by iOS home indicator. Use `env(safe-area-inset-bottom)` for sticky bottom elements.

7. **No digital wallet options** - Missing Apple Pay/Google Pay on mobile checkout. Mobile users expect one-tap checkout options.

## Mobile Checklist

**Essential mobile optimizations:**

- [ ] Mobile-first CSS (min-width media queries)
- [ ] 44x44px minimum touch targets throughout
- [ ] Adequate spacing between interactive elements (8-16px)
- [ ] Sticky header with cart icon (always visible)
- [ ] Or: Sticky bottom "Add to Cart" bar on product pages
- [ ] Large form inputs (48px height minimum)
- [ ] Appropriate input types (`inputMode="email"`, `"numeric"`, `"tel"`)
- [ ] Swipeable image galleries on product pages
- [ ] Filter drawer with batch apply on product listings
- [ ] Digital wallets prominent in checkout (Apple Pay, Google Pay)
- [ ] Collapsible order summary in checkout
- [ ] Optimized images for mobile (<500KB)
- [ ] Lazy loading for below-fold content
- [ ] Safe area insets for iOS notches (sticky elements)
- [ ] 16px minimum font size (prevents iOS auto-zoom)
- [ ] Test on real mobile devices (not just Chrome DevTools)
- [ ] Core Web Vitals within targets (LCP < 2.5s, CLS < 0.1, INP < 200ms)
