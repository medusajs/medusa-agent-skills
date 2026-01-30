# SEO Optimization for Ecommerce Storefronts

## Contents

- [Overview](#overview)
- [Meta Tags Requirements](#meta-tags-requirements)
- [Structured Data (Critical for Ecommerce)](#structured-data-critical-for-ecommerce)
- [Ecommerce URL Patterns](#ecommerce-url-patterns)
- [Product Page SEO](#product-page-seo)
- [Duplicate Content Issues](#duplicate-content-issues)
- [Dynamic Sitemaps](#dynamic-sitemaps)
- [Common SEO Mistakes](#common-seo-mistakes)

## Overview

SEO is critical for ecommerce - organic search drives high-intent traffic. Proper implementation helps search engines understand products and enables rich results (star ratings, price, availability in search).

**Assumed knowledge**: AI agents know basic SEO (meta tags, Open Graph, Core Web Vitals). This guide focuses on ecommerce-specific patterns.

### Every Product Page Needs

- Unique title and description (product name + features)
- Product schema with price, availability, rating
- Breadcrumb schema (category hierarchy)
- Canonical URL (prevents duplicate content)
- Descriptive image alt text
- Fast load time (LCP < 2.5s)

## Meta Tags Requirements

Generate unique meta tags for every product page dynamically from product data:

- **Title**: "Product Name - Key Feature | Store Name" (50-60 characters)
- **Description**: Key features + USP (150-160 characters)
- **Open Graph** tags for social sharing (image 1200x630px)
- **Canonical URL** for variants and category paths

**Common mistake**: Same title/description across all products. Generate dynamically from product data.

## Structured Data (Critical for Ecommerce)

Enables rich results in search (star ratings, price, availability shown directly in search results).

### Product Schema (Required on All Product Pages)

Implement schema.org Product structured data with these critical fields:

**Essential fields:**
- `name`, `description`, `image`, `sku`, `brand`
- `offers` object with:
  - `price`: Current price (Medusa: use as-is; other backends: check format)
  - `priceCurrency`: ISO 4217 code (USD, EUR, GBP)
  - `availability`: Must accurately reflect real stock status (InStock, OutOfStock, PreOrder)
  - `priceValidUntil`: Required for Google Shopping (set 30+ days in future)

**Critical**: `availability` must be dynamic and accurate. Marking out-of-stock items as InStock violates Google's guidelines.

### AggregateRating Schema (When Reviews Exist)

Add `aggregateRating` object to Product schema when real reviews exist:
- `ratingValue`: Average rating (e.g., "4.5")
- `reviewCount`: Total number of reviews
- `bestRating`: "5", `worstRating`: "1"

Displays star ratings in search results - powerful for CTR. **Only use for real reviews** - fake reviews violate guidelines.

### Breadcrumb Schema (Navigation Hierarchy)

Implement schema.org BreadcrumbList showing category hierarchy:
- Home → Category → Product
- Each level has `position`, `name`, `item` URL
- Helps search engines understand site structure

### Organization Schema (Homepage Only)

Add on homepage only: Organization name, URL, logo, contact information. Helps establish brand identity in search.

## Ecommerce URL Patterns

**Product URLs**: Use readable slugs with hyphens (`/products/wireless-headphones-pro`). Include keywords naturally, keep short (<75 characters), never change URLs.

**Category URLs**: Choose consistent structure:
- Hierarchical (`/categories/electronics/laptops`) for deep catalogs
- Flat (`/categories/laptops`) for simpler management
- Don't mix both approaches

**Pagination URLs**: Use query parameters (`/products?page=2`). Implement `rel="prev"` and `rel="next"` tags. Each page is canonical to itself (NOT to page 1) so all pages can be indexed.

**Filter URLs**: Use query parameters (`/products?color=blue&size=large`).

**Canonical decision for filters:**
- Few filters (2-3): Index filtered pages (primary navigation)
- Many filters (5+): Canonical to unfiltered (prevents duplicate content)
- Popular combinations: Consider indexing separately

## Product Page SEO

**Title tags**: Pattern "Product Name - Key Feature | Store Name" (50-60 characters). Avoid generic titles or keyword stuffing.

**Meta descriptions**: Include 2-3 key features + USP (free shipping, returns, warranty) in 150-160 characters. Make it compelling.

**Image alt text**: Descriptive and specific. Describe what's visible, include product name and key visual attributes. Don't keyword stuff. Keep under 125 characters.

## Duplicate Content Issues

### Ecommerce Duplicate Content Challenges

**Common scenarios:**
1. **Product variants**: Same product in multiple colors/sizes
2. **Multiple categories**: Product listed in multiple categories
3. **Filter combinations**: Filtered views create unique URLs
4. **Sort parameters**: Sorted views create unique URLs

### Solution: Canonical URLs

**Variant handling:**
- Choose one variant as canonical (usually default)
- All other variants canonical to that one
- Example: Blue, Red, Green shirts all canonical to Blue (default)

**Multiple category paths:**
- Choose one category as canonical (usually primary category)
- Example: Product in both "Electronics" and "Laptops" → canonical to "Laptops"

**Filtered/sorted views:**
- Canonical to unfiltered, default-sorted page
- Example: `/products?color=blue&sort=price` → canonical to `/products`

**Implementation:**
```html
<!-- On variant page (Red shirt) -->
<link rel="canonical" href="https://yourstore.com/products/cotton-tshirt" />

<!-- On filtered page -->
<link rel="canonical" href="https://yourstore.com/products" />
```

## Dynamic Sitemaps

Generate sitemaps dynamically from database to help search engines discover all products and categories.

**Requirements:**
- Include all public product and category pages
- Update `lastModified` when products change (fetch from database)
- Exclude `noindex` pages and filtered/sorted URLs
- Split into multiple sitemaps if >50,000 URLs
- Priority: Homepage (1.0) > Products (0.8) > Categories (0.6)

**Critical**: Regenerate sitemap when products are added/updated. Submit sitemap URL to Google Search Console.

## Common SEO Mistakes

**Ecommerce-specific SEO issues:**

1. **Duplicate content** - Same product accessible via multiple URLs (variants, categories). Use canonical URLs to consolidate signals.

2. **Missing Product schema** - No structured data on product pages. Implement Product schema for rich results (ratings, price in search).

3. **Incorrect availability status** - Marking out-of-stock items as "InStock" in schema. Dynamically set based on real stock levels (violates Google guidelines).

4. **Thin product content** - Only image and price, no description. Add detailed descriptions, specifications, reviews (200+ words).

5. **Static sitemap** - Never updates when products change. Generate dynamically from database so search engines discover new products.

6. **Poor image alt text** - Missing or generic "product image". Use descriptive alt text for image search traffic.

## SEO Checklist

### On Every Product Page

- [ ] Unique, descriptive title tag (50-60 characters)
- [ ] Unique, compelling meta description (150-160 characters)
- [ ] Open Graph and Twitter Card tags
- [ ] Product schema with price, availability, rating (if reviews exist)
- [ ] Breadcrumb schema (category hierarchy)
- [ ] Descriptive alt text on all images
- [ ] Canonical URL (especially for variants)
- [ ] Fast load time (LCP < 2.5s)
- [ ] Mobile-responsive design
- [ ] Internal links to related products/categories
- [ ] Detailed product description (200+ words ideal)

### Site-wide

- [ ] Dynamic XML sitemap submitted to search engines
- [ ] Robots.txt properly configured
- [ ] SSL certificate (HTTPS)
- [ ] Mobile-friendly design (44px touch targets)
- [ ] Organization schema on homepage
- [ ] Proper heading hierarchy (H1 for product title)
- [ ] Pagination implemented with rel="prev/next"
- [ ] Canonical URLs for filtered/sorted pages
- [ ] 404 pages with helpful navigation
- [ ] Image optimization (WebP, lazy loading)
- [ ] Core Web Vitals within targets (LCP < 2.5s, CLS < 0.1, INP < 200ms)
