# Product Slider Component

## Contents

- [Overview](#overview)
- [When to Use Product Sliders](#when-to-use-product-sliders)
- [Slider Patterns](#slider-patterns)
- [Product Display](#product-display)
- [Navigation Controls](#navigation-controls)
- [Mobile Sliders](#mobile-sliders)
- [Performance](#performance)
- [Checklist](#checklist)

## Overview

Product slider (carousel) displays multiple products horizontally with navigation to scroll through them. Used for related products, recently viewed, bestsellers, and featured products.

**Assumed knowledge**: AI agents know how to build carousels with navigation. This focuses on ecommerce product slider patterns.

**Key requirements:**
- Horizontal scrolling of product cards
- Arrow navigation (prev/next)
- Optional dot indicators
- Mobile: Swipe gesture support
- Responsive product count (4-6 visible desktop, 2-3 mobile)
- Lazy loading for off-screen products

## When to Use Product Sliders

**Use for:**
- Related products (product page)
- Recently viewed (product page, homepage)
- "You May Also Like" (product page)
- Bestsellers / Featured products (homepage)
- "Frequently Bought Together" (product page)
- New arrivals (homepage)
- Category showcases (homepage)

**Don't use for:**
- Main product images (use gallery instead)
- Critical content (not all users scroll/swipe)
- Checkout flow (keep linear)
- Primary navigation (use grid for discoverability)

## Slider Patterns

**Continuous scroll:**
- Shows 4-6 products at once (desktop)
- Scroll left/right by 1-2 products at a time
- Smooth animated transition (300-400ms)
- Most common pattern

**Infinite loop (optional):**
- Wraps to beginning after end
- Good for small product sets (<10 items)
- Creates continuous browsing feel
- Not necessary for large sets

**Snap to alignment:**
- Products snap to grid after scroll
- Prevents partial product visibility
- Better visual alignment
- Improves browsing experience

**Auto-play (NOT recommended for products):**
- Automatic scrolling without user action
- Poor UX for product sliders (users lose control)
- Only use for promotional banners/hero images
- If using: Pause on hover, slow speed (5-7s)

## Product Display

**Product cards in sliders:**
- Same cards as product grids (see product-card.md)
- Simplified on mobile (less detail, smaller images)
- Image, title, price minimum
- Optional: Rating, "Add to Cart" (desktop only)
- Adequate spacing between cards (16-24px)

**Responsive display:**
- Large desktop (>1440px): 5-6 products visible
- Desktop (1024-1440px): 4-5 products
- Tablet (768-1024px): 3-4 products
- Mobile (<768px): 2 products (sometimes 1.5 for scroll hint)

**Scroll hint on mobile:**
- Show 1.5 products (partial visibility of next)
- Indicates more content to swipe
- Improves discoverability
- Better than showing exact 2 products

## Navigation Controls

**Arrow buttons:**
- Left/right arrows outside slider
- Desktop: Always visible or show on hover
- Mobile: Hidden (swipe gesture preferred)
- Position: Vertically centered
- Size: 40-48px touch targets
- Disable left arrow at start, right arrow at end (no infinite loop)

**Dot indicators (optional):**
- Show progress through slider
- Each dot = one "page" of products
- Position: Below slider, centered
- Small (8-12px dots)
- Only if many products (>12)
- Less common for product sliders (more for hero carousels)

**Keyboard navigation:**
- Tab through visible product cards
- Arrow keys scroll slider (optional)
- Focus management on scroll

## Mobile Sliders

**Touch gestures:**
- Horizontal swipe to scroll
- Native scroll momentum
- Snap to product alignment
- No arrow buttons (swipe is intuitive)

**Mobile-specific adjustments:**
- 2 products visible (or 1.5 for hint)
- Larger touch targets on products
- Remove hover-only features (Quick View)
- Faster scroll animations (200-300ms)

**Performance on mobile:**
- Lazy load off-screen products
- Smaller image sizes
- Limit initial products loaded (8-10)
- Load more on scroll

## Performance

**Lazy loading (critical):**
- Only load visible products initially
- Load adjacent products (left/right) on demand
- Significantly improves page load time
- Use Intersection Observer API

**Image optimization:**
- Responsive images (smaller for mobile)
- WebP format with fallback
- Lazy load off-screen images
- Optimized thumbnails (<300KB)

**Limit slider length:**
- Max 20-30 products per slider
- "View All" link to full category page
- Improves performance
- Prevents endless scrolling

## Checklist

**Essential features:**
- [ ] 4-6 products visible (desktop), 2 (mobile)
- [ ] Arrow navigation (desktop)
- [ ] Swipe gesture (mobile)
- [ ] Product cards with image, title, price
- [ ] Responsive product count
- [ ] Smooth scroll transitions (300-400ms)
- [ ] Snap to product alignment
- [ ] Lazy load off-screen products
- [ ] "View All" link if many products (>20)
- [ ] Disable arrows at start/end
- [ ] Keyboard accessible (Tab through products)
- [ ] Mobile: No arrows, swipe only
- [ ] Optimized images (<300KB)
- [ ] Spacing between products (16-24px)
- [ ] ARIA labels on navigation (`aria-label="Previous products"`)
- [ ] `role="region"` on slider container
- [ ] NO auto-play for product sliders
