# Hero Section Component

## Contents

- [Overview](#overview)
- [Hero Types and When to Use](#hero-types-and-when-to-use)
- [Content Guidelines](#content-guidelines)
- [Multiple Heroes (Carousel)](#multiple-heroes-carousel)
- [Mobile Hero](#mobile-hero)
- [Performance](#performance)
- [Checklist](#checklist)

## Overview

Hero section is the prominent banner at top of homepage, immediately below navigation. First content users see - sets tone for shopping experience.

**Assumed knowledge**: AI agents know how to build full-width banners with images and text overlays. This focuses on ecommerce hero patterns.

**Key requirements:**
- Above the fold (immediately visible)
- Clear value proposition or promotional message
- High-quality imagery
- Strong call-to-action
- Fast loading (critical for first impression)

## Hero Types and When to Use

### 1. Full-Width Banner (Most Common)

**Characteristics:**
- Spans entire viewport width
- Large background image or video
- Text overlay with headline + CTA
- Single focused message

**Best for:**
- Seasonal campaigns ("Summer Sale")
- New product arrivals
- Brand storytelling
- Single promotional focus
- Simple, bold message

**Example:** Background image of products, headline "40% Off Summer Sale", CTA "Shop Now"

### 2. Split Hero (Image + Content)

**Characteristics:**
- 50/50 or 60/40 split layout
- Image on one side, text content on other
- No text overlay on image
- Cleaner, easier to read

**Best for:**
- Product launches (show product clearly)
- Detailed messaging (more text space)
- Accessibility (no text-on-image contrast issues)
- Professional/B2B stores

**Example:** Product image (left 50%), headline + benefits + CTA (right 50%)

### 3. Minimal Hero

**Characteristics:**
- Large image, minimal text
- Image does storytelling
- Subtle headline, small CTA
- Emphasis on visual brand

**Best for:**
- Luxury brands (sophisticated aesthetic)
- Lifestyle brands (aspirational imagery)
- Photography-focused products
- Brand over promotion

### 4. Video Hero

**Characteristics:**
- Background video (muted, looping)
- Text overlay on video
- Fallback image for slow connections

**Best for:**
- Fashion brands (show products in motion)
- Lifestyle products (demonstrate usage)
- High-budget campaigns
- Brand storytelling with motion

**Important:** Auto-play muted, provide play/pause controls, optimize file size (<5MB), use poster image fallback.

### 5. Product Showcase Hero

**Characteristics:**
- Multiple featured products in hero
- Grid of 2-4 products
- Quick links to product pages
- Less promotional, more discovery

**Best for:**
- Multi-category stores
- Product-focused (not campaign-focused)
- Quick product discovery
- Minimal marketing, maximum browsing

## Content Guidelines

**Headline best practices:**
- Short and impactful (5-10 words)
- Clear value proposition ("Free Shipping on All Orders")
- Urgency if time-sensitive ("48-Hour Flash Sale")
- Benefit-focused ("Upgrade Your Style")
- Avoid generic ("Welcome to Our Store")

**Subtext (optional):**
- 10-20 words maximum
- Expand on headline benefit
- Add context or details
- Not always necessary (clean design)

**Call-to-action:**
- Single primary CTA button
- Action-oriented text ("Shop Now", "Explore Category", "Get Started")
- High contrast (stands out on image)
- Large enough (48px height minimum)
- Link to relevant landing page (sale, category, product listing)

**Image selection:**
- High quality, professional photography
- Shows products or lifestyle context
- Represents brand aesthetic
- Optimized for web (<500KB)
- Responsive (different crops for mobile)
- Ensure text overlay is readable (adequate contrast)

## Multiple Heroes (Carousel)

**Carousel pattern:**
- 2-4 slides rotating automatically
- Each slide = independent hero (own message, image, CTA)
- Auto-rotate every 5-7 seconds (slow enough to read)
- Manual controls (prev/next arrows, dot indicators)
- Pause on hover (accessibility)

**When to use carousel:**
- Multiple concurrent campaigns (Winter Sale + New Arrivals)
- Different audience segments (Men/Women/Kids)
- Seasonal variety showcase
- Limited above-fold space

**When NOT to use carousel:**
- Single focused campaign (just use one hero)
- Users rarely see slides beyond first (carousel blindness)
- Slower page load (multiple images)
- Accessibility concerns (auto-rotating content)

**Carousel best practices:**
- Max 3-4 slides (more = ignored)
- First slide most important (most viewed)
- Consistent layout across slides
- Clear indicators showing progress
- Don't rely on later slides for critical info
- Pause on interaction (hover, focus)

## Mobile Hero

**Mobile adjustments (CRITICAL):**

**Layout:**
- Full-width, portrait aspect (2:3 or 3:4)
- Vertical composition (text overlays center/bottom)
- Larger text for readability
- Simplified message (shorter headline)

**Split hero on mobile:**
- Stack vertically (image top, text bottom)
- Don't use side-by-side (too cramped)

**Performance:**
- Smaller images (<300KB)
- Different image crop for mobile portrait
- Use `srcset` or `<picture>` for responsive images
- Consider static image instead of video (mobile data)

**Touch interactions:**
- Large CTA button (48px height minimum)
- Easy carousel controls (if used)
- Swipe gesture for carousel slides

## Performance

**Critical for first impression:**

**Image optimization:**
- WebP format with JPEG fallback
- Lazy load below-fold content (not hero - it's above fold)
- Responsive images (mobile gets smaller size)
- Target: <500KB desktop, <300KB mobile
- Use CDN for faster delivery

**Video optimization:**
- <5MB file size maximum
- Muted, autoplay, loop
- Poster image (shows before video loads)
- Fallback to image on slow connections
- Consider not using on mobile (data/performance)

**LCP optimization:**
- Hero image is often Largest Contentful Paint
- Preload hero image: `<link rel="preload" as="image" href="hero.jpg">`
- Inline critical CSS for hero
- Avoid layout shift (set image dimensions)

**Target metrics:**
- LCP < 2.5 seconds
- No layout shift (CLS < 0.1)
- Fast interaction (hero CTA clickable immediately)

## Checklist

**Essential features:**

- [ ] Above the fold (immediately visible)
- [ ] Clear headline (5-10 words, value proposition)
- [ ] High-quality image (professional, on-brand)
- [ ] Primary CTA button (action-oriented, high contrast)
- [ ] Fast loading (<500KB image desktop, <300KB mobile)
- [ ] Responsive images (different sizes/crops for devices)
- [ ] Mobile: Portrait aspect ratio (2:3 or 3:4)
- [ ] Mobile: Vertical text placement (center/bottom)
- [ ] Mobile: Large CTA (48px height minimum)
- [ ] Text overlay readable (adequate contrast, background overlay)
- [ ] If carousel: Max 3-4 slides
- [ ] If carousel: Auto-rotate 5-7 seconds
- [ ] If carousel: Pause on hover/focus
- [ ] If carousel: Manual controls (arrows, dots)
- [ ] If video: Muted, autoplay, loop
- [ ] If video: Poster image fallback
- [ ] If video: <5MB file size
- [ ] Preload hero image (LCP optimization)
- [ ] No layout shift (set image dimensions)
- [ ] ARIA labels on carousel controls
- [ ] Keyboard accessible (Tab to CTA, arrow keys for carousel)
