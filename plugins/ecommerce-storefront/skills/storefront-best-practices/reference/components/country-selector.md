# Country Selector Component

## Contents

- [Overview](#overview)
- [When to Implement](#when-to-implement)
- [UI Patterns](#ui-patterns)
- [State Management](#state-management)
- [Backend Integration](#backend-integration)
- [Detection and Defaults](#detection-and-defaults)
- [Mobile Considerations](#mobile-considerations)
- [Checklist](#checklist)

## Overview

Country selector allows customers to choose their country/region, which determines currency, pricing, available products, shipping options, payment methods, and localized content.

### Key Ecommerce Functions

- Display prices in correct currency
- Show country-specific product availability
- Apply region-specific promotions and discounts
- Calculate accurate shipping costs and delivery times
- Enable appropriate payment methods
- Display localized content and language

### Purpose

**Why country/region selection matters:**
- Prices vary by region (currency, taxes, import fees)
- Product availability differs by market
- Shipping methods and costs are region-specific
- Legal requirements vary (privacy, consumer protection)
- Payment methods differ by country
- Improves user experience with relevant content

## When to Implement

**Implement country selector when:**
- Backend supports multiple countries or regions
- Selling to multiple countries or regions
- Prices vary by location (currency, taxes)
- International shipping with different rates
- Region-specific product catalogs
- Multi-currency support needed
- Legal or regulatory requirements vary by region

**Skip if:**
- Backend doesn't support multiple countries or regions
- All prices in one currency
- No regional differences in catalog or pricing

## UI Patterns

### Placement Options

**Footer placement (modern and minimal):**
- Bottom of page in footer
- Less prominent but always accessible
- Icon (flag or globe) + country code/name

**Header placement (most common):**
- Top-right of navigation bar
- Icon (flag or globe) + country code/name
- Click opens dropdown or modal selector

**Modal/popup on first visit:**
- Detect location and suggest country
- Allow user to confirm or change
- Store preference for future visits

### Selector Design Patterns

**Pattern 1: Dropdown (Recommended)**

Small, compact selector in header. Shows current country flag/name, click to open dropdown with country list.

**Pros:** Doesn't interrupt browsing, always accessible, familiar pattern.

**Pattern 2: Modal on First Visit**

Full-screen or centered modal on first visit. "Select your country to see accurate prices and shipping."

**Pros:** Forces initial selection, ensures accurate pricing from start.
**Cons:** Can be intrusive, delays browsing.

**Tradeoff:** Modal ensures selection but adds friction. Dropdown is less intrusive but users may miss it.

**Pattern 3: Inline Banner**

Sticky banner at top: "Shipping to United States? Change" with link to selector.

**Pros:** Non-intrusive reminder, doesn't block content.
**Cons:** Takes vertical space, easy to ignore.

### Country List Display

**Search + list:**
- Search input at top
- Alphabetical country list below
- Popular countries at top (US, UK, Canada, etc.)
- Flag icons for visual recognition

**Grouped by region:**
- North America, Europe, Asia, etc.
- Collapsible sections
- Helpful for large lists (100+ countries)

**Format:**
```
🇺🇸 United States (USD)
🇬🇧 United Kingdom (GBP)
🇨🇦 Canada (CAD)
───────────────────
🇩🇪 Germany (EUR)
🇫🇷 France (EUR)
```

Show flag, country name, and currency code for clarity.

## State Management

### Storing Country Selection

**Client-side storage (recommended):**
- localStorage or cookies
- Persists across sessions
- Key: `region_id` or `country_code`

**Why local storage:**
- Fast access without API call
- Available immediately on page load
- No server round-trip needed

### Context Provider Pattern

**Recommended: Create context for region/country data.**

Provides quick access throughout the app to:
- Selected country
- Selected region (if applicable)
- Currency
- Available payment methods
- Shipping options

**Benefits:**
- Centralized country/region logic
- Easy access from any component
- Single source of truth
- Simplified cart and product queries

**Example structure:**
```typescript
interface RegionContext {
  country: string
  region?: string
  currency: string
  changeCountry: (country: string) => void
}
```

### When to Apply Selection

**Apply country/region to:**
- Product price display (convert currency, apply regional pricing)
- Cart creation (set region for accurate totals)
- Product queries (retrieve accurate pricing)
- Checkout flow (shipping methods, payment options)
- Content display (language, measurements)

## Backend Integration

### General Backend Requirements

**What backend needs to provide:**
- List of available countries/regions
- Mapping of countries to regions (if using regional structure)
- Pricing per region or country
- Product availability by region
- Shipping methods by region
- Supported payment methods by region

**API considerations:**
- Fetch country/region list on app load
- Pass selected country/region to product queries
- Include region in cart creation
- Validate country selection on backend

### Medusa Backend Integration

**For Medusa users, regions are critical for accurate pricing.**

Medusa uses regions (not individual countries) for pricing. A region can contain multiple countries.

**Key concepts:**
- **Region**: Group of countries with shared pricing (e.g., "Europe" region)
- **Country**: Individual country within a region
- **Currency**: Each region has one currency

**Mapping country to region:**
1. Customer selects country (e.g., "Germany")
2. Find which region contains that country (e.g., "Europe" region)
3. Store region ID for cart and product operations
4. Use region for all pricing queries

**Required for:**
- Creating carts: Must pass region ID
- Retrieving products: Pass region to get accurate prices
- Product availability: Products may be region-specific

**Implementation pattern:**
Create a context that stores both country and region. When country changes, look up corresponding region and update both.

**For detailed Medusa region implementation, see:**
- Medusa storefront regions documentation: https://docs.medusajs.com/resources/storefront-development/regions/context
- Medusa JS SDK regions endpoints
- Consult Medusa MCP server for real-time API details

**Other backends:**
Check the ecommerce backend's documentation for country/region handling patterns.

## Detection and Defaults

### Auto-Detection

**IP-based geolocation (recommended):**
Detect user's country from IP address. Use as default but allow user to change.

**Implementation:**
- Use geolocation API or service (MaxMind, ipapi.co, CloudFlare)
- Server-side detection (more accurate)
- Set as default, show confirmation: "Shipping to United States?"

**Benefits:** Reduces friction, most users keep detected country.

**Tradeoff:** Not 100% accurate (VPNs, proxies). Always allow manual override.

### Fallback Strategy

**If detection fails or unavailable:**
1. Check localStorage for previous selection
2. Use browser language as hint (`navigator.language`)
3. Default to primary market (e.g., US for US-based store)
4. Prompt user to select on first interaction (cart, checkout)

**Never block browsing if country unknown.**
Allow browsing with default pricing, prompt selection before checkout.

## Mobile Considerations

**Selector placement:**
Mobile hamburger menu or bottom of page. Top-right in mobile header if space allows.

**Modal selector:**
Full-screen modal on mobile for country selection. Large touch targets (48px), search input at top, easy scrolling.

**Sticky reminder:**
Small banner: "Shipping to US? Change" with tap to open selector.

**Detection prompt:**
Bottom sheet: "We detected you're in Germany. Is this correct?" with Confirm/Change buttons.

## Checklist

**Essential features:**

- [ ] Country selector visible (header, footer, or first-visit modal)
- [ ] Current country clearly displayed (flag, name, currency)
- [ ] Dropdown or modal with country list
- [ ] Search functionality for long country lists
- [ ] Popular countries at top of list
- [ ] Flag icons for visual recognition
- [ ] Show currency code per country
- [ ] localStorage persistence (save selection)
- [ ] Context provider for region/country data
- [ ] Auto-detection based on IP (optional)
- [ ] Manual override always available
- [ ] Apply to product prices (currency, regional pricing)
- [ ] Apply to cart creation (set region)
- [ ] Apply to checkout (shipping, payment methods)
- [ ] Fallback if detection fails
- [ ] Mobile: Full-screen modal or bottom sheet
- [ ] Mobile: Large touch targets (48px)
- [ ] Backend integration (fetch regions, map countries)
- [ ] For Medusa: Region context with country-to-region mapping
- [ ] For Medusa: Pass region to cart and product queries
- [ ] ARIA label on selector button
- [ ] Keyboard accessible (Tab, Enter, arrows)
- [ ] Screen reader announces country changes

**Optional enhancements:**

- [ ] Currency conversion display (show original + converted)
- [ ] Language selector tied to country
- [ ] Shipping estimate based on country
- [ ] Tax estimation display
- [ ] Regional content (images, messaging)
- [ ] "Not shipping to your country?" alternative
