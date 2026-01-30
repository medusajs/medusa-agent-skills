# Navbar Component

## Contents

- [Overview](#overview)
- [Decision: Simple Dropdown vs Megamenu](#decision-simple-dropdown-vs-megamenu)
- [Key Ecommerce Patterns](#key-ecommerce-patterns)
- [Layout Structure](#layout-structure)
- [Accessibility Essentials](#accessibility-essentials)
- [Common Ecommerce Mistakes](#common-ecommerce-mistakes)
- [Backend Integration](#backend-integration)
- [Checklist](#checklist)

## Overview

Primary navigation for ecommerce storefronts. Desktop: horizontal menu with category links. Mobile: hamburger drawer with accordion subcategories.

### ⚠️ CRITICAL: NEVER Hardcode Categories

**ALWAYS fetch categories dynamically from the backend. NEVER hardcode static category arrays.**

❌ **WRONG - DO NOT DO THIS:**
```typescript
// WRONG - Static hardcoded categories
const categories = [
  { name: "Women", href: "/categories/women" },
  { name: "Men", href: "/categories/men" },
  { name: "Accessories", href: "/categories/accessories" }
]
```

✅ **CORRECT - Fetch from backend:**
```typescript
// CORRECT - Fetch categories dynamically
const [categories, setCategories] = useState([])

useEffect(() => {
  fetch(`${apiUrl}/store/product-categories`)
    .then(res => res.json())
    .then(data => setCategories(data.product_categories))
}, [])
```

**Why this matters:**
- Categories change frequently (new categories, renamed, reordered)
- Hardcoded categories become outdated immediately
- Requires code changes every time categories change
- Cannot scale to stores with dynamic catalogs
- Defeats the purpose of headless commerce

### Key Requirements

- Desktop: Horizontal category links, cart/account/search right-aligned
- Mobile: Hamburger drawer, cart stays visible in header (not hidden in drawer)
- **CRITICAL: Fetch categories from backend dynamically (NEVER hardcode static arrays)**
- Sticky: Recommended for easy cart access while browsing
- Real-time updates: Cart count, login state, category changes

## Decision: Simple Dropdown vs Megamenu

**Use Simple Dropdown when:**
- <10 top-level categories
- Flat or shallow hierarchy (1-2 levels deep)
- Minimal subcategories per parent
- Focused/specialized product catalog

**Use Megamenu when:**
- 10+ top-level categories
- Deep hierarchy (3+ levels)
- Need to showcase featured products in navigation
- Complex product catalog
- Fashion, electronics, or large inventory

**Mobile**: Always use drawer with accordion pattern, never megamenu on mobile.

See [megamenu.md](megamenu.md) for megamenu implementation details.

## Key Ecommerce Patterns

### Cart Indicator (CRITICAL)

**Always visible on both desktop and mobile:**
- Desktop: Top-right, cart icon + count badge
- Mobile: Top-right in header (NOT hidden in hamburger drawer)
- This is non-negotiable - users expect cart always accessible

**Badge display:**
- Shows item count (NOT price - confusing when variants change)
- Only visible when cart has items (count > 0)
- Show actual count up to 99, then "99+"
- Position: Top-right corner of cart icon
- ARIA label: `aria-label="Shopping cart with 3 items"`

**Real-time updates:**
- Update count immediately when items added (optimistic UI)
- No page refresh required
- Sync with backend cart state
- Handle errors gracefully (restore count if add fails)

**Click behavior:**
- Option 1: Navigate to cart page
- Option 2: Open cart popup/drawer (see cart-popup.md)
- Choice depends on store type (see cart-popup.md for decision criteria)

✅ **CORRECT:**
- Cart icon visible in mobile header
- Badge shows count (not price)
- Updates in real-time without page refresh
- 44x44px touch target
- Links to cart or opens cart popup

❌ **WRONG:**
- Hiding cart in mobile hamburger drawer (users can't find it)
- Showing price in badge (€25.99) instead of count
- Cart count doesn't update until page refresh
- No visual feedback when items added

### Category Navigation

**CRITICAL: Fetch dynamically from backend (NEVER hardcode):**

❌ **WRONG - These are all incorrect approaches:**
```typescript
// WRONG - Hardcoded array
const categories = ["Women", "Men", "Kids", "Accessories"]

// WRONG - Static object array
const categories = [
  { id: 1, name: "Women", slug: "women" },
  { id: 2, name: "Men", slug: "men" }
]

// WRONG - Importing static data
import { categories } from "./categories.ts"
```

✅ **CORRECT - Fetch from backend API:**
- Medusa: Use SDK category list method (verify exact method with docs/MCP)
- Other backends: Call categories endpoint (check API documentation)
- Fetch on component mount or during server-side rendering

**Why dynamic fetching is mandatory:**
- Store owners add/remove/rename categories frequently
- Category order and hierarchy changes
- Multi-language stores need translated category names
- Featured categories rotate (seasonal, promotions)
- Hardcoded values require developer intervention for simple changes

**Caching strategy:**
- Cache categories (revalidate on interval or manual trigger)
- Use SWR, TanStack Query, or framework-level caching
- Revalidate every 5-10 minutes or on page navigation
- Update immediately when backend categories change

**Organization:**
- 4-7 top-level categories ideal (max 10 on desktop)
- Order comes from backend (respects admin's ordering)
- Keep "Sale" or "New Arrivals" prominent if backend provides it
- Maximum 2 levels in simple dropdown (category → subcategory)
- Deeper hierarchies: Use megamenu or separate category pages

**Desktop behavior:**
- Horizontal links with hover dropdowns for subcategories
- Slight hover delay to prevent accidental triggers
- Click parent to navigate to category page
- Click child to navigate to subcategory

**Mobile behavior:**
- All categories in hamburger drawer
- Accordion pattern for subcategories (expand/collapse)
- Close drawer on category click (except expanding accordion)
- Scrollable drawer if categories exceed viewport height

✅ **CORRECT:**
- Categories fetched from backend API on mount
- Cache with revalidation strategy
- Respects backend ordering and hierarchy
- 4-7 top-level items on desktop (based on what backend returns)
- Accordion for mobile subcategories
- Consistent ordering across devices

❌ **WRONG:**
- Hardcoded category array in component (NEVER DO THIS)
- Static categories imported from file (NEVER DO THIS)
- No cache invalidation (stale categories)
- Too many top-level items (>10, overwhelming)
- Different category order on desktop vs mobile
- Categories don't update when backend changes

### User Account Indicator

**Two states based on authentication:**

**Logged out:**
- Desktop: "Sign In" or "Log In" text + user icon
- Mobile: User icon only
- Click navigates to login page
- Clear call-to-action

**Logged in:**
- Desktop: User name, initials, or email + dropdown
- Mobile: User name/initials or icon → account page
- Dropdown menu (desktop): My Account, Orders, Wishlist, Sign Out
- Fetch current user from backend authentication state

**Authentication state management:**
- Check auth state from backend (not just localStorage)
- Update immediately on login/logout events
- Handle session expiration gracefully
- Sync across tabs if possible

✅ **CORRECT:**
- Shows "Sign In" when logged out
- Shows user identifier when logged in
- Dropdown with account actions
- Checks backend auth state (not just client state)

❌ **WRONG:**
- No indication of login state
- Relies solely on localStorage (can be stale)
- No dropdown for account actions when logged in
- Missing logout option

### Mobile Navigation Pattern

**Hamburger drawer:**
- Trigger: Hamburger icon (top-left)
- Drawer: Slides from left, 80-85% width, full height, scrollable
- Backdrop: Semi-transparent overlay, click to close
- Content: All categories with accordion subcategories

**CRITICAL: Keep cart in header:**
- Cart icon stays in mobile header (top-right)
- Don't hide cart inside drawer
- Users expect cart always accessible
- Same for search icon if using icon-only search

**Account in drawer:**
- Logged out: "Sign In" link in drawer header or top of menu
- Logged in: User name/initials in drawer header with link to account

**Close behavior:**
- Close button (X) in drawer header
- Click backdrop overlay
- Navigate to category (drawer closes)
- Escape key

✅ **CORRECT:**
- Cart stays in mobile header (visible)
- Hamburger opens drawer from left
- Backdrop overlay dims background
- Close on navigation or backdrop click
- Scrollable drawer for long menus

❌ **WRONG:**
- Cart hidden inside hamburger drawer (cardinal sin)
- Full-screen drawer (no backdrop)
- Drawer doesn't close on navigation
- Not scrollable (categories cut off)

### Bottom Navigation (Alternative for Mobile)

**When to use:**
- Store has 3-5 key sections (Home, Browse, Cart, Account, Search)
- App-like experience desired
- Frequent switching between sections
- Not suitable for complex category hierarchies

**Pattern:**
- Fixed bar at bottom of screen (mobile only)
- Icon + label for each section
- Highlight active section
- 5 items maximum
- Direct navigation, no dropdowns

## Layout Structure

**Desktop:**
- Left: Logo → Homepage
- Center: Category links (horizontal)
- Right: Search, Account, Cart

**Mobile:**
- Left: Hamburger
- Center: Logo
- Right: Cart (+ Search icon optional)

**Sticky recommended:**
- Keeps cart/account accessible while scrolling
- Use `position: sticky` or `position: fixed`
- Solid background color (hide scrolling content)
- Adequate z-index to stay above content

## Accessibility Essentials

**Ecommerce-specific ARIA:**
- Cart count: `aria-live="polite"` to announce changes (e.g., "3 items in cart")
- Mobile drawer: `role="dialog"`, `aria-modal="true"`
- Hamburger button: `aria-label="Open navigation menu"`, `aria-expanded="false"`
- Active page: `aria-current="page"` on current category link
- Dropdown indicators: `aria-expanded`, `aria-controls` for megamenu relationships

**Keyboard navigation:**
- Tab through all links/buttons
- Enter/Space to activate
- Escape to close mobile menu or dropdowns
- Visible focus indicators (outline/ring)

**Generic accessibility applies:**
- Semantic HTML (`<header>`, `<nav>`)
- Icon buttons need ARIA labels
- 4.5:1 color contrast minimum
- 44x44px touch targets on mobile

## Common Ecommerce Mistakes

❌ **CRITICAL: Hardcoded static categories** - NEVER create static category arrays like `const categories = ["Women", "Men"]` or import from static files. ALWAYS fetch from backend API. Categories change constantly - new categories added, names changed, ordering updated. Hardcoded categories require developer intervention for simple changes and defeat the purpose of dynamic commerce platforms. This is the #1 most common mistake.

❌ **Hiding cart in mobile drawer** - Users expect cart always visible. Keep cart icon in header (top-right), not hidden inside hamburger menu.

❌ **No real-time cart updates** - Update count immediately when items added (optimistic UI). Don't require page refresh.

❌ **Showing price in cart badge** - Show item count (number), not total price. Price display confuses when variants have different quantities.

❌ **No cache invalidation** - Categories become stale when backend changes. Revalidate periodically (5-10 min) or on manual trigger.

❌ **Hover-only dropdowns on mobile** - Use click/tap interactions. Hover doesn't work on touch devices.

❌ **Desktop navigation on mobile** - Use hamburger drawer pattern, not horizontal menu that doesn't fit.

❌ **Inconsistent category order** - Same order on desktop and mobile for consistency. Respect backend's category ordering.

## Backend Integration

### Category Fetching (CRITICAL - NEVER Hardcode)

**Implementation patterns:**

**Client-side fetching:**
- Fetch categories in useEffect on mount
- Store in state (use appropriate types for Medusa: StoreProductCategory)
- Handle loading and error states
- Map categories to navigation links
- Use category.id as key, category.handle for URL, category.name for display

**With caching (RECOMMENDED):**
- Use TanStack Query with queryKey ['categories']
- Set staleTime: 5-10 minutes (categories rarely change)
- Automatic loading/error states
- Request deduplication if multiple components need categories

**Server-side fetching:**
- Fetch in server component or load function
- No loading state needed (rendered on server)
- Better for SEO

**Cart state synchronization pattern:**
- Subscribe to global cart state (Context)
- Update navbar cart count when cart changes
- Handle optimistic updates (show new count immediately on add to cart)
- Sync with backend on events or interval

**Authentication state pattern:**
- Check auth state from backend on mount
- Listen for login/logout events
- Update account indicator immediately
- Handle session expiration gracefully

**Category update triggers:**
- On page load/navigation
- On manual refresh trigger
- On revalidation interval (5-10 minutes)
- After admin updates categories (webhook or polling)

## Checklist

**Essential navbar features:**

- [ ] **CRITICAL: Categories fetched dynamically from backend API (NOT hardcoded arrays)**
- [ ] **CRITICAL: No static category imports or hardcoded category lists**
- [ ] Desktop: Horizontal category links
- [ ] Mobile: Hamburger drawer with accordion
- [ ] Cart icon visible on both desktop and mobile header (NOT hidden in drawer)
- [ ] Cart badge shows item count (not price)
- [ ] Cart count updates in real-time
- [ ] Categories use backend ordering (not manual ordering)
- [ ] Account indicator shows login state
- [ ] Logo links to homepage
- [ ] 4-7 top-level categories displayed (max 10)
- [ ] Mobile drawer closes on navigation
- [ ] Sticky navigation (recommended)
- [ ] 44x44px minimum touch targets
- [ ] ARIA labels on icon buttons
- [ ] `aria-live` on cart count for screen readers
- [ ] Keyboard accessible with visible focus states
- [ ] Categories cached with revalidation strategy (5-10 min)
- [ ] Error handling for failed category fetch
