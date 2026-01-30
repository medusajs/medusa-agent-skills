# Product Detail Page Layout

## Contents

- [Overview](#overview)
- [Layout Structure](#layout-structure)
- [Price Display and Medusa Integration](#price-display-and-medusa-integration)
- [Variant Selection (Critical)](#variant-selection-critical)
- [Stock Availability](#stock-availability)
- [Add to Cart Behavior](#add-to-cart-behavior)
- [Product Details Organization](#product-details-organization)
- [Related Products Strategy](#related-products-strategy)
- [Trust Signals and Conversion](#trust-signals-and-conversion)
- [Mobile Optimization](#mobile-optimization)
- [Checklist](#checklist)

## Overview

Most critical page for conversion. Customers make purchase decisions here based on product information, images, reviews, and trust signals.

### Key Requirements

- High-quality product images with zoom capability
- Clear price display (handle variant price changes)
- Variant selection (size, color, material)
- Stock availability indicators
- Prominent "Add to Cart" with proper feedback
- Product details (description, specifications)
- Customer reviews and ratings
- Related product recommendations
- Trust signals (shipping, returns, secure checkout)
- Mobile-optimized (60%+ traffic)

### Routing Pattern

**CRITICAL: Always use dynamic routes, NEVER static pages.**

Product detail pages must use dynamic routes that accept a parameter (handle, slug, or ID):

**Correct examples:**
- Next.js App Router: `app/products/[handle]/page.tsx`
- Next.js Pages Router: `pages/products/[handle].tsx`
- SvelteKit: `routes/products/[handle]/+page.svelte`
- TanStack Start: `routes/products/$handle.tsx`
- Remix: `routes/products.$handle.tsx`

**Wrong examples:**
- ❌ `pages/products/blue-shirt.tsx` (static file per product)
- ❌ `pages/products/red-shoes.tsx` (doesn't scale)

Fetch product data in the dynamic route based on the handle/ID parameter from the URL.

## Layout Structure

**Desktop (two-column):**
- Left: Product images (50-60% width)
- Right: Product info, variants, add to cart (40-50%)
- Below: Product details, reviews, related products (full-width)

**Mobile (stacked):**
- Images at top (full-width, swipeable)
- Product info below (title, price, rating)
- Variants and add to cart
- Accordion for product details
- Reviews section
- Related products
- Sticky "Add to Cart" bar at bottom

**Sticky sidebar option (desktop):**
- Product info column stays visible during scroll
- Add to cart always accessible
- Useful for long product descriptions
- Improves conversion

## Price Display

### Standard Price Display

**Current price:**
- Large, bold font (28-36px)
- Currency symbol included ($49.99)
- Primary color or black

**Sale pricing:**
- Original price with strikethrough: ~~$79.99~~ $49.99
- Sale price in red or brand color
- "Save X%" badge nearby
- Example: Save 37%

**Variant price changes:**
- "Starting at $X" if variants have different prices
- Update price dynamically when variant selected
- No page reload required
- Show price change clearly (highlight briefly)

### Medusa Pricing (CRITICAL)

**Important difference from Stripe:**
- Medusa stores prices as-is (e.g., 49.99)
- Display directly: If API returns 49.99, show $49.99
- **DON'T divide by 100** (unlike Stripe which stores in cents)
- Example: Medusa 49.99 → Display $49.99 (NOT $0.4999)

**Multi-currency (Medusa):**
- Medusa supports multi-region pricing
- Display price in user's region currency
- Fetch pricing from selected region
- Show currency code (usd, eur, etc.)

## Variant Selection (Critical)

This is a complex ecommerce-specific challenge. Variants affect price, stock, and images.

### Variant Complexity

**Key challenges:**
- Multiple variant types (size, color, material)
- Variant availability varies (some sizes out of stock)
- Prices may differ by variant
- Images change by color variant
- Stock levels per variant
- Combinations may not exist (size M + color Red might not exist)

**Fetch from backend:**
```typescript
// Get all variants for product
// Change this based on the backend integrated
const product = await fetch(`/products/${id}?fields=*variants`)
// Returns variants with: id, sku, options, calculated_price, inventory_quantity
```

### Variant Selection Patterns

**Use Button Group when:**
- 2-8 options per variant type
- Size selection (XS, S, M, L, XL)
- Simple color options (5-6 colors)
- Users need to see all options at once

**Benefits:**
- Visible options (no click to reveal)
- Faster selection
- Clear visual feedback
- Better UX

**Use Dropdown when:**
- 10+ options per variant type
- Material/style options with long names
- Space-constrained layouts
- Mobile optimization needed

**Benefits:**
- Saves space
- Works better for many options
- Mobile-friendly

**Use Visual Swatches when:**
- Color or pattern variations
- Material with visual differences
- Visual is key to decision
- Fashion, home decor, customizable products

**Implementation:**
- Circular/square swatches (40-48px)
- Border on selected
- Show product image in that color when selected
- Color name on hover
- Gray out unavailable colors

### Variant Selection Flow

**Critical sequence:**
1. User selects first variant type (e.g., Color: Blue)
2. **Update available options** for other variant types
3. Show only size options available for Blue color
4. Gray out/disable unavailable combinations
5. Update price if variant price differs
6. Update main product image to show selected variant
7. Update stock availability
8. Enable/disable "Add to Cart" based on availability

**Example: Two variants (Color + Size)**
```typescript
// When color selected
// Change this based on the backend integrated
onColorSelect(color) {
  // Find selected variant
  const selectededVariant = product.variants.find((variant) => variant.options?.every(
    (optionValue) => optionValue.id === selectedOptions[optionValue.option_id!]
  ))

  // Check if size is selected and update price
  if (selectededVariant) {
    const variant = findVariant(color, selectedSize)
    updatePrice(variant.price)
    updateStock(variant.inventory_quantity)
  }
}
```

### Validation and Error Handling

**Prevent adding without selection:**
- Disable "Add to Cart" until all required variants selected
- Or: Show error message "Please select a size"
- Highlight missing selection (red border around options)
- Scroll to variant selection on error

**Handle out of stock variants:**
- Gray out unavailable options
- "Out of stock" text on hover
- Don't allow selection of out of stock variants
- Suggest alternative variants if available

**Handle variant not found:**
- When combination doesn't exist (Size M + Color Red)
- Disable second option when first selected
- Show only valid combinations
- Or: Show "This combination is not available"

## Stock Availability

**Display patterns:**

**In stock:**
- Green indicator (✓ or dot)
- "In stock" or "Available"
- Quantity if low: "Only 3 left"
- Encourages urgency without being pushy

**Out of stock:**
- Red indicator (✗ or dot)
- "Out of stock" message
- Disable "Add to Cart" button (grayed out)
- Offer "Notify me when available"
- Email capture for restock notifications (if supported by backend)

**Low stock warning:**
- "Only X left in stock"
- Shows scarcity (increases urgency)
- Typically show when <= 5 items
- Orange/yellow color

**Pre-order:**
- "Pre-order now" status
- Expected availability date: "Ships on [Date]"
- Different button text: "Pre-order" instead of "Add to Cart"
- Charge now or later (specify)

**Backend integration:**
```typescript
// Fetch stock for selected variant
const stock = selectedVariant.inventory_quantity

if (stock === 0) {
  showOutOfStock()
} else if (stock <= 5) {
  showLowStock(stock) // "Only 3 left"
} else {
  showInStock()
}
```

## Add to Cart Behavior

**Button states:**
- Default: Enabled (after variant selected)
- Hover: Slight color change or scale
- Loading: Spinner inside button (during API call)
- Success: Checkmark briefly, then revert
- Disabled: Grayed out (no variant or out of stock)

**Click behavior (Critical):**
1. Show loading state (disable button, show spinner)
2. Call API to add item to cart (backend)
3. **Optimistic UI**: Update cart count immediately (before API response)
4. Show success feedback (toast, checkmark, or cart popup)
5. Update cart count in navbar header
6. **DON'T navigate away** - stay on product page
7. Handle errors: restore count if API fails

**Success feedback options:**
- Toast notification: "Added to cart" (top-right)
- Cart popup: Show mini cart with items (see cart-popup.md)
- Checkmark in button briefly, then revert
- All three combined (checkmark + toast or cart popup)

**Error handling:**
```typescript
async function addToCart(variantId, quantity) {
  try {
    // Optimistic update
    updateCartCountUI(+quantity)

    // API call
    // Change this based on the backend integrated
    await fetch(`/store/carts/${cartId}/line-items`, {
      method: 'POST',
      body: JSON.stringify({ variant_id: variantId, quantity })
    })

    // Success feedback
    showToast('Added to cart')
    showCartPopup() // Optional
  } catch (error) {
    // Revert optimistic update
    updateCartCountUI(-quantity)

    // Show error
    if (error.message === 'OUT_OF_STOCK') {
      showError('Sorry, this item is now out of stock')
      updateStockStatus('out_of_stock')
    } else {
      showError('Failed to add to cart. Please try again.')
    }
  }
}
```

**Buy Now button (optional):**
- Skip cart, go directly to checkout
- Useful for: high-value items, single-item stores, decisive customers
- Secondary button below "Add to Cart"
- Text: "Buy Now" or "Buy It Now"
- Add to cart + redirect to checkout in one action

## Product Details Organization

### Decision: Tabs vs Accordion

**Use Tabs (desktop) when:**
- 3-5 distinct sections
- Each section has substantial content
- Users may want to compare sections
- Desktop has screen space
- Examples: Description, Specifications, Shipping, Reviews

**Use Accordion (mobile) always:**
- Saves vertical space
- Users expand what they need
- Standard mobile pattern
- Collapses after reading

**Hybrid approach (recommended):**
- Tabs on desktop (horizontal navigation)
- Accordion on mobile (vertical expansion)
- Same content, different presentation
- Best of both worlds

### Common Sections

**Description:**
- Product overview (2-4 paragraphs)
- Key features (bullet points)
- Use cases
- Materials and craftsmanship

**Specifications:**
- Technical details (table format)
- Dimensions, weight, materials
- Care instructions
- Compatibility information

**Shipping & Returns:**
- Shipping options and costs
- Delivery timeframes
- Return policy (30 days, 60 days)
- Return process
- Link to full policy page

**Reviews:**
- Embedded in tab/accordion
- Or: Separate section below
- Filter by rating, sort by date
- Review submission form

## Related Products Strategy

**Types of recommendations:**

**"You May Also Like" (Similar products):**
- Same category, similar price point
- Algorithm: category match + price range
- Goal: Show alternatives if unsure about current product

**"Frequently Bought Together" (Complementary):**
- Products commonly purchased together
- Algorithm: order history analysis
- Goal: Increase average order value
- Example: Phone + Case + Screen Protector
- Show bundle discount if available

**"Recently Viewed" (Browsing history):**
- User's browsing history (session or logged-in)
- Helps users return to products they liked
- Goal: Reduce decision paralysis

**"Customers Also Viewed":**
- Products viewed by others who viewed this
- Algorithm: co-viewing patterns
- Goal: Discovery and alternatives

### Display Pattern

**Product slider:**
- 4-6 products visible (desktop)
- 2-3 visible (mobile)
- Horizontal scrolling (swipe on mobile)
- Product cards: image, title, price, rating
- Optional: Quick "Add to Cart" on hover

**Placement:**
- Below product details and reviews
- Above footer
- Full-width section
- Clear heading for each type

**Backend integration:**
```typescript
// Fetch recommendations
// Change this based on the backend integrated
const recommendations = await fetch(`/products/${id}/recommendations`)
// Returns: similar, bought_together, recently_viewed
```

## Trust Signals and Conversion

**Essential trust signals:**

**Near Add to Cart:**
- Free shipping badge (if applicable)
- Free returns icon + text
- Secure checkout icon
- Money-back guarantee
- Warranty information (if applicable)

**Below product title:**
- Customer rating and review count (4.8 ★ 324 reviews)
- Link to reviews section
- "Best seller" or "Top rated" badge

**Payment methods:**
- Accepted payment icons (Visa, Mastercard, PayPal, Apple Pay)
- Small icons (40px)
- Below "Add to Cart" or in footer
- Shows payment options available

**For new/unknown brands:**
- Customer testimonials
- "Join 10,000+ happy customers"
- Security badges (if legitimate - don't fake)
- Social proof (Instagram photos, user content)
- Clear contact information

**For high-value products:**
- Detailed specifications
- Professional photography
- Video demonstrations
- Warranty details prominently displayed
- Customer service contact visible

## Mobile Optimization

**Critical mobile patterns:**

**Sticky "Add to Cart" bar:**
- Fixed at bottom of screen
- Always accessible (no scrolling needed)
- Shows: Price + "Add to Cart" button
- Appears after scrolling past fold
- Higher conversion rates

**Image gallery:**
- Full-width swipeable carousel
- Pinch to zoom
- Dot indicators (1/5, 2/5)
- Tap to open full-screen view

**Variant selection:**
- Large touch targets (44-48px)
- Visual swatches easier than dropdowns
- Clear selected state
- Error messages visible

**Accordion for details:**
- Description, Specs, Shipping as accordion
- Starts collapsed (save space)
- User expands what they need
- Clear expand/collapse indicators

**Reviews section:**
- Expandable (start with 2-3 reviews)
- "Show more" button
- Filter by rating
- Star rating distribution chart

## Checklist

**Essential product detail page features:**

- [ ] High-quality product images with zoom
- [ ] Price displayed correctly (Medusa: use value as-is, not divided)
- [ ] Variant selection required before adding to cart
- [ ] Variant selection updates: price, stock, image
- [ ] Disable unavailable variant options (gray out)
- [ ] Stock availability indicator (in stock, low stock, out of stock)
- [ ] "Only X left" shown when stock is low (<=5)
- [ ] Add to Cart disabled until variant selected
- [ ] Optimistic UI update (cart count updates immediately)
- [ ] Success feedback (toast, cart popup, or checkmark)
- [ ] Stay on product page after adding (don't navigate away)
- [ ] Error handling (out of stock, API failure)
- [ ] Product description and specifications
- [ ] Customer reviews and ratings
- [ ] Related products recommendations (similar, bought together)
- [ ] Trust signals (free shipping, returns, secure checkout)
- [ ] Payment method icons displayed
- [ ] Breadcrumb navigation
- [ ] Mobile: Swipeable image gallery
- [ ] Mobile: Accordion for product details
- [ ] Mobile: Sticky Add to Cart bar (optional but effective)
- [ ] Tabs on desktop, accordion on mobile (hybrid)
- [ ] Fast loading (<2s, optimize images)
- [ ] Keyboard accessible (tab through options, enter to add)
- [ ] ARIA labels on variant selection (role="group", aria-label)
