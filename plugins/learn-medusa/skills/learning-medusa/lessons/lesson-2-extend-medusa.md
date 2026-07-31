# Lesson 2: Extend Medusa Core Features

## Learning Objectives

By the end of this lesson, you will:

- **Link** brands to products using Module Links
- **Extend** core workflows using Workflow Hooks
- **Configure** additional_data for custom parameters
- **Query** linked records across modules using Query

**Time**: 45-60 minutes

**Prerequisites**: Completed Lesson 1 (Brand Module, createBrandWorkflow, POST /admin/brands)

## What We're Building

In Lesson 1, you created a brands system. Now we'll integrate it with Medusa's core Product Module:

**New capabilities**:
- Associate a brand with a product when creating it
- Retrieve a product with its brand details
- List all brands with their associated products
- Maintain module isolation (no direct dependencies!)

**By the end**, you'll be able to:

```bash
# Create product with brand
curl -X POST 'http://localhost:9000/admin/products' \
  --data '{
    "title": "Acme Widget",
    "additional_data": { "brand_id": "brand_123" }
  }'

# Get product with brand
curl 'http://localhost:9000/admin/products/prod_123?fields=+brand.*'

# Get brand with products
curl 'http://localhost:9000/admin/brands/brand_123'
```

---

## Architecture Overview: Extending Without Breaking

### The Challenge

You want to add brands to products. In other platforms, you might:

```typescript
// ❌ Anti-pattern: Modify core Product Module
// src/modules/product/models/product.ts (DON'T DO THIS!)
export const Product = model.define("product", {
  id: model.id().primaryKey(),
  title: model.text(),
  brand_id: model.text(), // Adding this breaks module isolation!
})
```

**Problems**:
- Core modules shouldn't know about custom modules
- Breaks when Medusa updates
- Can't reuse Brand Module elsewhere
- Violates single responsibility

### The Medusa Solution

Medusa provides three tools to extend core features safely:

1. **Module Links**: Connect data models across modules while maintaining isolation
2. **Workflow Hooks**: Inject custom logic into core workflows
3. **Additional Data**: Pass custom parameters through core API routes

```
┌─────────────────────────────────────────────────┐
│  Product Module (Core)                          │
│  - Knows nothing about brands                   │
│  - Remains reusable and isolated                │
└─────────────────────────────────────────────────┘
                     ↕ (Module Link)
┌─────────────────────────────────────────────────┐
│  Brand Module (Custom)                          │
│  - Knows nothing about products                 │
│  - Remains reusable and isolated                │
└─────────────────────────────────────────────────┘

        Both connected, both isolated!
```

**Documentation**: [Module Links](https://docs.medusajs.com/learn/fundamentals/module-links) | [Workflow Hooks](https://docs.medusajs.com/learn/fundamentals/workflows/workflow-hooks) | [Additional Data](https://docs.medusajs.com/learn/fundamentals/api-routes/additional-data)

---

## Part 1: Define Module Link

### What is a Module Link?

A **Module Link** creates a relationship between data models of different modules while maintaining module isolation.

**Key properties**:
- Neither module imports from the other
- Link is managed separately in `src/links/`
- Both modules remain reusable
- Relationship is defined declaratively

**Think of it like a junction table**:
- In SQL: A `product_brand` table with `product_id` and `brand_id` columns
- In Medusa: A link definition that creates this automatically

**Documentation**: [Module Links Guide](https://docs.medusajs.com/learn/fundamentals/module-links)

### Step 2.1: Define the Link

Create `src/links/product-brand.ts`:

```typescript
import BrandModule from "../modules/brand"
import ProductModule from "@medusajs/medusa/product"
import { defineLink } from "@medusajs/framework/utils"

export default defineLink(
  {
    linkable: ProductModule.linkable.product,
    isList: true,
  },
  BrandModule.linkable.brand
)
```

**Let's break this down**:

**1. Import Module Definitions**:
```typescript
import BrandModule from "../modules/brand"
import ProductModule from "@medusajs/medusa/product"
```
- Custom modules: Import from `../modules/[name]`
- Core modules: Import from `@medusajs/medusa/[module-name]`

**2. Access Linkable Property**:
```typescript
ProductModule.linkable.product
BrandModule.linkable.brand
```
- Every module exports a `linkable` property
- Contains link configurations for each data model
- Property name is snake-case model name

**3. Define the Link**:
```typescript
defineLink(
  { linkable: ProductModule.linkable.product, isList: true },
  BrandModule.linkable.brand
)
```

**Parameters**:
- First: Product (with `isList: true` - many products per brand)
- Second: Brand

**The `isList` property**:
```
Brand ─── (1 to many) ─── Products

One brand can have many products: isList: true for Product
Each product has one brand: isList: false (default) for Brand
```

**Order matters!** The link configuration order affects how you create links later.

### Step 2.2: Sync Link to Database

Module links are stored in a database table. Run:

```bash
npx medusa db:migrate
```

This:
- Creates a `link_product_brand` table (or similar)
- Stores relationships between product IDs and brand IDs
- Enables querying across modules

---

## Checkpoint 2.1: Verify Module Link

### Verification Questions

1. **Why use Module Links instead of adding `brand_id` to Product model?**
   <details>
   <summary>Click to reveal answer</summary>
   Module Links maintain isolation - Product Module doesn't know about brands, Brand Module doesn't know about products. Both remain reusable.
   </details>

2. **What does `isList: true` mean?**
   <details>
   <summary>Click to reveal answer</summary>
   Many records of that model can be linked to the other model. One brand can have many products.
   </details>

3. **What happens if you forget to run migrations?**
   <details>
   <summary>Click to reveal answer</summary>
   The link table won't exist, so creating links will fail.
   </details>

### Implementation Check

1. **Check migrations succeeded**:
   ```bash
   npx medusa db:migrate
   ```
   Expected: Migration runs successfully

2. **Check build succeeds**:
   ```bash
   npm run build
   ```

3. **Show me your file**:
   - `src/links/product-brand.ts`

### Common Issues

**"Link not found"**
- Check file is in `src/links/` directory
- Ensure proper import paths

**"Migration failed"**
- Check database is running
- Review migration output for errors

### Testing Checklist

- [ ] Link file created in `src/links/`
- [ ] Migrations ran successfully
- [ ] Build succeeds

---

## Part 2: Extend Create Product Workflow

### What are Workflow Hooks?

**Workflow Hooks** are predefined points in core workflows where you can inject custom logic.

**Example**: Medusa's `createProductsWorkflow` has hooks:
- `productsCreated` - Runs after products are created
- `productsUpdated` - Runs after products are updated
- `productsDeleted` - Runs after products are deleted

You can "consume" (listen to) these hooks and perform custom actions.

**Why hooks?**
- Extend core workflows without modifying them
- Keep customizations separate and maintainable
- Workflows remain upgradeable

**Documentation**: [Workflow Hooks Guide](https://docs.medusajs.com/learn/fundamentals/workflows/workflow-hooks)

### Step 2.2: Consume productsCreated Hook

When a product is created, we want to link it to a brand (if brand_id was provided).

Create `src/workflows/hooks/created-product.ts`:

```typescript
import { createProductsWorkflow } from "@medusajs/medusa/core-flows"
import { StepResponse } from "@medusajs/framework/workflows-sdk"
import { Modules } from "@medusajs/framework/utils"
import { LinkDefinition } from "@medusajs/framework/types"
import { BRAND_MODULE } from "../../modules/brand"
import BrandModuleService from "../../modules/brand/service"

createProductsWorkflow.hooks.productsCreated(
  async ({ products, additional_data }, { container }) => {
    if (!additional_data?.brand_id) {
      return new StepResponse([], [])
    }

    const brandModuleService: BrandModuleService = container.resolve(
      BRAND_MODULE
    )

    // Verify brand exists (throws error if not)
    await brandModuleService.retrieveBrand(additional_data.brand_id as string)

    // Create links between products and brand
    const link = container.resolve("link")
    const links: LinkDefinition[] = []

    for (const product of products) {
      links.push({
        [Modules.PRODUCT]: {
          product_id: product.id,
        },
        [BRAND_MODULE]: {
          brand_id: additional_data.brand_id,
        },
      })
    }

    await link.create(links)

    return new StepResponse(links, links)
  },
  async (links, { container }) => {
    if (!links?.length) {
      return
    }

    const link = container.resolve("link")
    await link.dismiss(links)
  }
)
```

**Let's break this down**:

**1. Hook Consumption**:
```typescript
createProductsWorkflow.hooks.productsCreated(
  async ({ products, additional_data }, { container }) => { ... },
  async (links, { container }) => { ... }
)
```
- First parameter: Hook step function
- Second parameter: Compensation function (for rollback)

**2. Hook Input**:
```typescript
{ products, additional_data }
```
- `products`: Array of created products (from workflow)
- `additional_data`: Custom data from API request body

**3. Verify Brand Exists**:
```typescript
await brandModuleService.retrieveBrand(additional_data.brand_id)
```
- Throws error if brand doesn't exist
- Prevents linking to non-existent brands

**4. Create Links**:
```typescript
const link = container.resolve("link")
const links = [{
  [Modules.PRODUCT]: { product_id: product.id },
  [BRAND_MODULE]: { brand_id: additional_data.brand_id },
}]
await link.create(links)
```

**Link object structure**:
- Keys: Module names (in the order defined in `defineLink`)
- Values: Objects with `{model}_id` properties

**Order matters!** Must match the order in `defineLink`:
```typescript
// In defineLink:
defineLink(ProductModule.linkable.product, BrandModule.linkable.brand)

// In link.create:
{
  [Modules.PRODUCT]: { product_id: "..." },  // First
  [BRAND_MODULE]: { brand_id: "..." },       // Second
}
```

**5. Compensation Function**:
```typescript
async (links, { container }) => {
  const link = container.resolve("link")
  await link.dismiss(links)
}
```
- Removes links if an error occurs later
- Maintains data consistency

**Documentation**: [Hook Consumption](https://docs.medusajs.com/learn/fundamentals/workflows/workflow-hooks) | [Link Creation](https://docs.medusajs.com/learn/fundamentals/module-links/link)

### Step 2.3: Configure additional_data

To pass `brand_id` through the create product API route, configure `additional_data` validation.

Update or create `src/api/middlewares.ts`:

```typescript
import {
  defineMiddlewares,
  validateAndTransformBody, // If already importing
} from "@medusajs/framework/http"
import { z } from "@medusajs/framework/zod"

export default defineMiddlewares({
  routes: [
    // ... existing routes ...
    {
      matcher: "/admin/products",
      method: ["POST"],
      additionalDataValidator: {
        brand_id: z.string().optional(),
      },
    },
  ],
})
```

**What's happening?**

**`additionalDataValidator`**:
- Configures validation for `additional_data` request body parameter
- Uses Zod schemas for each property
- Properties are passed to workflow hooks

**Why optional?**
- Not all products need a brand
- Allows creating products without brands

**Documentation**: [Additional Data Validation](https://docs.medusajs.com/learn/fundamentals/api-routes/additional-data)

---

## Checkpoint 2.2: Test Creating Product with Brand

### Verification Questions

1. **Why verify the brand exists before creating the link?**
   <details>
   <summary>Click to reveal answer</summary>
   Prevents linking to non-existent brands. If brand doesn't exist, the error is caught early and the workflow rolls back the product creation.
   </details>

2. **What happens if you don't add a compensation function to the hook?**
   <details>
   <summary>Click to reveal answer</summary>
   If an error occurs after linking, the links won't be removed - you'll have orphaned links in the database.
   </details>

3. **Why is `brand_id` optional in additionalDataValidator?**
   <details>
   <summary>Click to reveal answer</summary>
   Not all products need a brand. Making it optional allows flexibility.
   </details>

### Implementation Check

1. **Build succeeds**:
   ```bash
   npm run build
   ```

2. **Show me your files**:
   - `src/workflows/hooks/created-product.ts`
   - `src/api/middlewares.ts`

### Test Creating Product with Brand

**Step 1: Create a brand** (if you haven't already):
```bash
curl -X POST 'http://localhost:9000/admin/brands' \
  -H 'Authorization: Bearer {token}' \
  --data '{ "name": "Acme" }'
```

Save the brand ID from the response.

**Step 2: Get a shipping profile ID** (required for products):
```bash
curl 'http://localhost:9000/admin/shipping-profiles' \
  -H 'Authorization: Bearer {token}'
```

**Step 3: Create product with brand**:
```bash
curl -X POST 'http://localhost:9000/admin/products' \
  -H 'Authorization: Bearer {token}' \
  --data '{
    "title": "Acme Widget",
    "options": [
      { "title": "Default", "values": ["Default Value"] }
    ],
    "shipping_profile_id": "{shipping_profile_id}",
    "additional_data": {
      "brand_id": "{brand_id}"
    }
  }'
```

**Note on prices**: If you're adding prices to your product variants, remember that Medusa stores prices as-is (not in cents). For example, a $19.99 product should have `"amount": 19.99`, not `1999`.

**Expected**: Product created successfully

**Check logs**: You should see "Linked brand to products" or similar

### Common Issues

**"Brand not found"**
- Brand ID is wrong or brand doesn't exist
- Create brand first

**"Hook not running"**
- Check file is in `src/workflows/hooks/`
- Restart dev server
- Check for TypeScript errors

**"Invalid additional_data"**
- Check `additionalDataValidator` is configured correctly
- Ensure `brand_id` is a string

### Testing Checklist

- [ ] Product created with brand_id in additional_data
- [ ] No errors in server logs
- [ ] Product creation succeeds

---

## Part 3: Query Linked Records

### Querying with `fields` Parameter

Medusa's core API routes accept a `fields` query parameter to retrieve linked data.

**Get product with brand**:
```bash
curl 'http://localhost:9000/admin/products/{product_id}?fields=+brand.*' \
  -H 'Authorization: Bearer {token}'
```

**Response**:
```json
{
  "product": {
    "id": "prod_123",
    "title": "Acme Widget",
    "brand": {
      "id": "brand_123",
      "name": "Acme",
      "created_at": "...",
      "updated_at": "..."
    }
  }
}
```

**The `+brand.*` syntax**:
- `+` = Add to default fields (don't replace)
- `brand` = Linked model name (singular)
- `.*` = All properties of brand

**Documentation**: [Fields Parameter Guide](https://docs.medusajs.com/api/store#select-fields-and-relations)

### Querying with Query.graph()

For custom API routes, use **Query** to retrieve linked records.

**Example**: Create an endpoint to get brands with their products.

Update `src/api/admin/brands/route.ts`:

```typescript
import {
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { createBrandWorkflow } from "../../../workflows/create-brand"
import { PostAdminCreateBrandType } from "./validators"

// Keep existing POST handler...

export const GET = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  const query = req.scope.resolve("query")

  const { data: brands } = await query.graph({
    entity: "brand",
    fields: ["*", "products.*"],
  })

  res.json({ brands })
}
```

**What's happening?**

**1. Resolve Query**:
```typescript
const query = req.scope.resolve("query")
```
- Query is a Medusa framework tool for cross-module queries
- Registered in the container

**2. Query Linked Data**:
```typescript
await query.graph({
  entity: "brand",
  fields: ["*", "products.*"],
})
```

**Parameters**:
- `entity`: Data model name (as defined in `model.define`)
- `fields`: Array of properties and relations to retrieve
  - `"*"` = All properties of brand
  - `"products.*"` = All properties of linked products (plural!)

**Why "products" (plural)?**
Because brands are linked to a list of products (`isList: true` in the link definition).

**Documentation**: [Query Guide](https://docs.medusajs.com/learn/fundamentals/module-links/query)

---

## Checkpoint 2.3: Test Querying

### Verification Questions

1. **Why use `products.*` (plural) instead of `product.*` (singular)?**
   <details>
   <summary>Click to reveal answer</summary>
   Brands are linked to multiple products (isList: true), so the property name is plural.
   </details>

2. **What's the difference between `fields` parameter and Query.graph()?**
   <details>
   <summary>Click to reveal answer</summary>
   - `fields` parameter: Use with existing Medusa API routes
   - Query.graph(): Use in custom API routes
   Both retrieve linked data, different use cases.
   </details>

### Implementation Check

1. **Build succeeds**:
   ```bash
   npm run build
   ```

2. **Show me your file**:
   - `src/api/admin/brands/route.ts`

### Test Querying

**Test 1: Get product with brand**:
```bash
curl 'http://localhost:9000/admin/products/{product_id}?fields=+brand.*' \
  -H 'Authorization: Bearer {token}'
```

**Expected**: Product with `brand` property

**Test 2: Get brands with products**:
```bash
curl 'http://localhost:9000/admin/brands' \
  -H 'Authorization: Bearer {token}'
```

**Expected Response**:
```json
{
  "brands": [
    {
      "id": "brand_123",
      "name": "Acme",
      "products": [
        {
          "id": "prod_123",
          "title": "Acme Widget",
          ...
        }
      ]
    }
  ]
}
```

### Common Issues

**"Cannot query products"**
- Check link is defined correctly
- Ensure migrations ran
- Verify products are actually linked to brand

**"Brand property missing on product"**
- Forgot `?fields=+brand.*` in query
- Link not created when product was created

### Testing Checklist

- [ ] Product retrieved with brand details
- [ ] Brands retrieved with products
- [ ] Both queries return expected data

---

## Lesson 2 Complete! 🎉

### What You Built

Amazing work! You've extended Medusa's core functionality:

- ✅ **Module Link**: Connected brands to products (maintaining isolation)
- ✅ **Workflow Hook**: Extended createProductsWorkflow to link brands
- ✅ **Additional Data**: Configured validation for custom parameters
- ✅ **Querying**: Retrieved linked data across modules

### What You Learned

**Module Links**:
- Create relationships without breaking module isolation
- Neither module depends on the other
- Links are managed separately

**Workflow Hooks**:
- Extend core workflows without modifying them
- Inject custom logic at predefined points
- Include rollback logic for data consistency

**Additional Data**:
- Pass custom parameters through core API routes
- Validate with Zod schemas
- Accessible in workflow hooks

**Query**:
- Retrieve data across modules
- Use `fields` parameter in core routes
- Use Query.graph() in custom routes

### Architecture Reinforcement

**1. Why not just add `brand_id` column to products table?**

<details>
<summary>Answer</summary>

**Problems with direct column**:
```typescript
// ❌ This breaks module isolation
export const Product = model.define("product", {
  brand_id: model.text(),
})
```

- Product Module now knows about brands
- Can't reuse Brand Module elsewhere
- Breaks when Medusa updates Product Module
- Violates single responsibility

**Module Links solve this**:
- Product Module: No knowledge of brands
- Brand Module: No knowledge of products
- Link: Separate concern, easy to maintain
- Both modules remain reusable
</details>

**2. How does additional_data reach the workflow hook?**

<details>
<summary>Answer</summary>

Flow:
1. Client sends request: `{ additional_data: { brand_id: "..." } }`
2. Middleware validates: `additionalDataValidator: { brand_id: z.string() }`
3. API route executes workflow
4. Workflow passes to hooks: `{ products, additional_data }`
5. Your hook consumes: `if (additional_data?.brand_id) { ... }`
</details>

**3. What happens if brand creation fails after linking?**

<details>
<summary>Answer</summary>

The compensation function runs:
```typescript
async (links, { container }) => {
  const link = container.resolve("link")
  await link.dismiss(links)  // Removes the links
}
```

This ensures no orphaned links exist.
</details>

### Commit Your Work

```bash
git add .
git commit -m "Complete Lesson 2: Module Links, Workflow Hooks, and Query"
```

---

## Ready for Lesson 3?

In **Lesson 3: Customize Admin Dashboard**, you'll learn how to:

- **Create widgets** to display brand on product detail page
- **Build UI routes** for managing brands
- **Use React Query** for data fetching
- **Integrate Medusa UI** components

You'll build:
- A widget showing brand name on product pages
- A brands management page with a data table
- Full CRUD operations in the admin dashboard

**Documentation**: [Admin Widgets](https://docs.medusajs.com/learn/fundamentals/admin/widgets) | [Admin UI Routes](https://docs.medusajs.com/learn/fundamentals/admin/ui-routes) | [Medusa UI Components](https://docs.medusajs.com/ui)

When you're ready, let me know and we'll start Lesson 3!
