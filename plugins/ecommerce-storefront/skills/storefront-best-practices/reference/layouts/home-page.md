# Homepage Layout

## Contents

- [Overview](#overview)
- [Essential Homepage Sections](#essential-homepage-sections)
- [Hero Section](#hero-section)
- [Featured Categories](#featured-categories)
- [Product Sections](#product-sections)
- [Value Propositions](#value-propositions)
- [Newsletter Signup](#newsletter-signup)
- [Content Hierarchy](#content-hierarchy)
- [Mobile Considerations](#mobile-considerations)
- [Checklist](#checklist)

## Overview

The homepage is the primary landing page for an ecommerce store. Purpose: Strong first impression, guide users to products, communicate value, drive conversions.

**Backend Integration (CRITICAL):**

All content (categories, products, promotions) must be fetched from the ecommerce backend. Do this based on backend integrated. Never hardcode homepage content. Fetch featured products, bestsellers, new arrivals, and categories dynamically.

### Key Ecommerce Functions

- Create strong first impression (builds trust)
- Guide users to products they want (reduce bounce rate)
- Showcase featured products and promotions (increase conversion)
- Communicate value propositions (free shipping, returns)
- Capture email addresses (build marketing list)
- Drive conversions and sales

## Essential Homepage Sections

### Must-Have Sections

**Critical for every homepage:**
1. Hero section (above the fold)
2. Category navigation (product discovery)
3. Featured/bestselling products (social proof)
4. Footer (contact, legal, navigation)

**Strongly recommended:**
1. Value propositions (free shipping, returns, etc.)
2. Social proof (reviews, testimonials, trust badges)
3. New arrivals or sale section
4. Newsletter signup

### Content Hierarchy Decision

**Above the fold (first screen):**
- Hero section with main message
- Primary call-to-action
- Key value propositions (optional)

**Middle sections:**
- Featured categories
- Product sections (bestsellers, new arrivals, sale)
- Promotional banners
- Social proof

**Bottom sections:**
- Newsletter signup
- Footer

## Hero Section

Large banner at top of homepage, first thing users see (above the fold). Communicates main message or promotion.

**Content options:**
- Seasonal campaign or sale
- New product arrivals
- Brand message or value proposition
- Featured product category
- Multiple rotating slides (carousel) - max 3-4 slides

**See also:** [hero.md](../components/hero.md) for detailed hero section guidelines including carousel patterns, mobile optimization, and performance.

## Featured Categories

### Purpose and Display

**Purpose**: Help users browse by category, reduce clicks to reach products, quick access to main product types.

**Category selection:**
- 4-8 main categories
- Most popular or seasonal categories
- Balanced representation
- **Fetch from backend dynamically** (never hardcode)

### Display Patterns

**Pattern 1: Category Grid with Images**
3-6 category tiles with images, category name overlay, click to navigate. Equal-sized tiles in grid layout (3-4 columns desktop, 2 mobile).

**Pattern 2: Category Cards**
Card layout with category image, name, and item count ("120 products"). "Shop [Category]" button on each card. 2-4 columns on desktop, 2 on mobile.

**Pattern 3: Category Slider**
Horizontal scrollable categories showing 4-6 at once. Arrows for navigation. See [product-slider.md](../components/product-slider.md).

## Product Sections

### Bestsellers Section (CRITICAL)

**Purpose**: Showcase popular products, build social proof, guide uncertain shoppers.

**Product selection (backend-driven):**
- Sort by total sales volume
- Update regularly (weekly or monthly)
- Mix of categories (not all one type)
- Show 8-15 products

**Layout:**
Product slider or grid, product cards with image, title, price, rating (if available). "View All" link to full bestsellers page.

### New Arrivals Section

**Purpose**: Highlight latest products, create sense of freshness, encourage repeat visits.

**Product selection:**
- Most recently added products (last 30 days)
- Sorted by newest first
- Exclude out-of-stock items
- Show 10-20 products

**Layout:**
Product slider, optional "New" badge on products. "Shop New Arrivals" link.

### Sale/Promotional Products

**Purpose**: Drive urgency and conversions, clear excess inventory.

**Product selection:**
- Products with active sale prices from backend
- Sorted by discount percentage
- Limited time or seasonal sales

**Display:**
Product slider with sale badges, strikethrough pricing, optional countdown timer (if time-limited sale).

## Value Propositions

### Trust & Convenience Features

**Purpose**: Build trust quickly, address common concerns (shipping cost, returns), differentiate from competitors.

**Common value propositions:**
- Free shipping (over threshold or always)
- Free returns (30/60/90 days)
- Secure checkout
- Customer support (24/7, phone, chat)
- Fast shipping (2-day, same-day)
- Quality guarantee or warranty

### Display Pattern

**Icon Row (most common):**
3-4 icons with text below hero section. Icon + short text (truck icon + "Free Shipping"). Single row, centered. 100-150px per item.

**Placement:**
Below hero section (most common) or above footer.

## Newsletter Signup

### Email Capture Section

**⚠️ IMPORTANT: Check footer first - don't duplicate newsletter forms.**

If your footer already includes a newsletter signup form, **do NOT add another newsletter section on the homepage**. Two newsletter forms on the same page:
- Creates confusion (which one to use?)
- Looks unprofessional and repetitive
- Reduces conversion (decision fatigue)
- Wastes valuable homepage space

**Decision:**
- Footer has newsletter? → Skip homepage newsletter section, use that space for other content
- Footer doesn't have newsletter? → Add homepage newsletter section (recommended placement: mid-page)
- Want both? → Only if they serve different purposes (e.g., footer = general newsletter, homepage = specific campaign/offer)

**Purpose**: Grow email list for marketing, offer incentive to build relationship.

**Design essentials:**
- Heading: "Stay in the Loop", "Get 10% Off"
- Subheading: Benefit of subscribing (don't just say "subscribe")
- Email input field
- Submit button
- Privacy note (optional): "We respect your privacy"

**Incentive (CRITICAL):**
- 10% off first order (most common)
- Early access to sales
- Exclusive content or products
- Free shipping code

**Layout options:**
- Full-width section (dedicated section, background color, centered)
- Inline form (between sections, smaller)
- Footer newsletter (part of footer) - see footer.md

**Placement:**
Mid-page (after 2-3 sections) or above footer.

## Content Hierarchy

### Section Order Recommendation

**Typical homepage structure:**
1. Hero section
2. Value propositions (free shipping, returns)
3. Featured categories
4. Bestsellers or Featured Products
5. Promotional banner (mid-page, optional)
6. New Arrivals
7. Newsletter signup (skip if footer already has newsletter form)
8. Footer

### Visual Rhythm

**Vary section types:**
Product section → Banner → Product section. Avoid monotony (all product sections in a row). Mix text-heavy and image-heavy sections.

**Spacing:**
Generous padding between sections (64-120px desktop, 40-60px mobile). Consistent spacing. Section backgrounds to create separation.

## Mobile Considerations

**Responsive layout:**
Single column for most sections, stack elements vertically, larger touch targets (44px minimum), simplified navigation.

**Product sections:**
Horizontal sliders with swipe gestures, or stacked product grids (2 columns). Smaller product cards optimized for mobile.

**Hero section:**
Portrait aspect ratio (2:3 or 3:4), vertical text placement (center/bottom). See [hero.md](../components/hero.md) for mobile hero details.

**Performance:**
Lazy load below-fold images, optimize hero image (<200KB), use WebP format. Mobile-first approach.

## Checklist

**Essential elements:**

- [ ] Hero section with clear message and CTA
- [ ] Featured categories (4-8 categories with images)
- [ ] Categories fetched from backend dynamically
- [ ] Bestsellers or Featured Products section
- [ ] New Arrivals section
- [ ] Value propositions (free shipping, returns, etc.)
- [ ] Social proof (reviews, ratings, testimonials)
- [ ] Newsletter signup form (only if footer doesn't have one - check footer first)
- [ ] No duplicate newsletter forms (homepage + footer)
- [ ] Footer with navigation and legal links
- [ ] Mobile-responsive layout (single column, 44px touch targets)
- [ ] Fast loading time (<3 seconds)
- [ ] Optimized images (<200KB, WebP format)
- [ ] Lazy loading for below-fold content
- [ ] Backend integration (all content fetched from API)
- [ ] Semantic HTML (main, section, h1, h2)
- [ ] Proper heading hierarchy (h1 → h2 → h3)
- [ ] Keyboard accessible
- [ ] ARIA labels on sections
- [ ] High contrast text (4.5:1 minimum)
- [ ] Clear CTAs on every section
