# Product Listing Page Layout

## Contents

- [Overview](#overview)
  - [Reusable Component Architecture](#reusable-component-architecture-recommended)
- [Decision: Pagination vs Infinite Scroll vs Load More](#decision-pagination-vs-infinite-scroll-vs-load-more)
- [Decision: Filter Pattern Selection](#decision-filter-pattern-selection)
- [Product Grid Layout](#product-grid-layout)
- [Filtering Strategy](#filtering-strategy)
- [Sorting Strategy](#sorting-strategy)
- [Backend Integration](#backend-integration)
- [Empty and No Results States](#empty-and-no-results-states)
- [Performance Optimization](#performance-optimization)
- [Mobile Optimization](#mobile-optimization)
- [Checklist](#checklist)

## Overview

Primary browsing interface where users compare products, apply filters, and navigate to product details. Critical for product discovery and conversion.

### Key Requirements

- Responsive product grid (3-4 columns desktop, 2 mobile)
- Filtering (categories, price, attributes)
- Sorting options (price, popularity, newest)
- Pagination, infinite scroll, or load more
- Results count and active filter indicators
- Clear "no results" state with suggestions
- Fast loading and filtering (<1s filter updates)
- Backend integration for dynamic filtering

### Reusable Component Architecture (RECOMMENDED)

**Build product listing as a reusable component that works across multiple pages:**

✅ **Use the same product listing component for:**
- "Shop All" page (all products, no category filter)
- Category pages (filtered by specific category)
- Search results page (filtered by search query)
- Sale/Promotion pages (filtered by discount/promotion)
- Collection pages (curated product sets)
- Brand pages (filtered by brand)

**Benefits of reusable approach:**
- Single source of truth for product browsing UI
- Consistent filtering, sorting, and pagination behavior across entire site
- Easier maintenance (fix bugs once, applies everywhere)
- Better user experience (familiar interface on every product browsing page)
- Significantly less code duplication

**What to make configurable:**
- Initial filter parameters (category ID, search query, promotion ID, brand, etc.)
- Page title and breadcrumbs
- Whether to show filters sidebar (some pages may hide certain filters)
- Default sort order (category: featured, search: relevance, sale: discount %)
- Number of products per page
- Filter options available (hide category filter on category pages, etc.)

**Common mistake:**
- ❌ Creating separate components/pages for "Shop All", category pages, and search results with duplicated filtering/sorting/pagination logic
- ✅ Build one reusable ProductListing component that accepts filter parameters and reuse it across all product browsing pages

### Routing Pattern

**CRITICAL: Always use dynamic routes for category pages, NEVER static pages.**

Category/listing pages must use dynamic routes that accept a parameter (handle, slug, or category ID):

**Correct examples:**
- Next.js App Router: `app/categories/[handle]/page.tsx`
- Next.js Pages Router: `pages/categories/[handle].tsx`
- SvelteKit: `routes/categories/[handle]/+page.svelte`
- TanStack Start: `routes/categories/$handle.tsx`
- Remix: `routes/categories.$handle.tsx`

**Wrong examples:**
- ❌ `pages/categories/women.tsx` (static file per category)
- ❌ `pages/categories/men.tsx` (doesn't scale)

Fetch category products in the dynamic route based on the handle/ID parameter from the URL.

## Decision: Pagination vs Infinite Scroll vs Load More

This is a critical ecommerce decision that affects user experience, SEO, and technical implementation.

### Use Pagination When:

**User needs:**
- Return to specific result pages
- Precise control over browsing
- Professional/research shopping (compare systematically)
- B2B shoppers (procurement, large orders)

**Product characteristics:**
- Position matters (rankings, bestsellers)
- Large catalog with stable ordering
- Products require careful comparison

**Technical benefits:**
- SEO-friendly (unique URL per page)
- Better for indexing and crawling
- Easier back button support
- Lower memory usage

**Implementation:**
```typescript
// URL structure: /products?page=2&category=shirts
// Each page has unique URL for SEO
```

**Best for:**
- Desktop-heavy audience
- B2B ecommerce
- Product comparison shopping
- Catalog with 100+ products

### Use Infinite Scroll When:

**User needs:**
- Exploratory browsing behavior
- Mobile-first experience
- Seamless discovery flow
- Fashion/visual shopping

**Product characteristics:**
- Visual-heavy products (fashion, art, photography)
- Impulse purchases
- Discovery-focused (Pinterest-style)

**Technical considerations:**
- More complex to implement
- Requires careful SEO handling (pagination URLs still needed)
- Higher memory usage (all loaded products stay in DOM)
- Need to handle browser back button carefully

**Implementation:**
```typescript
// Load more when user scrolls to bottom
// Keep pagination in URL for SEO: /products?page=2
// Use Intersection Observer API for detection
```

**Best for:**
- Mobile-first stores (>60% mobile traffic)
- Fashion, home decor, visual products
- Younger demographic (18-34)
- Discovery-focused shopping

### Use "Load More" Button When:

**Benefits of compromise:**
- User controls when to load (not automatic)
- Footer remains accessible (important for policies, contact)
- Better for slower connections (international users)
- Accessibility friendly (no automatic loading)
- Lower memory usage than infinite scroll

**Implementation:**
```typescript
// Button triggers next page load
// Append products to existing grid
// Show count: "Load 24 More Products"
```

**Best for:**
- International audience (varying connection speeds)
- Footer content is important (legal, policies, contact)
- Accessibility concerns with infinite scroll
- Compromise between pagination and infinite scroll

### Hybrid Approach (Recommended):

Combine patterns based on context:
- Pagination for SEO (canonical URLs)
- Infinite scroll for UX (on user interaction)
- Load more for control (user-triggered)

**Example:**
```typescript
// Desktop: Pagination at bottom + infinite scroll option
// Mobile: Infinite scroll with pagination URLs for SEO
// All: Preserve scroll position on back button
```

## Decision: Filter Pattern Selection

### Sidebar Filters (Desktop)

**Use when:**
- Many filter options (5+ categories)
- Complex product attributes
- Power users (B2B, professional shoppers)
- Desktop-heavy traffic

**Layout:**
- Left sidebar (250-320px wide)
- Sticky position (scrolls with page)
- Collapsible sections (accordion)
- Apply immediately (no "Apply" button)

### Top Filters (Desktop)

**Use when:**
- Few filter options (2-4 key filters)
- Maximize grid space (full-width layout)
- Simple product categories
- Visual-first products (fashion)

**Layout:**
- Horizontal filter bar above grid
- Dropdowns or button toggles
- Limited options (price, category, brand)
- Compact design

### Drawer Filters (Mobile - Always)

**Pattern:**
- "Filters" button at top (shows active count badge)
- Slide-out drawer (full-screen or 80% width)
- Accordion sections
- "Apply" button at bottom (batch filtering)
- "Clear All" option

**Why batch filtering on mobile:**
- Prevents multiple re-renders on slow connections
- User can adjust multiple filters before applying
- Better mobile UX (less disruptive)

## Product Grid Layout

**Responsive columns:**
- Large desktop (>1440px): 4 columns
- Desktop (1024-1440px): 3-4 columns
- Tablet (768-1024px): 3 columns
- Mobile (< 768px): 2 columns

**Adjust based on product type:**
- Fashion/lifestyle: 3-4 columns (more visible at once)
- Electronics/detailed: 2-3 columns (larger cards, more detail)
- Furniture/large items: 2-3 columns (showcase details)

**Product card essentials:**
- Product image (primary)
- Title (truncated to 2 lines)
- Price (Medusa: display as-is, don't divide by 100)
- Optional: Rating, badges, wishlist
- See product-card.md for detailed guidelines

**Grid spacing:**
- 16-24px gap (desktop)
- 12-16px gap (mobile)
- Equal height rows (optional, improves visual consistency)

## Filtering Strategy

### Filter Types by Purpose

**Category filters:**
- Multi-select checkboxes
- Hierarchical (parent-child categories)
- Show product count per category
- Example: "Shirts (24)" "T-Shirts (12)"

**Price range filter:**
- Range slider (drag min/max)
- Or: Predefined ranges ("$0-$50", "$50-$100")
- Update dynamically as products filtered
- Show min/max from current results

**Attribute filters (Size, Color, Brand):**
- Multi-select checkboxes
- Visual swatches for colors
- Show available options based on current filters
- Gray out unavailable combinations

**Availability filters:**
- "In Stock" checkbox
- "On Sale" checkbox
- "New Arrivals" checkbox
- Single purpose, clear value

### Filter Behavior

**Filter persistence:**
- Save in URL parameters (shareable, bookmarkable)
- Example: `/products?category=shirts&price=0-50&color=blue`
- Restore filters on page reload
- Clear all filters should reset URL

### Active Filters Display

**Show active filters:**
- Above product grid
- Pill/tag format: "Blue ✕" "Under $50 ✕"
- Click X to remove individual filter
- "Clear All" link to remove all filters
- Count: "3 filters active"

## Sorting Strategy

### Common Sort Options

**Essential options:**
- **Featured** (default): Store's recommended order (bestsellers, promoted)
- **Price: Low to High**: Budget-conscious shoppers
- **Price: High to Low**: Premium product seekers
- **Newest**: Fashion, tech, time-sensitive products
- **Best Selling**: Social proof, popular choices
- **Top Rated**: Quality-focused shoppers

**Advanced options:**
- Name: A-Z (alphabetical)
- Discount: Highest % off (sale hunters)
- Reviews: Most reviewed (validation seekers)

### Sort Implementation

**Display:**
- Dropdown above product grid (right-aligned)
- Label: "Sort by:" or just dropdown
- Update products immediately on selection
- Show current sort in URL: `/products?order=-created_at`

**Backend integration:**
- Pass sort parameter to API (check backend docs for parameter name)
- Common parameters: `order`, `sort`, `sort_by`
- Common values: `-created_at` (desc), `+price` (asc), `-price` (desc)

**Preserve filters:**
- Sorting doesn't clear filters
- Maintains all active filters
- Updates URL with sort parameter

## Backend Integration

### Fetching Products

**Query parameters to include:**
- Category/collection filter (if applicable)
- Pagination (limit, offset or cursor)
- Sort order
- Filter values (price, attributes, etc.)
- For Medusa: `region_id` (required for correct pricing)

Check backend API documentation for exact parameter names and formats.

### Available Filters

**Dynamic filter updates:**
- Show only relevant filters for current category
- Display product count per filter option
- Gray out options with 0 products
- Update available options when filters change

### URL State Management

**Filter URL structure pattern:**
`/products?category_id=123&order=-created_at&page=2&price=0-50`

**Benefits:**
- Shareable links
- Bookmarkable searches
- Browser back/forward works correctly
- SEO-friendly (crawlable filter combinations)

**Implementation approach:**
- Read filters from URL query parameters on page load
- Update URL when filters change using URLSearchParams and history.pushState
- Parse URL parameters to reconstruct filter state

## Empty and No Results States

### No Products in Category

**When category is empty:**
- Message: "No products available yet"
- Subtext: "Check back soon for new arrivals"
- CTA: "Browse all products" or "Go to home"
- Alternative: Show related categories
- Optional: Newsletter signup for notifications

### No Results from Filters

**When filters too restrictive:**
- Message: "No products match your filters"
- Subtext: "Try removing some filters or adjusting your criteria"
- **Prominent "Clear All Filters" button**
- Show which filters might be too restrictive
- Suggestions: "Try expanding price range" or "Remove brand filter"

**Example:**
```
No products found

You filtered by:
- Color: Blue
- Size: XXL
- Price: $0-$20

Try:
• Removing size filter (only 2 XXL products)
• Expanding price range
• [Clear All Filters]
```

### No Results from Search

**When search query returns nothing:**
- Message: "No results for '[query]'"
- Suggestions: Check spelling, try different keywords
- CTA: Browse popular categories
- Show search suggestions (similar queries)
- Display popular or trending products

## Performance Optimization

### Lazy Loading Images

**Implementation:**
- Load images as they come into viewport
- Use Intersection Observer API
- Show placeholder or blur-up effect
- Improves initial page load significantly

**Critical for ecommerce:**
- Product listings have 24-100+ images per page
- Lazy loading reduces initial load by 60-80%
- Faster perceived performance

### Virtual Scrolling (Advanced)

**When to use:**
- Very large catalogs (500+ products visible)
- Infinite scroll with memory concerns
- Performance issues with many DOM elements

**How it works:**
- Only render visible products + buffer
- Reuse DOM elements as user scrolls
- Maintains scroll position
- Libraries: react-window, react-virtuoso

**Tradeoff:**
- Complex implementation
- Better performance for large lists
- Required for catalogs with 1000+ products loaded

### Filter Performance

**Optimistic UI:**
- Update grid immediately (predicted results)
- Show loading overlay briefly
- Replace with real results
- Better perceived performance

## Mobile Optimization

**Critical mobile patterns:**

**2-column grid:**
- Maximum 2 products per row
- Larger touch targets
- Simplified cards (essential info only)
- Remove hover effects

**Filter drawer:**
- Full-screen or 80% width drawer
- "Filters" button with badge count
- Batch apply (don't re-fetch on each change)
- Clear all at top

**Sticky filter/sort bar:**
- Fixed at top while scrolling
- Quick access to filters and sorting
- Shows active filter count
- Higher engagement rates

**Infinite scroll default:**
- Better mobile UX than pagination
- Natural scrolling behavior
- Keep pagination URLs for SEO
- Handle back button correctly

**Performance:**
- Lazy load images (critical on mobile)
- Limit initial products (12-24)
- Optimize image sizes for mobile
- Fast filter updates (<1s)

## Checklist

**Essential product listing features:**

- [ ] **RECOMMENDED: Product listing built as reusable component**
- [ ] Reusable component works for: shop all, category pages, search results, sale pages
- [ ] Component accepts filter parameters (categoryId, searchQuery, promotionId, etc.)
- [ ] Responsive grid (3-4 columns desktop, 2 mobile)
- [ ] Decision made: Pagination vs infinite scroll vs load more
- [ ] Filter pattern selected: Sidebar (desktop) vs drawer (mobile)
- [ ] Filters fetched from backend dynamically
- [ ] Filter options show product count
- [ ] Active filters displayed above grid (removable pills)
- [ ] "Clear all filters" button prominent
- [ ] Sorting options (featured, price, newest, bestselling)
- [ ] Sort updates products without clearing filters
- [ ] Filters and sort persist in URL (shareable)
- [ ] Results count displayed ("Showing 1-24 of 156 products")
- [ ] Empty state: "No products match filters" with suggestions
- [ ] "Clear all filters" prominent when no results
- [ ] Product prices displayed correctly (Medusa: as-is, not divided)
- [ ] Lazy loading for images (Intersection Observer)
- [ ] Loading state for filter changes (< 1s)
- [ ] Mobile: Filter drawer with batch apply
- [ ] Mobile: 2-column grid maximum
- [ ] Mobile: Sticky filter/sort button
- [ ] Pagination URLs for SEO (even with infinite scroll)
- [ ] Back button support (restore filters, scroll position)
- [ ] Keyboard accessible (tab through filters, enter to apply)
- [ ] ARIA labels on filters (role="group", aria-label)
