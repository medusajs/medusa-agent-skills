# Account Pages Layout

## Contents

- [Overview](#overview)
- [Account Dashboard](#account-dashboard)
- [Order Management](#order-management)
- [Saved Addresses](#saved-addresses)
- [Payment Methods](#payment-methods)
- [Profile and Security](#profile-and-security)
- [Email Preferences](#email-preferences)
- [Navigation and Layout](#navigation-and-layout)
- [Mobile Considerations](#mobile-considerations)
- [Checklist](#checklist)

## Overview

Account pages allow customers to manage orders, save addresses, update preferences, and view order history. Well-designed account pages improve repeat purchase rates and reduce support inquiries.

**Backend Integration (CRITICAL):**

All customer data (orders, addresses, profile, payment methods) must be fetched from the ecommerce backend. Change this based on backend integrated. Never hardcode or mock account data. Consult backend documentation for:
- Customer data endpoints (profile, preferences)
- Order history and details endpoints
- Address CRUD operations
- Payment method storage (if supported)
- Authentication requirements

### Key Ecommerce Requirements

- Order history with status tracking (builds trust)
- Saved addresses (checkout optimization - reduces friction)
- Reorder functionality (increases repeat purchases)
- Order tracking integration
- Email preference controls (compliance and user control)
- Secure authentication and session management

### Purpose

**Primary ecommerce functions:**
- Reduce checkout friction (saved addresses, payment methods)
- Increase repeat purchases (order history, reorder button)
- Reduce support load (order tracking, self-service returns)
- Build trust (order transparency, delivery updates)
- Retain customers (easy account management)

## Account Dashboard

Landing page after login. Purpose: Quick access to recent activity and common actions.

**Display (prioritize recent orders):**
- Welcome message with customer name
- Recent orders (3-5 most recent with status)
- Quick actions: Track order, Reorder, Manage addresses
- Account summary (saved addresses count, loyalty points)

**Reorder functionality (CRITICAL for repeat purchases):**
- Check first that feature is available in the admin.
- "Reorder" button on each order card
- Adds same items to cart (check stock availability first)
- Success feedback (cart updated with X items)
- Don't navigate away (stay on dashboard)

**Example dashboard:**
```
Welcome back, Sarah!

Recent Orders
- Order #12345 - Delivered (Jan 28) - $89.99  [Reorder]
- Order #12344 - In Transit (Jan 27) - $124.50  [Track Order]
- Order #12343 - Processing (Jan 26) - $45.00

[View All Orders →]

Quick Actions
[Track Order] [Manage Addresses] [Contact Support]
```

## Order Management

### Order History

Display all past orders with filtering and search.

**Order card essentials:**
- Order number (clickable to details page)
- Order date and status badge (Processing, Shipped, Delivered)
- Total amount
- First 2-3 product thumbnails
- Quick actions: Track, View Details, Reorder, Invoice

**Status indicators (color-coded):**
- Processing: Yellow/Orange
- Shipped: Blue
- Delivered: Green
- Cancelled: Gray/Red

**Filtering and search:**
- Date range (Last 30 days, Last 6 months, All time)
- Status filter (All, Processing, Shipped, Delivered)
- Search by order number or product name

**Sorting:**
- Most recent first (default)
- Oldest first
- Highest/lowest price

**Pagination:**
Show 10-20 orders per page with pagination controls. Alternative: "Load More" button (better mobile UX).

### Order Details View

Full order information page.

**Display:**
- Order number, date, status with progress timeline
- Tracking number with carrier link (if shipped)
- Estimated delivery date

**Status timeline (builds trust):**
```
✓ Order Placed (Jan 27, 9:45 AM)
✓ Processing (Jan 27, 10:30 AM)
✓ Shipped (Jan 28, 2:15 PM)
○ Out for Delivery
○ Delivered
```

**Order information:**
- Items ordered (image, name, variant, quantity, price)
- Pricing breakdown (subtotal, shipping, tax, discounts, total)
- Shipping address and method
- Billing address
- Payment method (last 4 digits)

**Order actions:**
- Track shipment (link to carrier tracking page)
- Download invoice/receipt (PDF)
- Request return (if eligible and backend supports)
- Reorder items
- Contact support about order

### Reorder Functionality (Ecommerce-Specific)

**Purpose**: Increase repeat purchases by making it easy to reorder past purchases.

**Implementation:**
- "Reorder" button on order cards and order details
- Check stock availability before adding to cart
- Handle discontinued products gracefully (skip or notify)
- Add all available items to cart
- Success message: "5 items added to cart" (or "3 of 5 items added - 2 unavailable")
- Stay on current page (don't navigate away)

**Tradeoff**: Auto-add to cart (friction-free) vs redirect to cart page (let user review first). Recommend auto-add with clear success feedback.

## Saved Addresses

**Purpose (CRITICAL)**: Reduce checkout friction and increase conversion. Saved addresses make repeat purchases faster and easier.

### Why Addresses Matter

**Conversion optimization:**
- Saved addresses reduce checkout time by 50%+ (no retyping)
- Default address selection streamlines checkout flow
- Reduces form abandonment (fewer fields to fill)
- Increases repeat purchase rate (easier checkout)

**Backend integration:**
Fetch, create, update, and delete addresses via backend API. Do this based on backend integrated.

### Address Book Display

**Saved addresses list:**
- All saved addresses
- Default address indicator (badge: "Default Shipping" or star icon)
- Address preview: Name, street, city, state, zip
- Quick actions: Edit, Delete, Set as Default

**Default address behavior:**
- One default shipping address
- One default billing address (separate or same)
- Used automatically at checkout (user can change)
- Setting new default updates previous default

### Add/Edit Address Form

Collect standard shipping information. Key considerations:

**Required fields:**
- Full name (or first + last)
- Address line 1
- City, State/Province, ZIP/Postal code
- Country
- Phone number (recommended for delivery coordination)

**Optional enhancements:**
- Address label (Home, Work) for easy identification
- Address autocomplete API (Google Places) for accuracy
- "Set as default" checkbox

**Validation:**
Real-time validation, especially for ZIP/postal code format based on country.

## Payment Methods

**Note**: Payment method storage is optional. Only implement if:
- Backend securely handles tokenized payment data
- PCI DSS compliance requirements are met
- Payment gateway supports tokenization (Stripe, Braintree)

**Security (CRITICAL):**
- Never store full card numbers (tokenize with payment gateway)
- Display last 4 digits only
- Don't store CVV
- Use payment gateway hosted forms (Stripe Elements, etc.)
- Show "Securely stored" badge for trust

**Saved payment display:**
- Card type logo (Visa, Mastercard)
- Last 4 digits
- Expiration date
- Default indicator
- Actions: Edit (update expiration/billing address), Delete, Set as Default

**Tradeoff**: Saved payment methods increase convenience but require PCI compliance. If not implemented, users enter payment at checkout each time (more friction but simpler backend).

## Profile and Security

### Profile Information

Display and edit customer information.

**Standard fields:**
- Full name
- Email (with verification status)
- Phone number
- Optional: Date of birth, gender

**Edit functionality:**
Inline editing or separate form, real-time validation, success confirmation.

**Email verification:**
If unverified, show warning with "Resend verification email" button. If verified, show checkmark badge.

### Security Settings

**Password change:**
- Require current password (optional)
- New password with strength indicator
- Confirm new password
- Password requirements display (8+ chars, uppercase, number)

**Two-factor authentication (optional):**
Enable/disable 2FA, setup instructions, backup codes. Only implement if backend supports.

## Email Preferences

Ecommerce-specific email controls.

**Preference categories:**

1. **Transactional emails** (order updates, shipping) - Recommended always enabled, may be legally required
2. **Marketing emails** (sales, promotions, new products) - User choice
3. **Newsletter** (weekly roundup, content) - User choice

**Display:**
Checkbox list or toggle switches with clear descriptions. Save button at bottom.

**Example:**
```
Email Preferences

[✓] Order and shipping updates
    Receive confirmations and tracking info

[ ] Marketing emails
    Sales, promotions, and new products

[ ] Newsletter
    Weekly roundup and articles

[Save Preferences]
```

**Unsubscribe:**
Individual opt-outs per type, "Unsubscribe from all marketing" button. Keep transactional emails enabled (required for order fulfillment).

## Navigation and Layout

### Layout Pattern Decision

Choose based on account complexity:

**Sidebar Navigation (Recommended):**
- **Use when**: 6+ account sections, complex account features
- Desktop: Vertical sidebar (20-25% width) with section links
- Mobile: Collapse to hamburger menu or dropdown
- Benefits: Persistent navigation, professional, accommodates many sections

**Tab Navigation:**
- **Use when**: 4-6 account sections, simpler account structure
- Horizontal tabs at top, active tab highlighted
- Mobile: Horizontal scroll or dropdown
- Benefits: Modern, clean, quick switching

**Account Hub (Mobile-First):**
- **Use when**: Mobile-heavy traffic, simple account
- Landing page with section cards (2-column grid)
- Tap card to enter section, back button returns to hub
- Benefits: Touch-friendly, intuitive, minimal hierarchy

### Section Organization

**Recommended order (most to least used):**
1. Dashboard (landing page)
2. Orders (most accessed)
3. Addresses (important for checkout)
4. Payment Methods (if implemented)
5. Profile
6. Security
7. Email Preferences
8. Logout

## Mobile Considerations

**Mobile-specific patterns:**

**Navigation:**
Account hub with section cards (2 columns), or bottom navigation with 4-5 key sections (Orders, Addresses, Profile, More).

**Forms:**
One field per row, larger inputs (48px height), appropriate keyboard types (email, phone, numeric), autofill enabled.

**Order history:**
Simplified order cards, full-width buttons, "Load More" pagination (better than numbered pages on mobile).

**Saved addresses:**
Stacked address cards, full-width, 48px touch targets for edit/delete.

## Checklist

**Essential features:**

- [ ] Account dashboard with recent orders (3-5)
- [ ] Reorder button (adds items to cart, stays on page)
- [ ] Order history with status indicators
- [ ] Filter orders by date range and status
- [ ] Search orders by number or product name
- [ ] Order details page with tracking info
- [ ] Status timeline (Order Placed → Processing → Shipped → Delivered)
- [ ] Track shipment button (links to carrier)
- [ ] Download invoice/receipt option
- [ ] Saved addresses list with default indicator
- [ ] Add/edit/delete addresses with validation
- [ ] Set default address option
- [ ] Profile information edit
- [ ] Email verification status display
- [ ] Password change with strength indicator
- [ ] Current password required to change password
- [ ] Email preferences (transactional vs marketing)
- [ ] Account deletion option
- [ ] Logout button clearly visible
- [ ] Clear navigation between sections
- [ ] Mobile-responsive (single column, 48px touch targets)
- [ ] Backend integration (all data fetched from API)
- [ ] Success confirmations after saves
- [ ] Error handling with clear messages
- [ ] Keyboard accessible
- [ ] ARIA labels on navigation sections
- [ ] Order status announcements for screen readers

**Optional features:**

- [ ] Saved payment methods (if PCI compliant backend)
- [ ] Two-factor authentication
- [ ] Wishlist integration
- [ ] Loyalty points/rewards display
- [ ] Returns management section
- [ ] Address autocomplete API
