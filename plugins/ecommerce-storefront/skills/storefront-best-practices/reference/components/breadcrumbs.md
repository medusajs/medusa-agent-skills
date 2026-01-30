# Breadcrumbs Component

## Contents

- [Overview](#overview)
- [When to Use Breadcrumbs](#when-to-use-breadcrumbs)
- [Ecommerce Breadcrumb Patterns](#ecommerce-breadcrumb-patterns)
- [Mobile Breadcrumbs](#mobile-breadcrumbs)
- [SEO Structured Data](#seo-structured-data)
- [Checklist](#checklist)

## Overview

Breadcrumbs show the user's location within the site hierarchy (Home → Category → Subcategory → Product). Critical for ecommerce navigation and SEO.

**Assumed knowledge**: AI agents know how to build breadcrumbs with separators and links. This guide focuses on ecommerce-specific patterns.

### Key Requirements

- Show full path from homepage to current page
- Each level clickable (except current page)
- Position below navbar, above page title
- Include structured data for SEO (JSON-LD)
- Mobile-optimized (back link pattern)

## When to Use Breadcrumbs

**Use for:**
- Product pages (Home → Category → Subcategory → Product)
- Category pages (Home → Category → Subcategory)
- Deep site hierarchies (3+ levels)
- Large catalogs with many categories

**Don't use for:**
- Homepage (no parent pages)
- Flat site structures (1-2 levels)
- Checkout flow (linear, not hierarchical)
- Search results (not hierarchical)

## Ecommerce Breadcrumb Patterns

### Product Page Breadcrumbs

**Standard pattern:**
- Home / Category / Subcategory / Product Name
- Example: Home / Electronics / Laptops / Gaming Laptop Pro

**Key considerations:**
- All levels except product name are clickable
- Product name is current page (non-clickable, darker text)
- Shows product's location in catalog

**Multiple category membership:**
- If product in multiple categories, choose primary/canonical
- Match category in URL or navigation path
- Be consistent across site

### Category Page Breadcrumbs

**Standard pattern:**
- Home / Parent Category / Current Category
- Example: Home / Electronics / Laptops

**Current category:**
- Non-clickable (plain text)
- Visually distinct from links (darker or bold)

### Path Construction

**Hierarchy:**
- Start with "Home" (or home icon)
- Follow category hierarchy
- End with current page
- Maximum 5-6 levels (keep shallow)

**URL alignment:**
- Breadcrumb path should match URL hierarchy
- Consistent naming between URLs and breadcrumbs
- Example: `/categories/electronics/laptops` → "Home / Electronics / Laptops"

## Mobile Breadcrumbs

### Mobile Pattern: Collapse to Back Link

**Recommended approach:**
- Show only previous level as back link
- Back arrow icon (←) + parent page name
- Example: "← Gaming Laptops"

**Why:**
- Saves vertical space on mobile
- Clear affordance (back navigation)
- Simpler than full breadcrumb trail
- Mobile users have device back button

**Alternative: Truncated path**
- Show "Home ... Current Page"
- Hide middle levels
- Balances space and context

## SEO Structured Data

**BreadcrumbList schema (CRITICAL)**: Add JSON-LD structured data. Breadcrumbs appear in search results, improves CTR, helps search engines understand site structure.

**Implementation**: schema.org BreadcrumbList with items array. Each item has position (1, 2, 3...), name, and URL. See seo.md for schema details.

## Checklist

**Essential features:**

- [ ] Positioned below navbar, above page title
- [ ] Full path shown (Home → Category → Product)
- [ ] All levels clickable except current page
- [ ] Current page visually distinct (non-clickable, darker)
- [ ] Clear separators (›, /, > or chevron)
- [ ] Mobile: Back link pattern ("← Category")
- [ ] Structured data (JSON-LD BreadcrumbList)
- [ ] Semantic HTML (`<nav aria-label="Breadcrumb">`)
- [ ] `aria-current="page"` on current item
- [ ] Keyboard accessible (tab through links)
- [ ] Truncate long labels (20-30 characters max)
- [ ] Consistent with navigation labels
- [ ] Maximum 5-6 levels deep
