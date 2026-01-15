# Module Links

## Contents
- [When to Use Links](#when-to-use-links)
- [Implementing Module Links - Workflow Checklist](#implementing-module-links---workflow-checklist)
- [Step 1: Defining a Link](#step-1-defining-a-link)
- [Step 2: Link Configuration Options](#step-2-link-configuration-options)
  - [List Links (One-to-Many)](#list-links-one-to-many)
  - [Delete Cascades](#delete-cascades)
- [Step 3: Sync Links (Run Migrations)](#step-3-sync-links-run-migrations)
- [Step 4: Managing Links](#step-4-managing-links)
- [Step 5: Querying Linked Data](#step-5-querying-linked-data)
- [Advanced: Link with Custom Columns](#advanced-link-with-custom-columns)

Module links create associations between data models in different modules while maintaining module isolation. Use links to connect your custom models to Commerce Module models (products, customers, orders, etc.).

## When to Use Links

- **Extend commerce entities**: Add brands to products, wishlists to customers
- **Cross-module associations**: Connect custom modules to each other
- **Maintain isolation**: Keep modules independent and reusable

## Implementing Module Links - Workflow Checklist

**IMPORTANT FOR CLAUDE CODE**: When implementing module links, use the TodoWrite tool to track your progress through these steps. This ensures you don't miss any critical steps and provides visibility to the user.

Create these tasks in your todo list:

- Optional: Add linked ID in custom data model (if one-to-one or one-to-many)
- Define the link in src/links/
- Configure list or delete cascade options if needed
- **CRITICAL: Run migrations: npx medusa db:migrate** (Never skip this step!)
- Create links in code using link.create() or createRemoteLinkStep
- Query linked data using query.graph()
- **CRITICAL: Run build to validate implementation** (catches type errors and issues)

## Optional: Add Linked ID in Custom Data Model

Add the ID of a linked data model in the custom data model if the custom data model belongs to it or extends it. Otherwise, skip this step.

For example, add ID of customer and product to custom product review model:

```typescript
import { model } from "@medusajs/framework/utils"

const Review = model.define("review", {
  // other properties...
  // ID of linked customer
  customer_id: model.text(),
  // ID of linked product
  product_id: model.text()
})

export default Review
```

## Step 1: Defining a Link

**⚠️ CRITICAL RULE: Create ONE link definition per file.** Do NOT export an array of links from a single file.

Create link files in `src/links/`:

```typescript
// ✅ CORRECT - src/links/product-brand.ts (one link per file)
import { defineLink } from "@medusajs/framework/utils"
import ProductModule from "@medusajs/medusa/product"
import BrandModule from "../modules/brand"

export default defineLink(
  ProductModule.linkable.product,
  BrandModule.linkable.brand
)
```

**If one model links to multiple others, create multiple files:**

```typescript
// ✅ CORRECT - src/links/review-product.ts
export default defineLink(
  ReviewModule.linkable.review,
  ProductModule.linkable.product
)

// ✅ CORRECT - src/links/review-customer.ts
export default defineLink(
  ReviewModule.linkable.review,
  CustomerModule.linkable.customer
)

// ❌ WRONG - Don't export array of links from one file
export default [
  defineLink(ReviewModule.linkable.review, ProductModule.linkable.product),
  defineLink(ReviewModule.linkable.review, CustomerModule.linkable.customer),
] // This doesn't work!
```

**IMPORTANT:** The `.linkable` property is **automatically added** to all modules by Medusa. You do NOT need to add `.linkable()` or any linkable definition to your data models. Simply use `ModuleName.linkable.modelName` when defining links.

For example, if you have a `Review` data model in a `ReviewModule`:
- ✅ CORRECT: `ReviewModule.linkable.review` (works automatically)
- ❌ WRONG: Adding `.linkable()` method to the Review model definition (not needed, causes errors)

**⚠️ NEXT STEP**: After defining a link, you MUST immediately proceed to Step 3 to run migrations (`npx medusa db:migrate`). Do not skip this step!

## Step 2: Link Configuration Options

### List Links (One-to-Many)

Allow multiple records to link to one record:

```typescript
// A brand can have many products
export default defineLink(
  {
    linkable: ProductModule.linkable.product,
    isList: true,
  },
  BrandModule.linkable.brand
)
```

### Delete Cascades

Automatically delete links when a record is deleted:

```typescript
export default defineLink(ProductModule.linkable.product, {
  linkable: BrandModule.linkable.brand,
  deleteCascade: true,
})
```

## Step 3: Sync Links (Run Migrations)

**⚠️ CRITICAL - DO NOT SKIP**: After defining links, you MUST run migrations to sync the link to the database. Without this step, the link will not work and you will get runtime errors.

```bash
npx medusa db:migrate
```

**Why this matters:**
- Links create database tables that store the relationships between modules
- Without migrations, these tables don't exist and link operations will fail
- This step is REQUIRED before creating any links in code or querying linked data

**Common mistake:** Defining a link in `src/links/` and immediately trying to use it in a workflow or query without running migrations first. Always run migrations immediately after defining a link.

## Step 4: Managing Links

**⚠️ CRITICAL - Link Order (Direction):** When creating or dismissing links, the order of modules MUST match the order in `defineLink()`. Mismatched order causes runtime errors.

```typescript
// Example link definition: product FIRST, then brand
export default defineLink(
  ProductModule.linkable.product,
  BrandModule.linkable.brand
)
```

### In Workflow Composition Functions

To create a link between records in workflow composition functions, use the `createRemoteLinkStep`:

```typescript
import { Modules } from "@medusajs/framework/utils"
import { createRemoteLinkStep } from "@medusajs/medusa/core-flows"
import {
  createWorkflow,
  transform,
} from "@medusajs/framework/workflows-sdk"

const BRAND_MODULE = "brand"

export const myWorkflow = createWorkflow(
  "my-workflow",
  function (input) {
    // ...
    // ✅ CORRECT - Order matches defineLink (product first, then brand)
    const linkData = transform({ input }, ({ input }) => {
      return [
        {
          [Modules.PRODUCT]: {
            product_id: input.product_id,
          },
          [BRAND_MODULE]: {
            brand_id: input.brand_id,
          },
        },
      ]
    })

    createRemoteLinkStep(linkData)
    // ...
  }
)

// ❌ WRONG - Order doesn't match defineLink
const linkData = transform({ input }, ({ input }) => {
  return [
    {
      [BRAND_MODULE]: {
        brand_id: input.brand_id,
      },
      [Modules.PRODUCT]: {
        product_id: input.product_id,
      },
    },
  ]
}) // Runtime error: link direction mismatch!
```

To dismiss (remove) a link between records in workflow composition functions, use the `dismissRemoteLinkStep`:

```typescript
import { Modules } from "@medusajs/framework/utils"
import { dismissRemoteLinkStep } from "@medusajs/medusa/core-flows"
import {
  createWorkflow,
  transform,
} from "@medusajs/framework/workflows-sdk"

const BRAND_MODULE = "brand"

export const myWorkflow = createWorkflow(
  "my-workflow",
  function (input) {
    // ...
    // Order MUST match defineLink (product first, then brand)
    const linkData = transform({ input }, ({ input }) => {
      return [
        {
          [Modules.PRODUCT]: {
            product_id: input.product_id,
          },
          [BRAND_MODULE]: {
            brand_id: input.brand_id,
          },
        },
      ]
    })

    dismissRemoteLinkStep(linkData)
    // ...
  }
)
```

### Outside Workflows

Outside workflows or in workflow steps, use the `link` utility to create and manage links between records. **Order MUST match `defineLink()` here too:**

```typescript
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"

// In an API route or workflow step
const link = container.resolve(ContainerRegistrationKeys.LINK)

const BRAND_MODULE = "brand"

// ✅ CORRECT - Create a link (order matches defineLink: product first, then brand)
await link.create({
  [Modules.PRODUCT]: { product_id: "prod_123" },
  [BRAND_MODULE]: { brand_id: "brand_456" },
})

// ✅ CORRECT - Dismiss (remove) a link (same order: product first, then brand)
await link.dismiss({
  [Modules.PRODUCT]: { product_id: "prod_123" },
  [BRAND_MODULE]: { brand_id: "brand_456" },
})

// ❌ WRONG - Order doesn't match defineLink
await link.create({
  [BRAND_MODULE]: { brand_id: "brand_456" },
  [Modules.PRODUCT]: { product_id: "prod_123" },
}) // Runtime error: link direction mismatch!
```

## Step 5: Querying Linked Data

Use `query.graph()` to fetch data across linked modules:

```typescript
const query = container.resolve("query")

// Get products with their linked brands
const { data: products } = await query.graph({
  entity: "product",
  fields: ["id", "title", "brand.*"], // brand.* fetches linked brand data
  filters: {
    id: "prod_123",
  },
})

// Get brands with their linked products
const { data: brands } = await query.graph({
  entity: "brand",
  fields: ["id", "name", "products.*"],
})
```

## Advanced: Link with Custom Columns

Add extra data to the link table:

```typescript
export default defineLink(
  ProductModule.linkable.product,
  BrandModule.linkable.brand,
  {
    database: {
      extraColumns: {
        featured: {
          type: "boolean",
          defaultValue: "false",
        },
      },
    },
  }
)
```

Set custom column values when creating links:

```typescript
await link.create({
  product: { product_id: "prod_123" },
  brand: { brand_id: "brand_456" },
  data: { featured: true },
})
```
