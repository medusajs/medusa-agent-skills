# Product Reviews Component

## Contents

- [Overview](#overview)
- [Review Display Patterns](#review-display-patterns)
- [Rating Summary and Distribution](#rating-summary-and-distribution)
- [Sorting and Filtering](#sorting-and-filtering)
- [Review Submission](#review-submission)
- [Trust Signals](#trust-signals)
- [SEO Integration](#seo-integration)

## Overview

Product reviews build trust and influence purchase decisions. Reviews with ratings convert 270% better than products without.

**Assumed knowledge**: Claude knows how to build forms and display lists. This guide focuses on ecommerce review patterns and trust signals.

### Key Requirements

- Star rating summary (1-5 stars) with distribution
- Individual reviews with ratings, text, author, date
- Sorting (Most Recent, Most Helpful, Highest/Lowest Rating)
- Filtering by rating (5 stars only, 4+ stars)
- Verified purchase badges
- Helpful votes (upvote system)
- Review submission form
- Mobile-optimized

## Review Display Patterns

### Placement

**On product page:**
- Below product details (after add-to-cart)
- Before related products
- Anchor link in product info: "★★★★★ (127 reviews)"

**Separate reviews page:**
- Only for very large catalogs (500+ reviews)
- Link: "View All Reviews"
- Most stores show reviews inline on product page

## Rating Summary and Distribution

### Average Rating Display

**Show prominently:**
- Average rating: "★★★★★ 4.5 out of 5"
- Total review count: "Based on 127 reviews"
- Large stars (24-32px)

### Rating Distribution (CRITICAL)

**Visual breakdown with clickable bars:**
```
5 ★ [████████████████████] 82 (65%)
4 ★ [██████░░░░░░░░░░░░░░] 25 (20%)
3 ★ [██░░░░░░░░░░░░░░░░░░] 10 (8%)
2 ★ [█░░░░░░░░░░░░░░░░░░░] 5 (4%)
1 ★ [█░░░░░░░░░░░░░░░░░░░] 5 (3%)
```

**Make bars clickable:**
- Click to filter reviews by rating
- Shows only selected star ratings
- "Show all" to reset filter

**Why distribution matters:**
- Perfect 5.0 rating seems fake (customers trust 4.2-4.5 average)
- Showing negative reviews builds trust
- Distribution helps customers understand product quality

### No Reviews State

**When no reviews:**
- "No reviews yet"
- "Be the first to review this product"
- "Write a Review" button prominent
- Don't show 0 stars or empty rating

## Sorting and Filtering

### Sort Options (CRITICAL)

**Essential sorting:**
- **Most Recent** (default) - shows latest feedback
- **Most Helpful** (by upvotes) - surfaces best reviews
- **Highest Rating** (5 stars first) - see positive feedback
- **Lowest Rating** (1 star first) - see concerns

**Dropdown selector:**
```
Sort by: [Most Recent ▾]
```

### Filter Options

**Filter by rating:**
- All ratings (default)
- 5 stars only
- 4+ stars
- 3 stars or less (see negative feedback)

**Filter by criteria:**
- Verified purchases only (highest trust)
- With photos only (visual proof)
- Recent (last 30 days, 6 months)

**Show filtered count:**
- "Showing 24 of 127 reviews"

## Review Submission

### Review Form Fields

**Required:**
- Star rating (1-5 stars selector)
- Review text (textarea, 50-500 characters)
- Reviewer name (if not logged in)

**Optional:**
- Review title/headline
- Upload images (2-5 max)
- Would you recommend? (Yes/No)

**Form placement:**
- "Write a Review" button opens modal or inline form
- Position near rating summary

### Form Validation

**Requirements:**
- Rating must be selected
- Minimum review length (50 characters)
- Show character counter: "50 / 500 characters"
- Validate before submit

**Success:**
- "Thank you for your review!"
- "Your review is pending approval" (if moderation enabled)

## Trust Signals

### Verified Purchase Badge (CRITICAL)

**Display:**
- Badge or checkmark: "✓ Verified Purchase"
- Position near reviewer name
- Green color or checkmark icon
- Only for confirmed customers

**Why it matters:**
- Builds trust (real customer, not fake)
- Reduces suspicion of paid reviews
- Higher credibility

### Helpful Votes

**Upvote/downvote system:**
- "Was this review helpful?"
- [👍 Yes (24)] [👎 No (2)]
- Click to vote (one vote per user)
- Powers "Most Helpful" sorting

**Benefits:**
- Surfaces most useful reviews
- Community validation
- Reduces impact of unhelpful reviews

### Review Images (Optional)

Customer-uploaded photos (3-4 max per review, 60-80px thumbnails, click to enlarge). Visual proof increases trust and engagement.

### Store Responses (Recommended)

Seller replies below original review (indented, light gray background). Respond to negative reviews professionally - shows you care, addresses concerns without being defensive.

## SEO Integration

**AggregateRating Schema (CRITICAL):** Add structured data to show star ratings in search results. Include `ratingValue` (avg rating), `reviewCount`, `bestRating` (5), `worstRating` (1).

**SEO benefits:** Star ratings in search results, higher CTR, rich snippets. See seo.md for implementation details.

**Important:** Only include if reviews are real. Fake reviews violate Google guidelines.

## Display Patterns

**Individual review card:**
Star rating (16-20px) + text + reviewer name (first name + initial) + date + verified badge + helpful votes. Truncate long reviews (200-300 chars) with "Read more".

**Mobile:**
Single column, touch-friendly votes (44px), full-screen sort select, filter bottom sheet, "Load more" pagination.

## Checklist

**Essential features:**

- [ ] Star rating summary (average + count)
- [ ] Rating distribution bar chart (5 to 1 stars)
- [ ] Clickable bars to filter by rating
- [ ] Sort dropdown (Most Recent, Most Helpful, Highest/Lowest)
- [ ] Filter options (verified, with photos, by rating)
- [ ] Individual reviews with: stars, text, name, date
- [ ] Verified purchase badge
- [ ] Helpful votes (upvote/downvote)
- [ ] Review submission form (rating, text)
- [ ] Form validation (minimum length, required rating)
- [ ] "Read more" for long reviews
- [ ] Store responses to reviews (recommended)
- [ ] Review images (customer uploads, optional)
- [ ] Mobile: Touch targets 44px minimum
- [ ] Pagination or "Load more" button
- [ ] No reviews state ("Be the first to review")
- [ ] AggregateRating structured data (SEO)
- [ ] ARIA labels for star ratings
- [ ] Keyboard accessible (all interactions)
