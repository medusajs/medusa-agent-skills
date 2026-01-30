# Ecommerce Storefront Claude Code Plugin

Comprehensive skill for building high-converting ecommerce storefronts with best practices for UI/UX, conversion optimization, SEO, and mobile responsiveness.

Use this plugin to build frontend features for ecommerce storefronts, including components, layouts, checkout flows, and backend integration. This plugin can be used with any ecommerce backend, such as Medusa.

> For installation and usage with other agents, refer to the [main README](../../README.md).

- [Installation with Claude Code](#installation-with-claude-code)
  - [Prerequisites](#prerequisites)
  - [Install Plugin](#install-plugin)
- [Use Plugin](#use-plugin)
  - [Example Use Cases](#example-use-cases)
- [Skills Included](#skills-included)
- [Coverage](#coverage)
  - [Components (12)](#components-12)
  - [Layouts (8)](#layouts-8)
  - [Features (2)](#features-2)
  - [General Best Practices (5)](#general-best-practices-5)
- [Features](#features)
- [Privacy](#privacy)

## Installation with Claude Code

### Prerequisites

- [Claude Code](https://github.com/anthropics/claude-code) installed
- An ecommerce storefront project (or planning to create one)

### Install Plugin

1. Start Claude:

```bash
claude
```

2. Add Medusa marketplace to Claude Code:

```bash
/plugin marketplace add medusajs/medusa-agent-skills
```

3. Install the plugin:

```bash
/plugin install ecommerce-storefront@medusa
```

4. Verify the plugin is loaded:

```bash
/plugin
```

You should see the Ecommerce Storefront plugin listed under the Installed tab.

## Use Plugin

When building storefront features, Claude will automatically load the appropriate guidance from this plugin. The skill triggers on keywords like "checkout", "cart", "product page", "navigation", etc.

You can also manually call the skill with `/ecommerce-storefront:storefront-best-practices`.

### Example Use Cases

Here are some examples of what you can ask Claude to build:

**Example 1: Product Listing Page**

> Build a product listing page in my storefront with filters for category, price range, and size. Include sorting options and pagination.

**Example 2: Checkout Flow**

> Implement a checkout page in my storefront with shipping address, delivery method selection, and payment. Use the Medusa backend.

**Example 3: Navigation Component**

> Create a responsive navbar with cart indicator, search, and category dropdown in my storefront. Cart should always be visible on mobile.

**Example 4: Product Details Page**

> Build a product detail page with image gallery, variant selection (size/color), add to cart, and related products in my storefront.

**Example 5: Homepage Layout**

> Design a homepage with hero section, featured categories, product slider, and newsletter signup in my storefront.

## Skills Included

1. **storefront-best-practices** - Comprehensive guidance for building ecommerce storefronts (components, layouts, features, backend integration)

## Privacy

This plugin does not collect, store, or transmit any user data or conversation information. All instructional content is provided locally through skill files.
