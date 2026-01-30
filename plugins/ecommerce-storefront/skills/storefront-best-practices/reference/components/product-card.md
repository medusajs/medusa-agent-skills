# Product Card Component

## Contents

- [Overview](#overview)
- [Price Display (Ecommerce-Specific)](#price-display-ecommerce-specific)
- [Action Buttons and Variant Handling](#action-buttons-and-variant-handling)
- [Badges and Labels](#badges-and-labels)
- [Mobile Considerations](#mobile-considerations)
- [Ecommerce Checklist](#ecommerce-checklist)

## Overview

Product cards display products in grids (product listings, search results, related products). Key ecommerce considerations: clear pricing, quick add-to-cart, and stock indicators.

**Assumed knowledge**: AI agents know how to build cards with images, titles, and buttons. This guide focuses on ecommerce-specific patterns.

### Key Ecommerce Requirements

- Clear, prominent pricing (including sale prices)
- Variant handling for add-to-cart
- Stock status indicators
- Sale/New/Out of Stock badges
- Responsive grid (1 col mobile, 2-3 tablet, 3-4 desktop)
- Fast image loading (lazy load, optimized)

## Price Display (Ecommerce-Specific)

### Regular vs Sale Pricing

**Sale price display:**
- Sale price: Larger, bold, red or accent color
- Original price: Smaller, struck through (~~$79.99~~), gray
- Position sale price before original price
- Optional: Show discount percentage badge (-20%)

**Format consistently:**
- Always include currency symbol ($49.99)
- Consistent decimals ($49.99 not $49.9 or $50)
- For Medusa: Display prices as-is (no divide by 100)

### Price Range (Multiple Variants)

**When variants have different prices:**
- Show "From $49" or "$49 - $79"
- Makes it clear price varies by selection
- Don't show range if all variants same price

## Action Buttons and Variant Handling

### Add to Cart with Variants (CRITICAL)

**Key challenge**: Products with variants require variant selection before adding to cart.

**Handling strategies:**

1. **Add first variant by default** - Click adds `product.variants[0]`. Fast for simple products (1-2 variants).
2. **Redirect to product page** - Navigate to detail page for variant selection. Best for complex products (size + color + material).
3. **Quick View modal** - Variant selector in modal. Good middle ground (desktop only).

**Decision:**
- Simple products (1-2 variants): Add first variant
- Fashion/apparel with sizes: Require size selection (redirect or Quick View)
- Complex products (3+ variant types): Redirect to product page

**Button behavior:**
- Loading state ("Adding..."), disable during loading
- Optimistic UI update (cart count immediately)
- Success feedback (toast, cart popup, or checkmark)
- **Don't navigate away** (stay on listing page)
- Handle errors (out of stock, API failure)

**Wishlist button (optional)**: Heart icon, top-right over image. Empty when not saved, filled (red) when saved. Refer to wishlist.md for more details.

## Badges and Labels

**Badge priority** (show max 1-2 per card):

1. **Out of Stock** (highest) - Gray/black overlay on image, disables add-to-cart
2. **Sale/Discount** - "Sale" or "-20%", red/accent, top-left corner
3. **New** - "New" for recent products, blue/green, top-left corner
4. **Low Stock** (optional) - "Only 3 left", orange, creates urgency

**Display**: Top-left corner (except Out of Stock overlay), small but readable, high contrast.

## Mobile Considerations

### Grid Layout

**Mobile-specific adjustments:**
- 2 columns maximum on mobile (never 3+)
- Larger touch targets (44px minimum for buttons)
- Always show "Add to Cart" button (no hover-only)
- Simplified content (hide optional elements like brand)
- Smaller images for performance (<400px wide)

### Touch Interactions

**No hover states on mobile:**
- Don't hide actions behind hover
- Always show primary button
- Use tap states (active state) instead of hover

## Ecommerce Checklist

**Essential features:**

- [ ] Clear product image (optimized, lazy loaded)
- [ ] Product title (truncated to 2 lines max)
- [ ] Price prominently displayed
- [ ] Sale price shown correctly (struck-through original price)
- [ ] Currency symbol included
- [ ] For Medusa: Price displayed as-is (not divided by 100)
- [ ] Add to Cart button with loading state
- [ ] Variant handling strategy (first variant, redirect, or Quick View)
- [ ] Optimistic UI update (cart count immediately)
- [ ] Success feedback (toast or cart popup)
- [ ] Don't navigate away after adding to cart
- [ ] Out of Stock badge (disables add-to-cart)
- [ ] Sale badge when price reduced
- [ ] Responsive grid (1 col mobile, 2-3 tablet, 3-4 desktop)
- [ ] Touch-friendly on mobile (44px buttons)
- [ ] Keyboard accessible (focus states, Enter to activate)
- [ ] Descriptive alt text on images
- [ ] Semantic HTML (`<article>` wrapper)
