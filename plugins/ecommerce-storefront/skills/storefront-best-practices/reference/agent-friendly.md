# Agent-Friendly Storefronts

## Contents

- [Overview](#overview)
- [Priorities](#priorities)
- [1. Access: Let Agents In](#1-access-let-agents-in)
- [2. Product Data: Make Facts Machine-Readable](#2-product-data-make-facts-machine-readable)
- [3. Operability: Make Actions Usable Without a Human](#3-operability-make-actions-usable-without-a-human)
- [4. Discovery: Help Agents Find Pages](#4-discovery-help-agents-find-pages)
- [5. Agentic Commerce Protocols (Ask First)](#5-agentic-commerce-protocols-ask-first)
- [Medusa Storefront Notes](#medusa-storefront-notes)
- [Verification Checklist](#verification-checklist)
- [Common Mistakes](#common-mistakes)

## Overview

AI agents now browse, compare and buy on behalf of shoppers: AI search (ChatGPT search, Claude, Perplexity), user-initiated fetchers (ChatGPT-User, Claude-User), and browser agents (ChatGPT agent, Claude in Chrome, Gemini). They work very differently from humans:

- **Most fetchers do not run JavaScript.** They read the raw server HTML. If it's not in `curl` output, they don't see it.
- **They read structured data** (JSON-LD, OpenGraph) to get price, currency, availability, variants, returns and shipping.
- **Browser agents read the accessibility tree.** A clickable `<div>` or an unnamed icon button is invisible or ambiguous to them.
- **Some speak commerce protocols** (UCP, MCP) and skip the HTML entirely.
- **They stop at CAPTCHAs, age gates and bot walls.** They are instructed not to solve CAPTCHAs.

**Golden rule:** after implementing any page, run `curl <url>` (no JS) and confirm the product name, visible price with currency, stock status, add-to-cart form and links are in the response.

**Load this file when:** building product pages, cart/add-to-cart, search, footer, `robots.txt`, sitemap, structured data, middleware/redirects, or when the user asks for an "agent-ready", "AI-ready", "AI shopping" or "agentic commerce" storefront.

## Priorities

Work in this order. Category weight reflects how much each area matters for agent-readiness; within a category, **H** items matter most.

| Category | Weight | Items (H = high, M = medium, L = low) |
| --- | --- | --- |
| **Access** | 25% | H: agent UAs not blocked · H: robots.txt allows AI search + user agents · H: no CAPTCHA on home/PDP/cart · M: no age/consent/geo gate hiding content |
| **Product data** | 25% | H: name/price/availability in server HTML · H: complete Product JSON-LD matching visible price · M: variants as `ProductGroup` · M: return + shipping structured data · L: OpenGraph product tags |
| **Operability** | 20% | H: add-to-cart is a named `<button>` in a `<form>` · H: variant selectors are real controls · H: accessible names/labels · H: GET search URL · M: policy pages linked sitewide · L: landmarks, one `h1`, `lang`, alt |
| **Discovery** | 15% | H: sitemap in robots.txt with live product URLs · M: canonical + real 404s · M: fast TTFB, light HTML · L: Markdown alternative · L: `/llms.txt` |
| **Agentic commerce** | 15% | H: UCP profile · H: live agent endpoint · M: cart/checkout permalinks · M: OAuth discovery · L (bonus): WebMCP, A2A card, ai-catalog, api-catalog, `rel="ucp"` |

**Default scope:** Access, Product data, Operability and Discovery are standard storefront work. Implement them by default. **Agentic commerce requires backend/API work and is user-dependent - ask before implementing.**

## 1. Access: Let Agents In

### Don't block AI agents or AI search bots (H)

- Serve user-initiated agents and AI search bots the **same full page** as a browser. Same status, same product content - not a stripped or interstitial version.
- Agents to allow:
  - **User-initiated:** `ChatGPT-User`, `Claude-User`, `Perplexity-User`, `Google-Agent`, `Amzn-User`, `Meta-ExternalFetcher`
  - **AI search:** `OAI-SearchBot`, `Claude-SearchBot`, `PerplexityBot`, `Googlebot`, `Bingbot`, `Applebot`, `Amzn-SearchBot`, `Meta-WebIndexer`, `DuckAssistBot`
- **Training crawlers** (`GPTBot`, `ClaudeBot`, `Google-Extended`, `Applebot-Extended`, `Meta-ExternalAgent`) are the merchant's choice. Blocking them is fine and doesn't hurt agent shopping.
- Check middleware, CDN/WAF bot rules (Cloudflare Bot Fight Mode / AI Crawl Control, DataDome, PerimeterX) and rate limits. Prefer verified-bot allowlists (published IP ranges, Web Bot Auth) over UA string matching.
- **Never** add app middleware that returns 403/429 based on AI user agents.

### robots.txt allows agents (H)

- Serve `/robots.txt` as `text/plain` with HTTP 200. A **5xx or unreachable robots.txt means "disallow everything"** to crawlers (RFC 9309).
- Allow AI search bots and user-initiated agents on `/`, product, collection, policy and **`/search`** pages. Disallowing `/cart`, `/checkout`, `/account` is normal.
- **Gotcha:** a bot-specific `User-agent` group **replaces** the `*` group for that bot. Copy any rules you still need into it.
- Include a `Sitemap:` line with an absolute URL.

```ts
// Next.js App Router: app/robots.ts
import type { MetadataRoute } from "next"

export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXT_PUBLIC_BASE_URL
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: ["/cart", "/checkout", "/account"] },
      // Optional: opt out of AI training only
      { userAgent: ["GPTBot", "ClaudeBot", "Google-Extended"], disallow: "/" },
    ],
    sitemap: `${base}/sitemap.xml`,
  }
}
```

### No CAPTCHA on shopping pages (H)

- **No reCAPTCHA / hCaptcha / Turnstile widgets on the homepage, product pages or cart.**
- If abuse protection is needed: keep it on login, signup, contact or gift-card forms, or use invisible/score-only modes (reCAPTCHA v3, Turnstile invisible). Use CDN rate limiting for scraping.

### No gates hiding content (M)

- **Age gates and cookie-consent banners must overlay the page client-side**, not replace the server HTML. The real content must still be in the response.
- **Don't force IP-based redirects from `/`** (e.g. `/` → `/{countryCode}`). Serve a default region at `/` (or return 200 with region links), offer a visible country selector and `hreflang` alternates.
- Never return "not available in your country" or HTTP 451 to crawlers and agents.

## 2. Product Data: Make Facts Machine-Readable

### Server-render product facts (H)

- Product name, **visible price with currency** (e.g. `$49.00`, `49,00 €`) and an **explicit availability string** ("In stock", "Out of stock", "Pre-order") must be in the initial HTML.
- Fetch product data in **server components / SSR / SSG / ISR**. Do not fetch the product in a client component or render price only after hydration.
- A price only inside a JSON blob (e.g. `__NEXT_DATA__`, hydration payload) counts as partial at best. Render it as text.

### Complete Product JSON-LD (H)

Render a `<script type="application/ld+json">` in the **server HTML** of every product page (not injected by client JS). Follows [Google merchant listing](https://developers.google.com/search/docs/appearance/structured-data/merchant-listing) requirements:

- **Required:** `name`, `image`, `offers` with `price` (> 0, dot decimal) and `priceCurrency` (ISO 4217)
- **Recommended (all needed for full credit):** `offers.availability` (`https://schema.org/InStock` etc.), `sku` or `gtin`/`mpn`, `brand`, `description`
- Also add `offers.url` and `itemCondition`
- **Generate it from the same data that renders the visible price.** A JSON-LD price that isn't shown on the page is worse than no JSON-LD.

### Model variants with ProductGroup (M)

For products with options (size, color), use a `ProductGroup` instead of a single `Product` ([Google product variants](https://developers.google.com/search/docs/appearance/structured-data/product-variants)):

```json
{
  "@context": "https://schema.org",
  "@type": "ProductGroup",
  "name": "Classic Tee",
  "description": "Heavyweight cotton t-shirt",
  "image": "https://example.com/tee.jpg",
  "brand": { "@type": "Brand", "name": "Acme" },
  "productGroupID": "prod_123",
  "variesBy": ["https://schema.org/size", "https://schema.org/color"],
  "hasVariant": [
    {
      "@type": "Product",
      "name": "Classic Tee - M / Navy",
      "sku": "TEE-M-NAVY",
      "size": "M",
      "color": "Navy",
      "image": "https://example.com/tee-navy.jpg",
      "offers": {
        "@type": "Offer",
        "url": "https://example.com/products/classic-tee?variant=variant_456",
        "sku": "TEE-M-NAVY",
        "price": "29.00",
        "priceCurrency": "USD",
        "availability": "https://schema.org/InStock",
        "itemCondition": "https://schema.org/NewCondition"
      }
    }
  ]
}
```

- **The `ProductGroup` itself must carry `name`, `image`, `description` and `brand`** - agents treat the group as the product, so missing group-level `image` counts as missing required data.
- Each variant gets its own `sku`/`gtin`, option values and `offers`. Repeat `sku` on the variant's `Offer` too.
- Give each variant a **distinct URL** (e.g. `?variant=<id>`) that preselects it on the page.

### Return policy and shipping in structured data (M)

- Add `hasMerchantReturnPolicy` (`MerchantReturnPolicy`: `applicableCountry`, `returnPolicyCategory`, `merchantReturnDays`, `returnMethod`, `returnFees`) - on the `Organization` in the homepage JSON-LD (preferred) or on each `Offer`.
- Add `shippingDetails` (`OfferShippingDetails`: `shippingRate`, `shippingDestination`, `deliveryTime` with `handlingTime` and `transitTime`) on each `Offer`, or an org-level shipping policy.
- **Fetch values from the backend or store config** - keep them in sync with the human-readable policy pages. Don't invent policy values; ask the user if unknown.

### OpenGraph product tags (L)

In the product page `<head>`: `og:title`, `og:description`, `og:image` (absolute), `og:url` (canonical), `og:type` = `product`, plus `product:price:amount`, `product:price:currency` (and `og:price:amount` / `og:price:currency`), and `product:availability`.

## 3. Operability: Make Actions Usable Without a Human

### Add-to-cart is a real button in a real form (H)

- Native `<button type="submit">` with visible text ("Add to cart"). **Never** a clickable `<div>`/`<span>`.
- Wrap it in a `<form method="post" action="...">` with a **non-empty `action`** and hidden variant ID + quantity inputs, so it works as a plain form post before/without JavaScript. Enhance with JS afterwards (optimistic UI, cart popup).
- Sold out: keep the button, set `disabled`, change text to "Sold out".

```tsx
// Form posts to a real route; JS can intercept onSubmit for the cart popup
<form method="post" action="/cart/add" onSubmit={handleAddToCart}>
  <input type="hidden" name="variant_id" value={selectedVariant.id} />
  <input type="hidden" name="quantity" value="1" />
  {/* variant selectors go inside this form */}
  <button type="submit" disabled={!inStock}>
    {inStock ? "Add to cart" : "Sold out"}
  </button>
</form>
```

- The `/cart/add` route (e.g. a Next.js route handler, SvelteKit form action, Remix action) adds the line item server-side and **303-redirects back** to the product or cart page.
- **Gotcha:** a React server action passed as `<form action={fn}>` works without JS, but React typically renders it as `action=""` in the HTML, so agents and scanners can't tell where it posts. Prefer a real URL. Always confirm with `curl` that the rendered `<form>` has a non-empty `action`.

### Variant selectors are real controls (H)

- Use a native radio group (`<fieldset><legend>Size</legend><input type="radio" name="size" id="size-m"><label for="size-m">M</label>...`) or a labelled `<select>`. Style radios as swatches if needed.
- Put them **inside the add-to-cart form** and server-render the default selection as `checked`.
- If custom buttons are unavoidable: `role="radiogroup"` + `role="radio"` with `aria-checked` and a text name ("Color: Navy").
- Unavailable combinations: `disabled` + "sold out" in the label.

### Accessible names everywhere (H)

Target: **≥95%** of buttons/links named and all form fields labelled.

- `aria-label` (or visually hidden text) on every icon-only button/link: cart, search, menu, wishlist, close, quantity +/-, carousel arrows, social icons.
- Every `input`/`select`/`textarea` gets a `<label for>` or `aria-label`. Placeholders are not labels.
- Images inside links need meaningful `alt`.

### Site search works through a GET URL (H)

- Expose search at a GET URL like `/search?q=<terms>` that **server-renders** a results page with links to product pages.
- Header search must be a real form: `<form role="search" method="get" action="/search"><label for="q">Search</label><input id="q" type="search" name="q"></form>`. Instant search can enhance it but **must not replace it**.
- Add `WebSite` + `SearchAction` JSON-LD on the homepage:

```json
{
  "@context": "https://schema.org",
  "@type": "WebSite",
  "url": "https://example.com",
  "potentialAction": {
    "@type": "SearchAction",
    "target": { "@type": "EntryPoint", "urlTemplate": "https://example.com/search?q={search_term_string}" },
    "query-input": "required name=search_term_string"
  }
}
```

### Policy pages linked sitewide (M)

- Footer links on every page to **all five**: Returns/Refunds, Shipping, Terms, Privacy, Contact.
- Use descriptive link text ("Return policy", "Shipping information") or matching paths (`/returns`, `/shipping`, `/terms`, `/privacy`, `/contact`).
- Each page returns HTTP 200 with the policy as **server-rendered text**. See `layouts/static-pages.md` and `components/footer.md`.

### Semantic structure (L)

- Exactly one `<main>`, at least one `<nav>`, plus `<header>`/`<footer>`.
- **Exactly one `<h1>`** per page (the product name on PDPs).
- `<html lang="...">` set.
- `alt` on **every** `<img>`: descriptive for product images (include variant/color), `alt=""` for decorative ones.

## 4. Discovery: Help Agents Find Pages

### Sitemap declared in robots.txt (H)

- `/sitemap.xml` (or a sitemap index) listing **every live product URL** plus collections/categories, each with `<lastmod>`.
- Only canonical URLs: absolute, same host, returning **200 without redirects**.
- Declared with `Sitemap:` in robots.txt. Generated dynamically from the backend so new/removed products are reflected. See `seo.md` → Dynamic Sitemaps.

### Canonical URLs and real 404s (M)

- Every product page has a self-referencing absolute `<link rel="canonical">` (variant URLs can point to the base product).
- **Unknown product handles return HTTP 404** (or 410 for removed products). Not 200 with "not found" text, and not a redirect to the homepage (soft 404). In Next.js call `notFound()` when the backend returns no product.
- Out-of-stock products stay at HTTP 200 with `OutOfStock` availability.

### Fast and light (M)

- **Server response (TTFB) under 800 ms**; 2 s or more is a failure. Cache product and collection pages at the CDN (stale-while-revalidate / ISR) and avoid uncached backend calls per request.
- **HTML under 1 MB.** Watch for huge inlined JSON (hydration/RSC payloads with full product objects), duplicated data, and inline scripts. Only pass the fields the client needs. Agents pay for every token.

### Markdown alternative (L)

- When a page is requested with `Accept: text/markdown`, return a Markdown rendering (name, price, availability, options, description, policy links) with `Content-Type: text/markdown` and `Vary: Accept`. **Never error or redirect for this header.**
- Also expose it at a stable URL and link it: `<link rel="alternate" type="text/markdown" href="/products/classic-tee.md">`.
- On Cloudflare Pro+, "Markdown for Agents" can do this at the edge instead.

### /llms.txt (L)

Serve `/llms.txt` (optionally mirrored at `/agents.md`) as `text/markdown` or `text/plain`, per [llmstxt.org](https://llmstxt.org/):

```markdown
# Acme Store

> Sustainable basics. Ships to US, CA and EU. Prices in USD/EUR.

## Shop
- [All products](https://example.com/store)
- [T-shirts](https://example.com/categories/t-shirts)
- Search: https://example.com/search?q={query}

## Policies
- [Shipping](https://example.com/shipping)
- [Returns](https://example.com/returns)
- [Contact](https://example.com/contact)

## For agents
- [Sitemap](https://example.com/sitemap.xml)
```

Must have a `#` (H1) title, links, and mention products/policies/commerce endpoints. Generate collection links from the backend, don't hardcode them.

## 5. Agentic Commerce Protocols (Ask First)

These let agents shop **without** parsing HTML. They need backend/API work, so **ask the user before implementing**. Never present them as built into a backend unless verified in its docs.

### UCP profile (H)

Publish a [Universal Commerce Protocol](https://ucp.dev/latest/specification/overview/) business profile at `/.well-known/ucp` (`application/json`):

- `ucp.version` (`YYYY-MM-DD`), `ucp.services` (e.g. `dev.ucp.shopping` with `transport` and absolute `endpoint`), `ucp.capabilities`, `ucp.payment_handlers`.
- Full credit needs all four core capabilities: `dev.ucp.shopping.catalog.search` / `.catalog.lookup`, `dev.ucp.shopping.cart`, `dev.ucp.shopping.checkout`, `dev.ucp.shopping.order`.

### Live agent endpoint (H)

- The endpoint declared in the UCP profile must answer. For MCP (Streamable HTTP): an unauthenticated `POST {"jsonrpc":"2.0","id":1,"method":"tools/list"}` returns tools, **or** returns 401 with `WWW-Authenticate: Bearer resource_metadata="<url>"`.
- For REST: the endpoint returns non-404, non-5xx.

### Cart/checkout permalinks (M)

- A GET route that builds a cart from URL line items and **303-redirects to checkout**, e.g. `/buy/{variant_id}:{qty},{variant_id}:{qty}` ([UCP permalink spec](https://ucp.dev/2026-08-25/specification/permalink/)).
- Unknown variants → 404/410, not an empty cart. **Never require login** to open the link.
- Declare it in `/.well-known/ucp` as the `dev.ucp.shopping.permalink` capability with `config.endpoint`.
- This is the cheapest protocol item: plain storefront route + existing cart APIs.

### OAuth discovery (M)

For agents that sign shoppers in (orders, saved addresses):

- `/.well-known/oauth-protected-resource` (RFC 9728) with `resource` and `authorization_servers`.
- `/.well-known/oauth-authorization-server` (RFC 8414) or `/.well-known/openid-configuration` with `issuer`, `authorization_endpoint`, `token_endpoint`, scopes, PKCE methods.

### Bonus signals (L, only count when present)

- `Link: </.well-known/ucp>; rel="ucp"` response header and `<link rel="ucp" href="/.well-known/ucp">` in the `<head>` (trivial once a UCP profile exists).
- [WebMCP](https://webmachinelearning.github.io/webmcp/) (experimental): `toolname`/`tooldescription` attributes on search and add-to-cart forms, or `document.modelContext.registerTool()`.
- A2A agent card at `/.well-known/agent-card.json`, `/.well-known/ai-catalog.json`, `/.well-known/api-catalog` (RFC 9727).

## Medusa Storefront Notes

- **Medusa MCP (Cloud):** Medusa Cloud projects on any plan get the [Medusa MCP](https://docs.medusajs.com/cloud/medusa-mcp) at `https://cloud.medusajs.com/mcp`. It's a **read-only, merchant-facing** server: the merchant signs in with their Cloud account (OAuth) so AI tools can query their orders, products, customers and Store/Admin API data, as well as Cloud data such as deployments, logs, and environment variables. **It doesn't count as the shopper-facing agent endpoint in section 5**: it can't create carts or check out, it only accepts the merchant's own Cloud login, and it isn't declared in a store's `/.well-known/ucp`. Suggest it when the merchant wants to manage or analyze their store with AI, not for making the storefront shoppable by agents.
- **Not built in:** Medusa has no built-in UCP, shopper-facing MCP or llms.txt for storefronts. They're buildable with custom API routes/storefront routes. A third-party UCP/ACP plugin exists in the Medusa integrations directory. Medusa has an official [Agentic Commerce (OpenAI ACP) tutorial](https://docs.medusajs.com/resources/how-to-tutorials/tutorials/agentic-commerce).
- **Known gaps in Medusa's Next.js starter** (check the user's copy - it may have been changed):
  - No Product JSON-LD, `sitemap.xml`, `robots.txt` or `llms.txt` → add `app/sitemap.ts`, `app/robots.ts`, `app/llms.txt/route.ts` and JSON-LD in the product page server component.
  - Add-to-cart `<button>` isn't inside a `<form>` → wrap it in a `<form method="post" action="...">` posting to a real route.
  - Middleware redirects `/` → `/{countryCode}` → consider serving a default region at `/`.
  - No search page → add a `/[countryCode]/search` route that queries the Store API products endpoint with `q` and server-renders results.
- **JSON-LD / OG prices:** use `variant.calculated_price.calculated_amount` as-is (don't divide by 100) with the region's currency. Fetch products with `region_id` or prices will be missing.
- **Availability:** derive from the variant's inventory fields (`manage_inventory`, `allow_backorder`, `inventory_quantity`). Verify the exact fields and `fields` query param via the Medusa MCP/docs before writing code.
- **Unknown handle:** call `notFound()` when the Store API returns no product.
- **Cart permalinks:** implement as a storefront route that creates a cart, adds line items through the Store API, then redirects to checkout. Verify the SDK methods first (see the verification workflow in SKILL.md).

## Verification Checklist

Run these against a running storefront (replace URLs):

```bash
# Product facts + JSON-LD + ATC form in raw HTML (no JS)
curl -s https://example.com/products/classic-tee | grep -iE 'application/ld\+json|<form|type="submit"|in stock|\$[0-9]'

# Agent UA gets the same page
curl -s -o /dev/null -w "%{http_code}\n" -A "ChatGPT-User/1.0" https://example.com/products/classic-tee

# robots.txt (200, text/plain, Sitemap line) and sitemap
curl -si https://example.com/robots.txt
curl -s https://example.com/sitemap.xml | head

# Real 404 for unknown products (expect 404)
curl -s -o /dev/null -w "%{http_code}\n" https://example.com/products/does-not-exist-123

# GET search returns product links
curl -s "https://example.com/search?q=tee" | grep -o 'href="[^"]*/products/[^"]*"' | head

# TTFB < 0.8s and HTML size < 1 MB
curl -s -o /dev/null -w "%{time_starttransfer}s %{size_download} bytes\n" https://example.com/products/classic-tee

# Optional: Markdown, llms.txt, UCP
curl -sI -H "Accept: text/markdown" https://example.com/products/classic-tee | grep -i content-type
curl -si https://example.com/llms.txt | head
curl -s https://example.com/.well-known/ucp
```

Also run Google's [Rich Results Test](https://search.google.com/test/rich-results) on a product URL and Lighthouse's Accessibility / Agentic Browsing audits.

## Common Mistakes

- ❌ Fetching product data or price in a client component - agents see an empty shell
- ❌ JSON-LD injected client-side, or its price differs from the visible price
- ❌ Single `Product` JSON-LD for a product with size/color options (use `ProductGroup`)
- ❌ Add-to-cart as a `<div onClick>`, or a `<button>` with no surrounding `<form action>`
- ❌ Swatches as bare `<div>`/`<span>` with no role, state or label
- ❌ Icon-only cart/search/menu/wishlist buttons with no `aria-label`
- ❌ Search that only exists as a JS instant-search overlay with no GET results page
- ❌ `Disallow: /search` in robots.txt, or a bot-specific group that silently drops `*` rules
- ❌ Blocking `ChatGPT-User`/`Claude-User`/`OAI-SearchBot` in middleware or WAF (blocking training crawlers is fine)
- ❌ CAPTCHA widget on home, product or cart pages
- ❌ Age gate or consent wall that replaces server HTML instead of overlaying it
- ❌ Forced IP-based redirect from `/` to a locale path or "not available" page
- ❌ Unknown product URL returns 200 or redirects to the homepage (soft 404)
- ❌ Sitemap missing products, listing redirecting URLs, or not declared in robots.txt
- ❌ Policy pages missing from the footer or rendered client-side
- ❌ Shipping/return values hardcoded in JSON-LD that drift from the policy pages
- ❌ Multiple `<h1>`s or images without `alt`
- ❌ Claiming a backend supports UCP/MCP/llms.txt out of the box without verifying
