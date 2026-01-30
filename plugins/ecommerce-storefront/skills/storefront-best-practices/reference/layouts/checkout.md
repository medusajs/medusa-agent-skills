# Checkout Page Layout

## Contents

- [Overview](#overview)
- [Decision: Single-Page vs Multi-Step](#decision-single-page-vs-multi-step)
- [Guest vs Logged-In Checkout](#guest-vs-logged-in-checkout)
- [Component Architecture](#component-architecture-recommended)
- [Checkout Flow](#checkout-flow)
- [Key Ecommerce Considerations](#key-ecommerce-considerations)
- [Backend Integration](#backend-integration)
- [Mobile Checkout](#mobile-checkout)
- [Trust and Conversion Optimization](#trust-and-conversion-optimization)
- [Error Handling](#error-handling)
- [Checklist](#checklist)

## Overview

Final step in conversion funnel where customers provide shipping and payment information. Must be optimized for completion with minimal friction.

**⚠️ CRITICAL: Always fetch shipping methods AND payment methods from backend. Users must be able to select from available options - never skip payment method selection.**

### Key Requirements

- Clear steps and progress indication
- Guest checkout option (if backend supports it)
- Shipping address and method selection
- **Shipping methods fetched from backend (vary by address/region)**
- **Payment methods fetched from backend (user must select preferred method)**
- Payment processing
- Order review before submission
- Trust signals throughout
- Mobile-optimized (60%+ traffic is mobile)
- Fast loading and submission

## Decision: Single-Page vs Multi-Step

**Use Single-Page Checkout when:**
- Simple products with few shipping options
- Mobile-heavy traffic (>60% mobile users)
- Fewer form fields required (<15 total)
- Startup or new store (minimize friction)
- Fast checkout is prioritized
- Low average order value (<$50)

**Benefits:**
- Fewer clicks (no step navigation)
- User sees full scope upfront
- Faster on mobile (no page loads)
- Lower perceived friction

**Use Multi-Step Checkout when:**
- Complex shipping (international, multiple carriers)
- B2B customers (need detailed information)
- Many form fields required (>15 total)
- High-value products (>$100, thoroughness expected)
- Established brand (customers trust process)
- Need clear progress indication

**Benefits:**
- Less overwhelming (one step at a time)
- Progress indicator reduces anxiety
- Easier step-by-step validation
- Better for complex forms

**Recommended: Hybrid Approach**
- Single-page scroll layout on desktop
- Accordion-based sections on mobile (expand/collapse)
- Progressive disclosure of sections
- Best of both worlds

**Common steps:**
1. Shipping Information (address)
2. Delivery (shipping method selection)
3. Payment (payment method and details)
4. Review (final review before submission)

## Guest vs Logged-In Checkout

**IMPORTANT:** Guest checkout availability depends on backend support.

**Guest checkout (recommended if backend supports it):**
- Reduces friction (no signup barrier)
- "Checkout as Guest" option prominent
- Email required for order confirmation
- Optional "Create account?" checkbox after order
- Don't force account creation

**Logged-in checkout:**
- Pre-fill saved addresses and payment methods
- "Returning customer? Log in" link at top
- Allow seamless switch between guest/login

## Component Architecture (RECOMMENDED)

**Build separate components for each checkout step for better maintainability and reusability.**

✅ **Create individual step components:**
- `ShippingInformationStep` - Contact and shipping address form
- `DeliveryMethodStep` - Shipping method selection
- `PaymentInformationStep` - Payment method and details
- `OrderReviewStep` - Final review before submission

**Benefits of component separation:**
- **Maintainability**: Fix bugs or update one step without affecting others
- **Reusability**: Reuse shipping address component in account settings, checkout, etc.
- **Testability**: Test each step independently
- **Code organization**: Clearer separation of concerns (validation, submission logic per step)
- **Easier debugging**: Isolate issues to specific steps
- **Flexibility**: Easy to reorder steps or add/remove steps based on requirements
- **Performance**: Lazy load steps or split bundles for faster initial load

**What to separate:**
- Main checkout page/container component
- Individual step components (ShippingInformationStep, DeliveryMethodStep, etc.)
- Reusable order summary component (shown on all steps)

**Component communication:**
Each step component should accept:
- Current step data (form values)
- Callback to update data (e.g., `onShippingUpdate`)
- Callback to proceed to next step (e.g., `onContinue`)
- Loading/error states
- Validation errors

**Shared components:**
- Address form (used in shipping and billing)
- Payment method selector
- Order summary (sidebar, shown on all steps)

**Works for both single-page and multi-step:**
- Single-page: Render all steps at once, scroll-based navigation
- Multi-step: Show one component at a time, controlled by step state
- Accordion: Expand/collapse components as sections

**Common mistake:**
- ❌ Building entire checkout as one massive component with all form fields, logic, and validation mixed together
- ✅ Separate components for each step, shared state management in parent

## Checkout Flow

### Complete Checkout Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                          CHECKOUT PROCESS                            │
└─────────────────────────────────────────────────────────────────────┘

    ┌──────────────────────────────────────────────────────┐
    │  Optional: Guest Checkout vs Login                   │
    │  • Guest: Enter email only                           │
    │  • Logged-in: Pre-fill saved data                    │
    └────────────────────┬─────────────────────────────────┘
                         │
                         ▼
    ┌──────────────────────────────────────────────────────┐
    │  STEP 1: Shipping Information                        │
    │  ├─ Contact: Email, Phone                            │
    │  ├─ Shipping Address: Name, Address, City, etc.      │
    │  └─ Billing Address: □ Same as shipping / Different  │
    └────────────────────┬─────────────────────────────────┘
                         │
                         ▼
    ┌──────────────────────────────────────────────────────┐
    │  STEP 2: Delivery                                    │
    │  • Fetch shipping methods from backend               │
    │  • Display: Standard, Express, Overnight             │
    │  • Show: Cost + Delivery estimate                    │
    │  • Update order total                                │
    └────────────────────┬─────────────────────────────────┘
                         │
                         ▼
    ┌──────────────────────────────────────────────────────┐
    │  STEP 3: Payment Information                         │
    │  • Fetch payment methods from backend                │
    │  • Options: Card, PayPal, Apple Pay, etc.            │
    │  • Enter: Card details (tokenized)                   │
    │  • Use billing address from Step 1                   │
    └────────────────────┬─────────────────────────────────┘
                         │
                         ▼
    ┌──────────────────────────────────────────────────────┐
    │  STEP 4: Order Review                                │
    │  • Review: Items, addresses, shipping, payment       │
    │  • Optional: □ Agree to Terms and Conditions         │
    │  • Click: [Place Order] Button                       │
    │  → Payment processing triggered                      │
    └────────────────────┬─────────────────────────────────┘
                         │
                         ▼
    ┌──────────────────────────────────────────────────────┐
    │  Loading: Processing payment...                      │
    │  • Authorize/capture payment via gateway             │
    │  • Create order in backend                           │
    │  • Send confirmation email                           │
    └────────────────────┬─────────────────────────────────┘
                         │
                    ┌────┴────┐
                    │         │
              Success       Failure
                    │         │
                    ▼         ▼
    ┌───────────────────┐   ┌──────────────────────┐
    │ Order Confirmation│   │ Show Error Message   │
    │ • Order number    │   │ • Retry payment      │
    │ • Details         │   │ • Keep form data     │
    │ • Tracking link   │   │ • Suggest solutions  │
    └───────────────────┘   └──────────────────────┘
```

## Key Ecommerce Considerations

### Shipping Address Collection

Collect:
- Required: email, name, address, city, state/zip, country
- Optional: phone.

**Key ecommerce considerations:**
- Email placement: First if guest checkout (identifies customer)
- Country placement: Early if shipping methods vary by country (affects available shipping)
- Phone: Optional to reduce friction, but recommended for delivery coordination
- Billing address: "Same as shipping" checkbox (default checked)

**For Medusa backends:**
- Country dropdown: Show only countries from cart's region (don't show all countries globally)
- Get countries from: `cart.region.countries` or `sdk.store.region.retrieve(cart.region_id)`
- Medusa regions contain specific countries - limiting options ensures correct pricing and shipping
- If user needs different country, they must change region first (typically via country selector component)

### Shipping Method Selection

**Fetch from backend after address provided** (shipping methods vary by address/region):
- Display as radio buttons with cost + delivery estimate
- Update order total immediately when method changes
- Highlight free shipping if available
- Show "Add $X for free shipping" if close to threshold
- Handle unavailable shipping: show message, suggest alternatives

### Payment Method Selection

**CRITICAL: Always fetch payment methods from backend and allow user to select from available options.**

Payment methods vary by store configuration (backend settings). NEVER assume which payment methods are available or hardcode payment options. Users MUST be able to choose their preferred payment method.

**Fetch available methods from backend:**
```typescript
// ALWAYS fetch payment providers from backend
// For Medusa:
const { payment_providers } = await sdk.store.payment.listPaymentProviders()

// For other backends:
// Change based on the integrated backend
const paymentMethods = await fetch(`${apiUrl}/payment-methods`)
// Returns: card, paypal, apple_pay, google_pay, stripe, etc.
```

**Display payment method selection UI:**
- Show all enabled payment providers returned by backend
- Allow user to select their preferred method (radio buttons or cards)
- Don't skip selection step - user must actively choose
- Map backend codes to display names in the storefront. For example `pp_system_manual` -> `Manual payment`.
- Common options: Credit/Debit Card, PayPal, Apple Pay, Google Pay, Buy Now Pay Later

**Available payment methods (examples, actual options come from backend):**
- Credit/Debit Card (most common, via Stripe/Braintree/other gateway)
- PayPal (redirect or in-context)
- Apple Pay (Safari, iOS only)
- Google Pay (Chrome, Android)
- Buy Now Pay Later (Affirm, Klarna - if enabled by store)
- Manual payment (bank transfer, cash on delivery - if enabled)

**Why backend fetching is required:**
- Store admin controls which payment providers are enabled
- Payment methods vary by region, currency, order value
- Test vs production mode affects available methods
- Can't assume all stores use the same payment gateway

**For Medusa backends - Payment flow:**

1. **List available payment providers:**
```typescript
const { payment_providers } = await sdk.store.payment.listPaymentProviders({
  region_id: cart.region_id // Required to get region-specific providers
})
```

2. **Display providers and allow user to select:**
Show payment providers as radio buttons or cards. User must actively select one.

3. **Initialize payment session after selection:**
```typescript
// When user selects a provider
await sdk.store.payment.initiatePaymentSession(cart, {
  provider_id: selectedProvider.id // e.g., "pp_stripe_stripe", "pp_system_default"
})

// Re-fetch cart to get updated payment session data
const { cart: updatedCart } = await sdk.store.cart.retrieve(cart.id)
```

4. **Render provider-specific UI:**
- Stripe providers (`pp_stripe_*`): Render Stripe Elements card UI
- Manual payment (`pp_system_default`): No additional UI needed
- Other providers: Implement according to provider requirements

**Important:** Payment provider IDs are returned from the backend (e.g., `pp_stripe_stripe`, `pp_system_manual`). Map these to user-friendly display names in your UI.

**Digital wallets (mobile priority):**
- Apple Pay / Google Pay should be prominent on mobile
- One-click payment (pre-filled shipping)
- Significantly faster checkout
- Higher conversion on mobile

**Card payment:**
- Use payment gateway (Stripe Elements, Braintree)
- Never handle raw card data (PCI compliance)
- Tokenize card data before submission
- Auto-detect card type (show logo)

### Order Review

**Display for final confirmation:**
Cart items, addresses, shipping method/cost, payment method, order total breakdown.

**Key elements:**
- "Edit" link next to each section (returns to step or edits inline)
- Terms checkbox (if required): "I agree to Terms and Conditions"
- Place Order button: Large (48-56px), shows total, loading state on submit

### Order Summary Sidebar

**Desktop:** Sticky sidebar with items, prices, totals. Updates in real-time.
**Mobile:** Collapsible at top ("Show order summary" toggle). Keeps focus on form.

## Backend Integration

**Address validation (optional):**
- Use address lookup APIs (Google, SmartyStreets) for higher accuracy
- Tradeoff: accuracy vs friction. Consider for high-value orders.

**Payment processing flow:**
1. Frontend tokenizes payment (Stripe Elements, Braintree)
2. Send token + order details to backend
3. Backend authorizes/captures payment & creates order
4. Redirect to confirmation page

**Never:** Send raw card data, store cards without PCI compliance, process payments client-side.

**On payment failure:** Show specific error, keep form data, allow retry without re-entering.

## Mobile Checkout

**Key optimizations:**
- Digital wallets prominent (Apple Pay/Google Pay) - significantly faster checkout
- Single-column layout, 44-48px touch targets
- Appropriate keyboard types, autocomplete attributes enabled
- Collapsible order summary at top (shows total, expands on tap)
- Sticky Place Order button at bottom (always accessible, shows total)
- Accordion sections (one step at a time, reduces cognitive load)

**For detailed mobile patterns and safe area insets**, see `reference/mobile-responsiveness.md`.

## Trust and Conversion Optimization

**Trust signals (critical for conversion):**
- "Secure Checkout" badge, payment provider logos (Visa, Mastercard)
- Return policy link visible, customer support contact
- Near Place Order: "100% secure checkout", guarantees/free returns if offered
- For new brands: Customer review count, social proof

**Reduce abandonment:**
- Progress indicator (shows steps remaining)
- Auto-save form data, clear pricing (no surprise fees)
- Minimal required fields, smart defaults, autocomplete enabled

**Reduce perceived friction:**
- "No account required" (guest checkout)
- "Free shipping" highlighted
- Time estimate: "Less than 2 minutes"

## Error Handling

**Form validation:**
- Validate on blur, show error below field
- User-friendly messages ("Please enter a valid email address")
- Scroll to first error on submit

**Payment errors:**
- Card declined: "Your card was declined. Please try another payment method."
- Keep form data, suggest alternatives (try another card, PayPal)
- Network timeout: Show retry option without re-entering data

**Stock availability errors:**
- Out of stock: Remove item, recalculate, allow continue with remaining items
- Quantity reduced: Update automatically, show message, allow continue

## Checklist

**Essential checkout features:**

- [ ] **RECOMMENDED: Separate components created for each checkout step**
- [ ] Components: ShippingInformationStep, DeliveryMethodStep, PaymentInformationStep, OrderReviewStep
- [ ] Decision made: Single-page or multi-step (based on complexity)
- [ ] Guest checkout option (if backend supports it)
- [ ] Email field first (if guest checkout)
- [ ] Shipping address form with autocomplete attributes
- [ ] "Billing same as shipping" checkbox (default checked)
- [ ] Shipping methods fetched from backend dynamically
- [ ] Shipping cost updates order total in real-time
- [ ] **CRITICAL: Payment methods fetched from backend (NEVER assume or hardcode)**
- [ ] **CRITICAL: Payment method selection UI shown to user (user must select from available options)**
- [ ] Payment methods: show only enabled providers returned by backend
- [ ] For Medusa: Payment session initialized after user selects provider (sdk.store.payment.initiatePaymentSession)
- [ ] For Medusa: Country dropdown limited to cart's region countries
- [ ] Digital wallets prominent on mobile (Apple Pay, Google Pay)
- [ ] Payment tokenization (never send raw card data)
- [ ] Order review section before submission
- [ ] Order summary sidebar (sticky on desktop, collapsible on mobile)
- [ ] Promo code input (if not applied in cart)
- [ ] Trust signals throughout (secure checkout, return policy)
- [ ] Terms and conditions checkbox (if required)
- [ ] Place Order button prominent (48-56px, shows total)
- [ ] Loading state during payment processing
- [ ] Progress indicator (if multi-step)
- [ ] Clear error messages for validation failures
- [ ] Error handling for payment failures (keep form data)
- [ ] Stock availability check before order creation
- [ ] Mobile optimized (44-48px touch targets, single column)
- [ ] Autocomplete enabled on all form fields
- [ ] Keyboard accessible (tab through fields, enter to submit)
- [ ] ARIA labels on form fields (aria-required, aria-invalid)
- [ ] Redirect to order confirmation on success
