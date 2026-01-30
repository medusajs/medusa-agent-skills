# Search Component

## Contents

- [Overview](#overview)
- [Search Placement](#search-placement)
- [Autocomplete and Product Suggestions](#autocomplete-and-product-suggestions)
- [Search Results Page](#search-results-page)
- [Empty States](#empty-states)
- [Recent and Popular Searches](#recent-and-popular-searches)
- [Mobile Search](#mobile-search)

## Overview

Search is critical for ecommerce - users with search intent convert at higher rates. Provide fast, relevant product discovery with autocomplete.

**Assumed knowledge**: AI agents know how to build search inputs with icons and clear buttons. This guide focuses on ecommerce search patterns.

### Key Requirements

- Prominent search input (always accessible)
- Instant autocomplete after 2-3 characters
- Product suggestions with images
- Fast, relevant search results
- Filters to refine results
- Empty state guidance
- Mobile full-screen search modal

## Search Placement

**Desktop**: Navbar center (between logo and cart) or right side. Always visible, 300-500px width. Part of sticky navbar. Never hide in hamburger menu.

**Mobile**: Magnifying glass icon in top-right (44x44px minimum). Opens full-screen modal - eliminates distractions, maximizes suggestion space, better typing experience.

## Autocomplete and Product Suggestions

**Show suggestions** after 2-3 characters (not 1). Debounce 300ms to prevent excessive API calls.

**Display 5-10 product suggestions:**
- Small image (40-60px), title, price
- Clickable to product page
- Optional: Category/brand suggestions, popular terms
- Divide sections with headers
- "View all results for [query]" footer link

**Backend integration**: Fetch from search API. Check with ecommerce platform's documentation for API reference.

## Search Results Page

**Header**: "Search Results for '[query]'" + result count ("24 products found"). Search bar visible and pre-filled for refining.

**Grid layout**: Same as product listings (see product-listing.md). 1-4 columns based on device.

**Sorting**: Relevance (default, unique to search), Price Low/High, Newest.

**Filters**: Sidebar (desktop) or drawer (mobile). Category, Price, Brand, Availability with result counts.

## Empty States

**No results**: "No results for '[query]'" with helpful suggestions (check spelling, try broader keywords, browse categories). "Browse All Products" button + links to popular categories.

**Loading state**: Product card skeletons (6-8 cards), minimum 300ms display to avoid flashing.

## Recent and Popular Searches

**Recent searches** (user-specific, localStorage): Show 3-5 recent searches when input focused (before typing). Helps re-search without retyping.

**Popular searches** (site-wide, from backend): Show 5-10 trending terms when focused. Pill/tag styling.

Display both on: Empty input focus (desktop dropdown), mobile modal open.

## Mobile Search

**Full-screen modal pattern:**
- Header: Back button (44x44px) + search input (48px height, auto-focus, `type="search"`)
- Content: Recent/popular searches (empty), autocomplete (typing), scrollable
- Close: Back button, device back gesture, Escape key

## Ecommerce Search Checklist

**Essential features:**

- [ ] Prominent search input in navbar (desktop)
- [ ] Search icon clearly visible (mobile)
- [ ] Full-screen modal on mobile tap
- [ ] Autocomplete after 2-3 characters
- [ ] Debounced API calls (300ms)
- [ ] Product suggestions with images, prices
- [ ] "View all results" link in dropdown
- [ ] Search results page shows query
- [ ] Result count displayed
- [ ] Sort by Relevance (default for search)
- [ ] Filters for refining results (category, price, brand)
- [ ] Empty state with helpful guidance
- [ ] Loading state indicator (skeleton)
- [ ] Recent searches (localStorage)
- [ ] Popular searches (from backend)
- [ ] Mobile: Auto-focus, large input (48px)
- [ ] Keyboard navigation (arrow keys, Enter, Escape)
- [ ] ARIA labels (`role="search"`, `aria-label`)
- [ ] Accessible to screen readers
