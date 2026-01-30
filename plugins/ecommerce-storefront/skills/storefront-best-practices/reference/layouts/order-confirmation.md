# Order Confirmation Page

## Contents

- [Overview](#overview)
- [Essential Information](#essential-information)
- [Order Details Display](#order-details-display)
- [Next Steps Section](#next-steps-section)
- [Layout Patterns](#layout-patterns)
- [Call-to-Action Buttons](#call-to-action-buttons)
- [Mobile Considerations](#mobile-considerations)
- [Checklist](#checklist)

## Overview

The order confirmation page displays immediately after successful checkout. Purpose: Confirm purchase, provide order details, guide customers on next steps, build post-purchase confidence.

**Backend Integration:**

Fetch order details from backend API immediately after checkout completes. Do this based on backend integrated. Never hardcode or mock order data.

### Key Ecommerce Functions

- Confirm successful purchase (reduces anxiety)
- Provide order reference number (for tracking and support)
- Set delivery expectations (reduces "where's my order" inquiries)
- Guide customer on next steps (reduces support load)
- Encourage repeat purchases (continue shopping CTA)
- Build post-purchase confidence (reduces buyer's remorse)

## Essential Information

### Success Message (CRITICAL)

**Confirmation headline:**
Large, prominent heading, positive reassuring message, success icon (green checkmark), immediately visible above fold.

**Example messages:**
- "Order Confirmed!"
- "Thank you for your order!"
- "Success! Your order is confirmed"

**Subheading:**
Brief reassurance, email confirmation mention, delivery timeframe preview.

**Example:**
```
✓ Order Confirmed!

Thank you for your purchase! We've sent a confirmation
email to customer@example.com with your order details.
```

### Order Number

**Display requirements:**
- Very prominent
- Clearly labeled "Order Number:" or "Order #"
- Easy to select and copy (selectable text)
- Monospace or sans-serif font
- High contrast for visibility
- Optional: Copy button next to number

**Example:**
```
Order Number: #ORD-123456789
```

### Email Confirmation Notice

Confirmation email was sent, email address used, check spam folder reminder (optional), resend email option (optional).

## Order Details Display

### Ordered Items List

Display per item:
- Product image (thumbnail, 60-80px)
- Product title (full name)
- Variant information (size, color, etc.)
- Quantity ("× 2")
- Unit price
- Line total (quantity × price)

### Order Summary (Pricing)

**Price breakdown:**
- Subtotal (sum of items)
- Shipping cost (with method name)
- Tax (if applicable)
- Discount/promo code (if used, show savings)
- **Order Total** (bold, larger font)

**Medusa pricing note:**
Medusa stores prices as-is (not in cents). Display prices directly without dividing by 100. Example: If backend returns 49.99, display $49.99.

**Example:**
```
Subtotal:              $139.97
Shipping (Express):      $5.99
Tax:                    $11.20
Discount (SAVE10):     -$14.00
─────────────────────────────
Order Total:           $143.16
```

### Shipping and Billing Information

**Shipping address:**
Recipient name, complete address, phone number, shipping method selected, estimated delivery date.

**Billing address:**
If same as shipping: "Same as shipping address". If different: Show full billing address.

**Payment information:**
Payment method type, last 4 digits (if card), alternative methods (PayPal email, Apple Pay). **Never show full card number.**

## Next Steps Section

### What Happens Next (CRITICAL)

**Timeline guidance:**
Order processing information, shipment timeline, when tracking becomes available, expected delivery date.

**Example:**
```
What's Next?

1. Order Processing (1-2 business days)
   We're carefully preparing your items for shipment.

2. Shipment Notification
   You'll receive an email with tracking information
   when your order ships.

3. Delivery (By January 30)
   Your package will arrive at your address.
```

**Benefits:**
Sets clear expectations, reduces "where's my order" inquiries, builds confidence in process.

## Layout Patterns

### Single Column Layout (Recommended)

Full-width content, centered on page, all sections stacked vertically. Mobile-friendly by default.

**Section order:**
1. Success message and order number
2. Email confirmation notice
3. Order items list
4. Order summary (pricing)
5. Shipping address
6. Billing address
7. Payment method
8. Next steps/timeline
9. CTAs (continue shopping, print, track)

### Two-Column Layout (Desktop Alternative)

- Left column (60-70%): Main content (success, order number, items, addresses, next steps)
- Right column (30-40%): Sidebar (order summary, CTAs, tracking)
- Mobile: Collapses to single column

## Call-to-Action Buttons

### Primary Actions

**Continue Shopping (MOST IMPORTANT):**
Large, prominent button (primary color), returns to homepage or shop page. Text: "Continue Shopping" or "Back to Store". Encourages repeat visits.

### Secondary Actions

**Create Account (for guest orders):**
Encourage account creation, pre-fill email from order, benefits messaging ("Track orders easily"). Optional, not required.

**Print Receipt:**
Print-friendly CSS, button to print page.

**Contact Support:**
Link to support page or contact form, phone number (if available), help with order questions.

**Button layout:**
Primary action prominent (filled button), secondary actions less prominent (outline or link), adequate spacing (16-24px), mobile full-width.

## Mobile Considerations

**Single column only:**
Full-width sections, generous padding (16-20px), larger text for important info, touch-friendly buttons.

**Order number:**
Extra large (28-36px), highly visible, easy to read and reference, tap to copy (if implemented).

**Buttons:**
Full-width or near full-width (min 90%), 48-56px height (touch-friendly), 16px spacing between buttons.

**Quick actions:**
- Tap phone number to call support
- Tap to copy order number
- Add delivery date to calendar
- Share order details

## Checklist

**Essential elements:**

- [ ] Large success message (32-48px heading)
- [ ] Green checkmark or success icon
- [ ] Prominent order number (24-32px, selectable)
- [ ] Email confirmation notice
- [ ] Order items list with images
- [ ] Item details (title, variant, quantity, price)
- [ ] Order summary (subtotal, shipping, tax, total)
- [ ] Shipping address displayed
- [ ] Billing address (or "same as shipping")
- [ ] Payment method (last 4 digits only)
- [ ] Estimated delivery date
- [ ] Shipping method name
- [ ] "What's Next" section (timeline)
- [ ] Continue Shopping button (primary CTA)
- [ ] Print receipt button
- [ ] Contact support link
- [ ] Guest orders: Create account CTA (optional)
- [ ] Backend integration (fetch order from API)
- [ ] Mobile-responsive (single column, full-width buttons)
- [ ] Semantic HTML (main, section, h1, h2)
- [ ] ARIA labels on sections
- [ ] Live region announcing success
- [ ] Keyboard navigation supported
- [ ] High contrast text (4.5:1 minimum)
