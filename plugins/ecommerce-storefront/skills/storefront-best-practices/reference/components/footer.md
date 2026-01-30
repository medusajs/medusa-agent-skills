# Footer Component

## Contents

- [Overview](#overview)
- [Essential Footer Elements](#essential-footer-elements)
- [Dynamic Category Links (Ecommerce-Specific)](#dynamic-category-links-ecommerce-specific)
- [Newsletter Signup](#newsletter-signup)
- [Payment and Trust Badges](#payment-and-trust-badges)
- [Mobile Footer](#mobile-footer)

## Overview

Footer provides supplementary navigation, company info, and trust signals. Appears on every page.

**Assumed knowledge**: AI agents know how to build multi-column layouts and navigation lists. This guide focuses on ecommerce footer patterns.

### Key Requirements

- Navigation links (categories, pages)
- Dynamic category fetching from backend
- Legal links (Privacy, Terms)
- Newsletter signup
- Payment method badges
- Social media links
- Responsive (multi-column desktop, single-column mobile)

## Essential Footer Elements

### Must-Have Content

**Required:**
- Navigation links (categories from backend)
- Contact information (email, phone)
- Legal links (Privacy Policy, Terms of Service)
- Copyright notice with current year

**Strongly recommended:**
- Newsletter signup form
- Payment method badges
- Social media links
- Trust signals

### Multi-Column Layout (Desktop)

**Standard pattern: 4-5 columns**
- Column 1: Shop/Categories (dynamic from backend)
- Column 2: Customer Service (Contact, FAQ, Shipping)
- Column 3: Company (About, Careers)
- Column 4: Newsletter signup
- Bottom: Legal links, payment badges, copyright

## Dynamic Category Links (Ecommerce-Specific)

**CRITICAL: Fetch categories from backend dynamically** - never hardcode. Fetch from ecommerce backend API (for Medusa: `sdk.store.category.list()`).

**Benefits:**
- Stays in sync with main navigation
- Categories added/removed automatically
- No manual footer updates

**Guidelines:**
- Show top-level categories only (5-8 max)
- Match labels from main navigation
- Cache category data (rarely changes)

## Newsletter Signup

**Essential elements:**
- Email input + submit button ("Subscribe")
- **Value proposition (CRITICAL)**: State clear benefit ("Get 10% off your first order", "Exclusive deals + early access"). Don't just say "Subscribe to newsletter".
- Privacy note: "We respect your privacy" + link to privacy policy

**Layout:** Input + button inline (desktop), stacked (mobile). Full width on mobile.

## Payment and Trust Badges

**Payment method icons:**
Display accepted payments (Visa, Mastercard, PayPal, Apple Pay, Google Pay). 40-50px icons, horizontal row, bottom of footer.

**Trust badges (optional):**
Max 3-4 legitimate certifications (SSL, BBB, money-back guarantee). Only use real badges with verification links.

## Mobile Footer

**Single column, stacked:** Logo → Navigation → Newsletter → Social → Legal/copyright.

**Collapsible sections (optional):** Accordion pattern for navigation to reduce height. Keep newsletter/social always visible.

**Touch-friendly:** 44px minimum links, 8-12px spacing, 14-16px text, 48px newsletter input height.

## Checklist

**Essential features:**

- [ ] Navigation links (categories, pages)
- [ ] Categories fetched dynamically from backend
- [ ] Contact information (email, phone)
- [ ] Legal links (Privacy Policy, Terms of Service)
- [ ] Copyright notice with current year
- [ ] Newsletter signup form with value proposition
- [ ] Payment method icons
- [ ] Social media links
- [ ] Responsive (4-5 columns desktop, single-column mobile)
- [ ] Mobile: 44px touch targets
- [ ] Mobile: Collapsible sections (optional)
- [ ] Semantic HTML (`<footer>`, `<nav>` sections)
- [ ] ARIA labels on navigation ("Footer navigation")
- [ ] Keyboard accessible
- [ ] Visible focus indicators
- [ ] Color contrast 4.5:1 minimum
- [ ] Consistent across all pages
