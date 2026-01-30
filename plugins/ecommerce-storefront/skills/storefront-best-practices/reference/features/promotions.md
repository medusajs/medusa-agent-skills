# Promotions Feature

## Contents

- [Overview](#overview)
- [Promotion Types and When to Use](#promotion-types-and-when-to-use)
- [Sale Price Display](#sale-price-display)
- [Promo Code Input](#promo-code-input)
- [Free Shipping Threshold](#free-shipping-threshold)
- [Promotional Banners](#promotional-banners)
- [Countdown Timers](#countdown-timers)
- [Mobile Considerations](#mobile-considerations)
- [Checklist](#checklist)

## Overview

Promotions are temporary price reductions, discounts, or special offers designed to drive sales and incentivize purchases. Effective promotion UI clearly communicates value, creates urgency, and makes redemption easy.

**Backend Integration (CRITICAL):**

All promotion logic and data must come from the ecommerce backend. Do this based on backend integrated. Fetch active promotions, discount codes, and price rules from backend API. Never hardcode promotion logic in frontend.

### Key Ecommerce Requirements

- Clear discount communication (strikethrough pricing, percentage off)
- Promo code input (cart/checkout)
- Free shipping threshold progress (increase AOV)
- Countdown timers (create urgency)
- Automatic discount application
- Sale badges (product discovery)

### Purpose

**Conversion optimization:**
- Drive sales and increase conversion rate
- Increase average order value (free shipping thresholds, tiered discounts)
- Acquire new customers (first-order discounts)
- Create urgency (limited-time offers)
- Clear inventory (seasonal sales)
- Reward loyalty (VIP codes, member discounts)

## Promotion Types and When to Use

### Sales (Price Reductions)

**What it is**: Select products with reduced prices, automatically applied. No code needed.

**Use when:**
- Seasonal sales (Black Friday, holiday sales)
- Clearance or end-of-season inventory
- Product-specific promotions
- You want reduced prices visible on product pages (increases click-through)

**Display:**
- Strikethrough original price (provides context for savings)
- Sale price bold and prominent (red or brand color)
- Sale badge on product cards ("Sale", "30% Off")

**Medusa implementation:**
Use Price Lists with special prices for products. Provides automatic strikethrough pricing in cart and on product pages.

### Discount Codes

**What it is**: Customer enters code to unlock discount (percentage, fixed amount, or free shipping).

**Use when:**
- Newsletter signups ("Get 10% off with WELCOME10")
- VIP or loyalty program members (exclusive codes)
- Targeted marketing campaigns (email, social media)
- First-time customer incentives
- Friends and family discounts (limited distribution)

**Display:**
- Promo code input field in cart/checkout
- Success message: "Code applied: WELCOME10"
- Discount shown in order summary with code name
- Remove option (X icon or "Remove" link)

**Medusa implementation:**
Discount/promo code system with advanced logic (order-level discounts, usage limits, expiration dates).

### Automatic Discounts

**What it is**: Discount automatically applied when conditions met. No code entry required.

**Use when:**
- Free shipping thresholds ("Free shipping over $50")
- Volume discounts ("Spend $100, get $20 off")
- Buy One Get One (BOGO) offers
- Encouraging larger cart values (increase AOV)

**Display:**
- Banner announcing the promotion
- Progress indicator toward threshold (see Free Shipping Threshold section)
- "Discount applied" message in cart
- Automatic addition to order summary

### Buy X, Get Y (BOGO)

**What it is**: Purchase certain products to unlock free/discounted items.

**Use when:**
- Moving inventory (clear out slow-moving products)
- Cross-selling related products ("Buy sunscreen, get beach bag 50% off")
- Increasing units per transaction

**Display:**
- Clear promotion text on product page ("Buy 2, Get 1 Free")
- Free/discounted item shown in cart with explanation
- Discount line in order summary

**Medusa implementation:**
Buy X Get Y automatic discount. Free/discounted item must be added to cart to activate.

## Sale Price Display

### Strikethrough Pricing Pattern

**Format:**
```
$49.99  $34.99
(Original, strikethrough)  (Sale price, bold)
```

**Design:**
- Original price: Strikethrough, muted gray color, smaller
- Sale price: Bold, larger, red or accent color
- Clear visual hierarchy (sale price dominates)

**Placement:**
- Product cards: Below image
- Product page: Near "Add to Cart" button
- Cart: Item price column

### Percentage Off Display

Show savings to emphasize value.

**Options:**
- "Save 30%" badge
- "30% off" label
- "$15 off" (absolute savings)

**Placement:**
- Badge on product image (top-left or top-right corner)
- Near price (inline or below)
- In cart summary ("Total savings: $45")

### Sale Badge

Bright badge on product image (red, orange, yellow) in top corner. 48-64px desktop, 40-48px mobile. Text: "Sale", "30% Off", or "Save $15".

## Promo Code Input

### Placement and Design

**Location:**
Cart page order summary or checkout page. Position in right sidebar (desktop) or below items (mobile).

**Layout:**
- Label: "Promo code" or "Discount code"
- Text input (200-280px desktop, full-width mobile)
- "Apply" button inline or stacked (mobile)
- Auto-uppercase on submit (codes usually uppercase)

**Expandable pattern (optional):**
"Have a promo code?" link that expands to show input. Saves vertical space, reduces visual clutter.

### Success and Error States

**Success:**
- Green checkmark or success message: "Code applied: WELCOME10"
- Discount shown in order summary with code name: "Discount (WELCOME10) -$10.00"
- Remove option: X icon or "Remove" link
- Update cart total immediately

**Error:**
- Red error message below input: "Invalid code", "Code expired", or "Minimum purchase not met"
- Input remains visible for retry
- Don't clear input field (user may have typo)

**Applied code display in order summary:**
```
Subtotal              $100.00
Discount (WELCOME10)  -$10.00
Shipping              $5.00
─────────────────────
Total                 $95.00
```

## Free Shipping Threshold

**Purpose (CRITICAL)**: Increase average order value by encouraging customers to add more items to reach free shipping.

### Progress Bar Pattern

**Display in cart:**
- "Add $25 more for FREE SHIPPING"
- Horizontal progress bar showing proximity to threshold
- Updates automatically as cart value changes
- Green when threshold reached

**Example:**
```
Add $25.00 more for FREE SHIPPING
[███████░░░░░░░░] 50%
```

**When threshold met:**
- "You've unlocked free shipping!" (success message)
- Green checkmark or badge
- Crossed-out shipping charge in order summary

**Why it works:**
- Visualizes proximity to goal (loss aversion)
- Increases AOV by 15-30% on average
- Reduces cart abandonment (free shipping is top reason to complete purchase)

### Free Shipping Banner

Sitewide announcement: "Free shipping on orders over $50". Display in top banner or near cart icon. Visible on all pages for awareness.

## Promotional Banners

### Top Banner

Full-width strip at top of page (48-64px height). Bright color contrasting with navbar. Short message: "Free shipping on orders over $50" or "Sale: Up to 50% off - Shop Now".

**Position:**
- Above navbar (most common)
- Below navbar (alternative)
- Sticky (stays visible on scroll, optional)

**CTA:**
Link to sale page ("Shop Now", "Learn More") or whole banner clickable.

### Hero Banner

Large hero section on homepage with promotional message. Background image, headline ("Black Friday Sale"), subheading ("Up to 60% off sitewide"), CTA button ("Shop the Sale"), optional countdown timer.

### Inline Banners

Within page content (product pages, cart). Examples: Free shipping reminder on cart page, "Sale ends soon" on product page. Less prominent than hero.

## Countdown Timers

Use for time-sensitive promotions to create urgency and FOMO.

**When to use:**
- Flash sales (24-hour sales)
- Limited-time offers
- Holiday promotions
- Never for permanent sales (fake urgency harms trust)

**Display format:**
- "Sale ends in: 2d 14h 32m 15s"
- Or simpler: "Ends in 2 days"
- Or: "Hurry! Only 14 hours left"

**Placement:**
Top banner, product page near price, cart page, or hero section.

**Implementation:**
Server-side time to prevent client manipulation, auto-hide when expired, update in real-time.

## Mobile Considerations

**Top banner:**
Shorter text (fewer words), smaller height (40-48px), dismissible (X button).

**Sale badges:**
Slightly smaller (40-48px), still clearly visible, don't obstruct product image.

**Promo code input:**
Full-width input and button, stacked layout (input above button), large touch targets (48px height), expandable section to save space.

**Countdown timer:**
Simplified format ("Ends in 14 hours" vs full d:h:m:s), larger text for readability.

## Checklist

**Essential features:**

- [ ] Strikethrough original price for sales
- [ ] Sale price bold, prominent, colored
- [ ] Sale badges on product images (40-64px)
- [ ] Percentage off displayed ("30% Off")
- [ ] Promo code input field in cart/checkout
- [ ] "Apply" button next to promo input
- [ ] Success message after applying code
- [ ] Error message for invalid codes
- [ ] Applied code displayed in order summary with name
- [ ] Remove code option (X icon or "Remove" link)
- [ ] Total savings highlighted in cart
- [ ] Free shipping progress bar (if applicable)
- [ ] Progress updates as cart value changes
- [ ] Success message when threshold met
- [ ] Countdown timer for time-limited offers (server-side)
- [ ] Promotional banners (top banner, hero)
- [ ] Backend integration (fetch promotions from API)
- [ ] Mobile: Full-width promo input, stacked layout
- [ ] Mobile: Large touch targets (48px)
- [ ] Expandable promo section (optional, saves space)
- [ ] ARIA labels on promo input
- [ ] Screen reader announcements for price changes
- [ ] Keyboard accessible (Tab, Enter)
- [ ] High contrast text (4.5:1 minimum)
