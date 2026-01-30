# Popups Component

## Contents

- [Overview](#overview)
- [When to Use Popups](#when-to-use-popups)
- [Ecommerce Popup Types](#ecommerce-popup-types)
- [Timing and Triggers](#timing-and-triggers)
- [Frequency Management](#frequency-management)
- [Mobile Considerations](#mobile-considerations)
- [Checklist](#checklist)

## Overview

Popups (modals/overlays) appear over main content to capture attention for specific actions: newsletter signups, promotional offers, exit-intent offers.

**Assumed knowledge**: AI agents know how to build modals with close buttons and backdrop overlays. This focuses on ecommerce popup patterns.

**Critical balance**: Effective for conversions when used sparingly, intrusive and annoying when overused. Timing and frequency are critical for ecommerce.

## When to Use Popups

**Use popups when:**

- Offering significant value (10-20% first-purchase discount, free shipping)
- Time-sensitive promotions (flash sale ending soon)
- Exit-intent to recover abandoning visitors (last chance offer)
- First-time visitor welcome (one-time only)
- Important announcements (shipping delays, policy changes)

**Don't use popups for:**

- Every page visit (extremely annoying)
- Multiple popups per session
- Immediate page load (users haven't seen site yet)
- Mobile users (especially full-screen takeovers - very disruptive)
- Users who already signed up or dismissed

**Consider alternatives:**

- Top banner: Less intrusive, always visible, good for ongoing promotions
- Inline forms: Homepage or footer newsletter signup, non-blocking
- Slide-in (corner): From bottom-right, less disruptive than center popup
- Post-purchase: Ask for email after successful order (high conversion)

**Popups are best when:** Need immediate attention, high-value offer justifies interruption, exit-intent (last chance).

## Ecommerce Popup Types

### 1. First-Purchase Discount

**Purpose**: Convert first-time visitors with discount incentive.

**Content:**
- Headline: "Welcome! Get 10% Off Your First Order"
- Email input
- Discount code or automatic application
- Subscribe button: "Get My Discount"

**Timing**: After 30-60 seconds on site OR after viewing 2-3 products (engagement signal).

**Frequency**: Once per user (cookie/localStorage). Don't show to returning customers.

### 2. Newsletter Signup

**Purpose**: Grow email list for marketing.

**Content:**
- Value proposition: "Get exclusive deals and early access"
- Email input
- Subscribe button
- Optional: First-purchase discount incentive (10-15% off)

**Timing**: After 50% scroll OR 60 seconds on site.

**Frequency**: Once per session. If dismissed, don't show for 30 days.

### 3. Exit-Intent Popup

**Purpose**: Recover abandoning visitors with last-chance offer.

**Trigger**: Mouse moves toward browser close/back button (desktop only).

**Content:**
- Urgency: "Wait! Don't Miss Out"
- Offer: "Take 10% Off Your Order" or "Free Shipping Today Only"
- Email capture (optional): "Send me the code"
- CTA: "Claim Offer" or "Continue Shopping"

**Best for**: Cart abandoners, product page exits, first-time visitors.

**Frequency**: Once per session. Don't show if user already added to cart or on checkout.

### 4. Cart Abandonment Reminder

**Purpose**: Remind user of items in cart before leaving.

**Trigger**: Exit-intent when cart has items but user navigating away.

**Content:**
- "Your Cart is Waiting"
- Show cart summary (items, total)
- CTA: "Complete Your Order" or "View Cart"
- Optional incentive: "Complete in 10 minutes for free shipping"

**Frequency**: Once per session with items in cart.

### 5. Promotional Announcement

**Purpose**: Announce sales, new arrivals, or site-wide events.

**Content:**
- Headline: "Flash Sale: 40% Off Everything"
- Subtext: "Ends in 3 hours"
- CTA: "Shop Now"

**Timing**: Immediate on page load (if major event), OR after 30 seconds.

**Frequency**: Once per day during promotion period.

## Timing and Triggers

**Time-based:**
- 30-60 seconds after page load (enough time to browse)
- Never immediate (0 seconds) - users need to see site first

**Engagement-based:**
- After 50% scroll (shows interest)
- After viewing 2-3 products (qualified visitor)
- After adding to cart (exit-intent only)

**Exit-intent:**
- Mouse moves toward close/back button (desktop)
- Scroll-up toward address bar (mobile - less reliable)
- Only trigger once per session
- Don't trigger on checkout pages (interrupts purchase)

**Page-specific:**
- Homepage: Welcome/discount popup
- Product pages: Exit-intent with product-specific offer
- Cart page: Don't use popups (already engaged)
- Checkout: Never use popups (critical flow)

## Frequency Management

**Critical for UX**: Don't show same popup repeatedly to same user.

**Implementation:**

1. **Cookie/localStorage tracking**: Store dismissal/signup with timestamp
2. **Respect dismissals**: If user closes popup, don't show for 30 days
3. **Signed-up users**: Never show newsletter popup again
4. **Session limits**: Max 1 popup per session
5. **Time cooldown**: If dismissed, wait 30 days before showing again

**Example tracking:**
```javascript
// On popup dismiss
localStorage.setItem('popup_dismissed', Date.now())
localStorage.setItem('popup_type', 'welcome_discount')

// Before showing popup
const dismissedTime = localStorage.getItem('popup_dismissed')
const daysSince = (Date.now() - dismissedTime) / (1000 * 60 * 60 * 24)
if (daysSince < 30) {
  // Don't show popup
}
```

**Progressive disclosure:**
- Session 1: Welcome discount popup
- Session 2+: Exit-intent only (if applicable)
- Never stack multiple popups

## Mobile Considerations

**Mobile popups are MORE intrusive:**
- Smaller screen = popup takes more space
- Harder to close (small X button)
- Disrupts mobile browsing flow
- Can hurt mobile SEO (Google penalty for intrusive interstitials)

**Mobile best practices:**

1. **Use sparingly**: Consider top banner or inline forms instead
2. **Make easily dismissable**: Large close button (44x44px), tap outside to close
3. **Delay longer**: 60+ seconds instead of 30 seconds
4. **Smaller size**: 90% width max, not full-screen
5. **Exit-intent**: Less reliable on mobile, avoid
6. **Google penalty**: Avoid full-screen popups on mobile (hurts rankings)

**Mobile alternative**: Sticky bottom bar (less intrusive)
- "Get 10% Off - Sign Up" with email input
- Always visible but doesn't block content
- Better mobile UX than popup

## Checklist

**Essential features:**

- [ ] Clear value proposition (discount, benefit)
- [ ] Single focused CTA
- [ ] Easy to close (X button, backdrop click, Escape key)
- [ ] Delayed timing (30-60s, not immediate)
- [ ] Frequency management (localStorage/cookie tracking)
- [ ] Respect dismissals (30-day cooldown)
- [ ] Never show to signed-up users
- [ ] Max 1 popup per session
- [ ] Exit-intent for cart abandoners (desktop only)
- [ ] Don't show on checkout pages
- [ ] Mobile: Use sparingly, consider alternatives
- [ ] Mobile: Large close button (44x44px)
- [ ] Mobile: Not full-screen (90% width max)
- [ ] Email validation before submit
- [ ] Loading state on submit
- [ ] Success message or redirect
- [ ] Keyboard accessible (Tab, Escape, Enter)
- [ ] `role="dialog"` and `aria-modal="true"`
- [ ] Focus trap (keep focus within popup)
- [ ] ARIA label on close button
- [ ] Screen reader announcements on open
