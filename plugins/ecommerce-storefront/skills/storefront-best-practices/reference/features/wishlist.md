# Wishlist Feature

## Contents

- [Overview](#overview)
- [Backend Support Check](#backend-support-check)
- [Wishlist Button](#wishlist-button)
- [Adding and Removing](#adding-and-removing)
- [Wishlist Page](#wishlist-page)
- [Guest vs Logged-In Users](#guest-vs-logged-in-users)
- [Navigation Icon](#navigation-icon)
- [Mobile Considerations](#mobile-considerations)
- [Checklist](#checklist)

## Overview

A wishlist (also called favorites or save for later) allows customers to save products they're interested in for future purchase. This feature helps organize shopping, track desired items, and increases return visits and conversions.

### Key Ecommerce Benefits

**Why wishlists matter:**
- Increase return visits (users come back to check wishlist)
- Reduce cart abandonment (save for later instead of abandoning)
- Gift planning (save items for gift lists, share with others)
- Price tracking (users monitor items for sales - remarketing opportunity)
- Engagement metric (shows product interest for analytics)

**Conversion impact:**
- Users with wishlists have 2-3x higher lifetime value
- Wishlist-to-purchase conversion: 20-30% on average
- Email reminders about wishlist items: 15-25% click-through rate

## Backend Support Check

**CRITICAL: Only implement wishlist UI if your ecommerce backend supports wishlist functionality.**

Before implementing:
1. **Check backend API** - Verify wishlist endpoints exist (or ask user)
2. **Authentication** - Confirm if login required for wishlist storage
3. **Test operations** - Verify add/remove/fetch functionality works

**Medusa users:**
Medusa core doesn't include wishlist by default. Install the Wishlist plugin from Medusa examples repository. Plugin provides full wishlist functionality with API endpoints.

**General backends:**
Wishlist typically requires user authentication. API endpoints needed:
- GET /wishlist (fetch user's wishlist)
- POST /wishlist (add item)
- DELETE /wishlist/{id} (remove item)

**If backend doesn't support wishlist:**
Don't implement the feature. localStorage-only wishlist creates poor UX (lost on device switch, no sync, no remarketing).

## Wishlist Button

### Design and States

**Heart icon** (universal symbol):
- Outline heart: Not in wishlist
- Filled heart: In wishlist
- 24-32px on product cards, 32-40px on product page

**Colors:**
- Outline: Gray or black
- Filled: Red, pink, or brand color
- High contrast against product image

### Placement

**Product cards:**
Top-right corner of product image, always visible (not hover-only), 16px margin from edges.

**Product detail page:**
Near "Add to Cart" button, or above product image, or with sharing options. Optional text label: "Add to Wishlist" or icon-only.

## Adding and Removing

### Adding to Wishlist

**Flow:**
1. User clicks heart icon
2. Show loading state briefly
3. Send API request to add item
4. Update icon to filled state
5. Show success feedback (toast: "Added to wishlist" or subtle animation)
6. Update navigation wishlist badge (+1)

**Optimistic UI:**
Update icon immediately, revert if API fails. Provides instant feedback.

**Error handling:**
Show error toast ("Failed to add to wishlist"), revert icon to outline, allow retry.

**Variant handling:**
Save specific variant (size, color) if selected on product page. On product cards, save default variant.

### Removing from Wishlist

**From product card/page:**
Click filled heart → changes to outline → toast: "Removed from wishlist" → update badge (-1).

**From wishlist page:**
X icon in corner of product card or "Remove" button → item fades out. Optional: Undo action in toast (5 seconds).

**Confirmation:**
Generally not needed (low stakes, easily reversible). Only confirm for bulk actions ("Clear all").

## Wishlist Page

### Layout

**Heading:**
"My Wishlist" or "Favorites" with item count ("12 items saved").

**Product grid:**
Similar to product listing page. Product cards with images, titles, current prices (may differ from when added), stock status.

**Empty state:**
"Your wishlist is empty" with "Start Shopping" CTA.

### Product Card Information

Display per item:
- Product image (linked to product page)
- Product title (linked)
- Current price (may show sale price if on sale now)
- Original price if on sale (strikethrough)
- Variant details (size, color if saved)
- Stock status: In stock (green), Out of stock (red, "Notify me" option), Low stock ("Only 2 left")
- **"Add to Cart" button** (CRITICAL - conversion path)
- Remove button (X icon)

### Actions and Conversion

**Add to Cart (CRITICAL):**
"Add to Cart" button on each item. Adds item to cart **without removing from wishlist** (user may want both). Success toast: "Added to cart". Don't navigate away (stay on wishlist page).

**Tradeoff:**
- **Keep in wishlist** (recommended): User tracks desired items, can reorder easily
- **Move to cart**: Removes from wishlist after adding - simpler but limits reordering

**Stock handling:**
If out of stock, disable "Add to Cart" and show "Notify me when back in stock" option (if backend supports).

## Guest vs Logged-In Users

### Decision: Require Login or Use localStorage?

**Require login (Recommended):**

**Why:**
- Wishlist requires persistent storage across devices
- Enables email reminders and price drop notifications
- Better user experience (never lost)
- Cleaner data for analytics and remarketing
- Avoids confusion of lost wishlist items

**Implementation:**
Click wishlist → Show login prompt modal: "Log in to save your wishlist". Include "Sign Up" button. Clear benefit: "Save items across all your devices".

**localStorage approach (Not Recommended):**
- Device-specific only (lost on device switch)
- Lost if user clears browser data
- No remarketing opportunities
- No email reminders
- Creates poor UX expectations

**Exception:**
If backend doesn't support authenticated wishlist, consider not implementing feature at all rather than localStorage-only.

## Navigation Icon

### Placement and Design

**Position:**
Top navigation bar, between search icon and cart icon. Or: In user account dropdown menu.

**Icon:**
Heart icon (outline or filled if items in wishlist). 24-32px size, consistent with cart icon.

**Badge count:**
Small circle with number showing total items in wishlist. Red or brand color, positioned top-right of heart icon.

**Link behavior:**
Navigates to wishlist page on click. Dropdown less common for wishlist (unlike cart popup).

## Mobile Considerations

**Heart button:**
Larger touch target (44px minimum), positioned in corner of product image, clear tap feedback (scale or color change).

**Wishlist page:**
Single column product grid, stack cards vertically, full-width "Add to Cart" buttons, large remove buttons (44px touch target).

**Navigation icon:**
Heart icon in mobile navbar or hamburger menu, with badge count.

**Login prompt:**
If guest clicks wishlist, show bottom sheet (less disruptive than full modal) with "Log in to save your wishlist" message.

## Checklist

**Essential features:**

- [ ] Backend API support verified before implementing
- [ ] Heart icon on product cards (top-right corner)
- [ ] Heart icon on product detail page
- [ ] Clear filled vs outline states
- [ ] Toast notification on add/remove
- [ ] Wishlist icon in navigation with badge count
- [ ] Wishlist page with product grid
- [ ] Product info: image, title, current price, stock status
- [ ] Variant details if saved (size, color)
- [ ] "Add to Cart" button on each wishlist item
- [ ] Add to cart without removing from wishlist
- [ ] Remove button (X icon) on each item
- [ ] Empty wishlist state ("Start Shopping" CTA)
- [ ] Login required for persistent wishlist
- [ ] Guest user login prompt on wishlist click
- [ ] Stock status indicators (in stock, out of stock, low stock)
- [ ] Out of stock: Disable add to cart, show "Notify me"
- [ ] Mobile: 44px touch targets
- [ ] Mobile: Single column layout
- [ ] Optimistic UI (instant feedback)
- [ ] Error handling for failed API requests
- [ ] Loading states during add/remove
- [ ] Button aria-label ("Add to wishlist" / "Remove from wishlist")
- [ ] aria-pressed attribute on heart button
- [ ] Keyboard accessible (Tab, Enter/Space)
- [ ] Screen reader announcements for add/remove
