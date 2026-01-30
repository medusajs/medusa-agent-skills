# Cart Popup Component

## Contents

- [Overview](#overview)
- [When to Show Cart Popup](#when-to-show-cart-popup)
- [Layout Patterns](#layout-patterns)
- [Cart Display](#cart-display)
- [Actions and CTAs](#actions-and-ctas)
- [Empty State](#empty-state)
- [Mobile Considerations](#mobile-considerations)
- [Checklist](#checklist)

## Overview

Cart popup (mini cart/cart drawer) shows quick cart overview without navigating away. Opens from cart icon click or after adding items.

**⚠️ CRITICAL: Always display variant details (size, color, material, etc.) in cart popup, not just product titles.**

**Assumed knowledge**: AI agents know how to build modals, dialogs, and overlays. This focuses on ecommerce-specific patterns.

**Cart popup vs full cart page:**
- Popup: Quick overview, fast checkout path, continue shopping easily
- Full page: Detailed review, promo codes, complex operations
- **Recommended**: Both - popup for speed, full cart page for details

## When to Show Cart Popup

**Trigger options:**

1. **On cart icon click** (always) - Click cart icon in navbar opens popup
2. **After adding to cart** (recommended) - Auto-open popup when item added, confirms action, allows checkout or continue shopping
3. **Hover cart icon** (desktop only, optional) - Quick peek on hover. Can be accidental, not recommended.

**Add-to-cart feedback alternatives:**
- Show popup (most common) - Immediate confirmation, clear path to checkout
- Toast only (less intrusive) - Small notification, user clicks cart icon to see details
- Navigate to cart page (traditional) - Goes directly to full cart page, less common now

## Layout Patterns

**Two common patterns:**

**1. Dropdown (recommended for simplicity):**
- Drops down from cart icon, positioned below navbar
- Width: 280-320px, max height with scroll
- No backdrop overlay (click outside to close)
- Better for few items, simpler implementation

**2. Slide-in drawer (more prominent):**
- Slides from right, full height, width 320-400px (desktop) or 80-90% (mobile)
- Semi-transparent backdrop overlay (click to close)
- Better for multiple items or complex carts

**Both patterns have:**
- Header: Title + item count + close button (optional for dropdown)
- Scrollable content: List of cart items
- Sticky footer: Subtotal + action buttons (Checkout, View Cart)

## Cart Display

**Fetch cart data from backend:**
- Cart ID from localStorage
- Line items (products, variants, quantities, prices)
- Cart totals (subtotal, tax, shipping)
- See connecting-to-backend.md for backend integration

**When to fetch:**
- On app initialization (update cart icon badge)
- On popup open (show loading state)
- After cart updates (add/remove/change quantity)

**State management:**
- Store cart data globally (React Context or TanStack Query)
- Persist cart ID in localStorage
- Optimistic UI updates (update immediately, revert on error)
- See connecting-to-backend.md for cart state patterns

**Cart item display:**

**CRITICAL: Always show variant details (size, color, material, etc.) for each cart item.**

Without variant details, users can't confirm they added the correct variant. This is especially critical when products have multiple options.

- Product image (60-80px thumbnail)
- Product title (truncated to 2 lines)
- **Variant details (REQUIRED)**: Size, color, material, or other variant options
  - Format: "Size: Large, Color: Black" or "Large / Black"
  - Show ALL selected variant options, not just product title
  - Display below title, smaller text (gray)
- Quantity controls (+/- buttons, debounce 300-500ms)
- Unit price and total price (line item total = price × quantity)
- Remove button (X icon, no confirmation needed)

**Why variant details are critical:**
- User confirmation: "Did I add the right size?"
- Prevents cart abandonment from uncertainty
- Allows corrections before checkout
- Essential for products with multiple variants (clothing, shoes, configurable products)

## Actions and CTAs

**Cart summary display:**
- Subtotal (sum of all items)
- Shipping and tax: "Calculated at checkout" or actual amount
- Total: Bold and prominent

**Free shipping indicator (optional):**
- "Add $25 more for free shipping" with progress bar
- Encourages larger orders, updates as cart changes

**Promo codes:**
- Usually NOT in cart popup (too cramped)
- Reserve for full cart page
- Exception: Simple code input if space permits

**Action buttons:**
1. **Checkout** (primary) - Most prominent, high contrast (brand color), navigates to checkout
2. **View Cart** (secondary) - Outline or subtle, navigates to full cart page

Both buttons full-width, 44-48px height on mobile.

## Empty State

Show icon/illustration + "Your cart is empty" + "Continue Shopping" button. Centered, friendly, minimal design.

## Loading and Error States

**On popup open**: Show skeleton/placeholder while fetching (avoid blank screen)

**During updates**:
- Quantity changes: Inline spinner, disable controls, debounce 300-500ms
- Item removal: Fade out animation, disable remove button during request
- Add to cart: Loading indicator on button ("Adding...")

**Error handling**:
- Network errors: Show retry option, don't close popup
- Invalid cart ID: Create new cart automatically
- Out of stock: Disable quantity increase, show message
- Revert optimistic updates on failure

**Animations**: Smooth transitions (250-350ms), slide-in drawer, backdrop fade-in/out. Highlight newly added items.

## Mobile Considerations

**Dropdown on mobile:**
- Full-width (100% minus margins)
- Max height 60-70% viewport, scrollable
- Tap outside to close

**Drawer on mobile:**
- 85-95% screen width or full screen
- Slides from right or bottom
- Swipe to close gesture supported
- Backdrop overlay

**Mobile adjustments:**
- Large touch targets (44-48px minimum)
- Full-width action buttons (48-52px height)
- Smaller images (60px), truncate titles
- Sticky footer with actions
- Large close button (44x44px)

## Checklist

**Essential features:**
- [ ] Opens on cart icon click
- [ ] Dropdown (280-320px) or drawer (320-400px) layout
- [ ] Close button or click outside to close
- [ ] Backdrop overlay if drawer
- [ ] **CRITICAL: Cart items show variant details (size, color, etc.) - not just product title**
- [ ] Cart items with image, title, variant options, quantity, prices
- [ ] Quantity controls (+/- buttons, debounced)
- [ ] Remove item button
- [ ] Subtotal displayed
- [ ] Checkout button (primary)
- [ ] View Cart button (secondary)
- [ ] Empty state with "Continue Shopping" CTA
- [ ] Loading states (skeleton/spinner)
- [ ] Smooth animations (250-350ms)
- [ ] Mobile: Full-width dropdown or 85-95% drawer
- [ ] Touch targets 44-48px minimum
- [ ] `role="dialog"` and `aria-modal="true"`
- [ ] ARIA labels on cart button ("Shopping cart with 3 items")
- [ ] Keyboard accessible (focus trap, Escape closes, return focus)
- [ ] Screen reader announcements (item added/removed)
- [ ] Real-time cart count badge updates
