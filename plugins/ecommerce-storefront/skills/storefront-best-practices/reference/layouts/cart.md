# Cart Page

## Contents

- [Overview](#overview)
- [Layout Patterns](#layout-patterns)
- [Cart Items Display](#cart-items-display)
- [Quantity Updates](#quantity-updates)
- [Order Summary](#order-summary)
- [Promo Code Input](#promo-code-input)
- [Checkout Button](#checkout-button)
- [Empty Cart State](#empty-cart-state)
- [Backend Integration](#backend-integration)
- [Mobile Cart](#mobile-cart)
- [Checklist](#checklist)

## Overview

The cart page displays all items a customer has added to their shopping cart. Purpose: Review items, modify cart, apply promotions, proceed to checkout. Critical conversion point.

**⚠️ CRITICAL: Always display variant details (size, color, material, etc.) for each cart item, not just product titles.**

### Key Ecommerce Functions

- Review items before purchase (reduces buyer's remorse)
- Update quantities or remove items (cart management)
- Apply promotional codes (increase order value)
- View pricing breakdown (transparency builds trust)
- Proceed to checkout (conversion path)
- Continue shopping if needed (reduce abandonment)

## Layout Patterns

### Two-Column Pattern (Desktop)

**Most common:**
- Left column (60-70%): Cart items list
- Right column (30-40%): Order summary (sticky)
- Below items: Promo code input, continue shopping
- Order summary stays visible during scroll

### Mobile Layout

Single column (stacked):
- Cart items
- Order summary
- Promo code input
- Checkout button (sticky at bottom)
- Continue shopping

## Cart Items Display

### Cart Item Card

**CRITICAL: Always display variant details for each cart item.**

Products with variants (size, color, material, style, etc.) must show the selected variant options. Without this, customers can't confirm they have the correct items in their cart.

**Essential information per item:**
- Product image (thumbnail, 80-120px desktop, 60-80px mobile)
- Product title (linked to product page)
- **Variant details (REQUIRED)**: Size, color, material, or other variant options selected
  - Format: "Size: Large, Color: Black" or "Large / Black"
  - Display below title, smaller gray text
  - Show ALL selected variant options
- Unit price
- Quantity selector
- Line total (unit price × quantity)
- Remove button (X icon)

**Layout:**
Horizontal card (image left, details right), clear visual separation between items, adequate spacing (16-24px).

**Why variant details are critical:**
- Customer confirmation before checkout
- Prevents returns from wrong variant purchases
- Allows easy correction if wrong variant in cart
- Essential for clothing, shoes, configurable products

### Price Display

**Medusa pricing (CRITICAL):**
Medusa stores prices as-is (not in cents). Display prices directly without dividing by 100. Example: If Medusa returns 49.99, display $49.99 (not $0.4999). Different from Stripe which stores prices in cents.

**Sale prices:**
Show original price (strikethrough) and sale price prominently if on sale.

**Line total:**
Total for item (price × quantity), bold or larger font, update dynamically when quantity changes.

## Quantity Updates

### Quantity Selector

Standard +/- buttons with number display:
```
[-]  [2]  [+]
```

**Behavior:**
- Min: 1 (can't go below, or remove item instead)
- Max: Stock available or cart limit
- Manual input allowed (type number)
- Update on change (blur or button click)
- Show loading state briefly
- Update line total immediately

### Auto-Update (Recommended)

Changes apply immediately, no "Update Cart" button needed. Better UX, less friction. Show brief loading indicator. Update order summary automatically.

**Error handling:**
"Only X available" if exceeds stock, reset to max available quantity, show error message near item.

## Order Summary

### Summary Card

Position: Right column on desktop (sticky), below cart items on mobile, fixed width (300-400px desktop).

### Price Breakdown

**Line items:**
```
Subtotal (3 items):     $149.97
Shipping:               $9.99
Tax:                    $12.00
─────────────────────
Total:                  $171.96
```

**Subtotal:**
Sum of all cart items with item count.

**Shipping:**
Estimated shipping cost, or "Calculated at checkout" (if address needed), or "Free shipping" (if applicable). Show free shipping threshold progress (see promotions.md).

**Tax:**
Estimated tax or "Calculated at checkout" (if address needed).

**Total:**
Grand total (bold, larger font), most prominent number.

### Savings Display

If discounts applied:
- Show total savings: "You saved $20.00" (green text)
- Or: Discount line item in breakdown
- Positive reinforcement

## Promo Code Input

### Input Field Design

**Layout:**
Label ("Promo code" or "Discount code"), text input (200-280px desktop, full-width mobile), "Apply" button inline or stacked (mobile). Positioned below cart items or in order summary.

**Auto-uppercase:**
On submit (codes usually uppercase).

**Expandable pattern (optional):**
"Have a promo code?" link that expands to show input. Saves vertical space.

### Success and Error States

**Success:**
- Green checkmark or success message: "Code applied: WELCOME10"
- Discount shown in order summary: "Discount (WELCOME10) -$10.00"
- Remove option: X icon or "Remove" link
- Update cart total immediately

**Error:**
- Red error message below input: "Invalid code", "Code expired", or "Minimum purchase not met"
- Input remains visible for retry
- Don't clear input field

**See also:** [promotions.md](../features/promotions.md) for detailed promo code patterns.

## Checkout Button

### Button Design

**Prominence:**
Large, full-width button, brand primary color (high contrast), 48-56px height (easy to tap). Text: "Proceed to Checkout" or "Checkout". Icon optional (lock or arrow).

**Position:**
Bottom of order summary (desktop), fixed at bottom of screen (mobile, optional), always visible during scroll.

**States:**
Default enabled, hover with slight color change, loading with spinner, disabled if cart empty or error.

**Security Indicators (optional):**
Lock icon with "Secure Checkout", payment badges (Visa, Mastercard, PayPal), "SSL Encrypted" message near button.

## Empty Cart State

### Display

When cart is empty:
- Centered content
- Icon or illustration (empty shopping bag)
- Heading: "Your cart is empty"
- Subtext: "Start adding items to your cart"
- CTA button: "Continue Shopping" or "Browse Products"

**Additional elements:**
- Link to popular categories
- Recently viewed products (if available)
- Bestsellers or featured products

## Backend Integration

### Data Source (CRITICAL)

**Fetch from ecommerce backend:**
Cart stored in backend (persistent), fetch on page load, sync with backend on changes.

**When to fetch:**
- Page load (initial cart data)
- After adding/updating/removing items
- After applying promo codes

### State Management

**Client-side cart state:**
Store cart data in global state (React Context), keep cart ID in localStorage, update state after API responses, share cart state across components (page, popup, header badge).

**Cart ID persistence:**
```javascript
localStorage.setItem('cart_id', cartId)
```

Send cart ID with every cart API request, create new cart if ID doesn't exist, clear cart ID on checkout completion.

### TanStack Query for Cart Data

**Recommended** for efficient caching and revalidation:

**Benefits:**
Built-in caching with automatic revalidation, optimistic updates support, automatic refetching on focus/reconnect, loading and error states handled, query invalidation for cart updates.

**Configuration:**
Use `useQuery` for fetching cart data, set `staleTime` to 30-60 seconds, use `queryClient.invalidateQueries(['cart'])` after updates.

**See also:** [connecting-to-backend.md](../connecting-to-backend.md) for detailed backend integration patterns.

### Medusa Integration

Use `@medusajs/medusa-js` SDK:
- Cart endpoints: `/store/carts`, `/store/carts/{id}`
- Add to cart: POST `/store/carts/{id}/line-items`
- Update quantity: POST `/store/carts/{id}/line-items/{lineId}`
- Remove item: DELETE `/store/carts/{id}/line-items/{lineId}`
- Apply discount: POST `/store/carts/{id}/promotions`

**Response data:**
Cart ID, items (product details, variants, quantities), subtotal, tax, shipping, total, applied discounts, item availability status.

**Error handling:**
Network errors (show retry option), invalid cart ID (create new cart), out of stock (show error, prevent adding), API errors (user-friendly message).

## Mobile Cart

### Mobile Layout

**Structure:**
Full-width cart items (stacked), simplified item cards, order summary below items, sticky checkout button at bottom.

**Cart item cards:**
Smaller product images (60-80px), truncated product titles (1-2 lines), essential info only, quantity selector (smaller, 36-40px), remove button visible.

### Sticky Checkout Bar

**Bottom sticky bar:**
Fixed at bottom of screen, total amount visible, "Checkout" button (full-width), appears after scrolling (optional), always accessible.

**Design:**
```
[Total: $171.96]  [Checkout]
```

**Touch-friendly:**
44px minimum touch targets, adequate spacing between buttons, large remove buttons (40px).

## Checklist

**Essential elements:**

- [ ] **CRITICAL: Cart items display variant details (size, color, etc.) - not just product title**
- [ ] Cart items with images, titles, variant options, prices
- [ ] Quantity selector (+/- buttons, 40-44px minimum)
- [ ] Remove button per item (X icon, clearly visible)
- [ ] Order summary (subtotal, shipping, tax, total)
- [ ] Promo code input with "Apply" button
- [ ] Applied discount displayed in summary
- [ ] "Remove" option for applied code
- [ ] Prominent "Checkout" button (48-56px height)
- [ ] Continue shopping link
- [ ] Empty cart state (icon, message, CTA)
- [ ] Trust signals (secure checkout, payment badges)
- [ ] Auto-update quantities (no "Update Cart" button)
- [ ] Undo option after removing item (toast notification)
- [ ] Mobile: Sticky checkout button at bottom
- [ ] Mobile: Simplified cart item cards
- [ ] Backend integration (fetch cart from API)
- [ ] Cart ID persistence (localStorage)
- [ ] Real-time price updates
- [ ] Loading states (skeleton or spinner)
- [ ] Optimistic updates for quantity changes
- [ ] Stock availability warnings (if low stock)
- [ ] Free shipping threshold progress (if applicable)
- [ ] Keyboard accessible (Tab, Enter, Arrow keys)
- [ ] ARIA labels on quantity controls and buttons
- [ ] Screen reader announcements (aria-live)
- [ ] High contrast text (4.5:1 minimum)
- [ ] Error handling for failed updates
