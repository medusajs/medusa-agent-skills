# Querying Data in Medusa

Medusa's Query API (`query.graph()`) is the primary way to retrieve data, especially across modules. It provides a flexible, performant way to query entities with relations and filters.

## Contents
- [When to Use Query vs Module Services](#when-to-use-query-vs-module-services)
- [Basic Query Structure](#basic-query-structure)
- [In Workflows vs Outside Workflows](#in-workflows-vs-outside-workflows)
- [Field Selection](#field-selection)
- [Filtering](#filtering)
- [Important Filtering Limitation](#important-filtering-limitation)
- [Pagination](#pagination)
- [Querying Linked Data](#querying-linked-data)
- [Validation with throwIfKeyNotFound](#validation-with-throwifkeynotfound)
- [Performance Best Practices](#performance-best-practices)

## When to Use Query vs Module Services

**⚠️ USE QUERY FOR**:
- ✅ Retrieving data **across modules** (products with linked brands, orders with customers)
- ✅ Reading data with linked entities
- ✅ Complex queries with multiple relations
- ✅ Storefront and admin data retrieval

**⚠️ USE MODULE SERVICES FOR**:
- ✅ Retrieving data **within a single module** (products with variants - same module)
- ✅ Using `listAndCount` for pagination within one module
- ✅ Mutations (always use module services or workflows)

**Examples:**
```typescript
// ✅ GOOD: Query for cross-module data
const { data } = await query.graph({
  entity: "product",
  fields: ["id", "title", "brand.*"], // brand is in different module
})

// ✅ GOOD: Module service for single module
const [products, count] = await productService.listAndCountProducts(
  { status: "active" },
  { take: 10, skip: 0 }
)
```

## Basic Query Structure

```typescript
const query = req.scope.resolve("query")

const { data } = await query.graph({
  entity: "entity_name",     // The entity to query
  fields: ["id", "name"],    // Fields to retrieve
  filters: { status: "active" }, // Filter conditions
  pagination: {              // Optional pagination
    take: 10,
    skip: 0,
  },
})
```

## In Workflows vs Outside Workflows

### Outside Workflows (API Routes, Subscribers, Scheduled Jobs)

```typescript
// In API routes
const query = req.scope.resolve("query")

const { data: products } = await query.graph({
  entity: "product",
  fields: ["id", "title"],
})

// In subscribers/scheduled jobs
const query = container.resolve("query")

const { data: customers } = await query.graph({
  entity: "customer",
  fields: ["id", "email"],
})
```

### In Workflows

Use `useQueryGraphStep` within workflow composition functions:

```typescript
import { createWorkflow, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import { useQueryGraphStep } from "@medusajs/medusa/core-flows"

const myWorkflow = createWorkflow(
  "my-workflow",
  function (input) {
    const { data: products } = useQueryGraphStep({
      entity: "product",
      fields: ["id", "title"],
      filters: {
        id: input.product_id,
      },
    })

    return new WorkflowResponse({ products })
  }
)
```

## Field Selection

### Basic Fields

```typescript
const { data } = await query.graph({
  entity: "product",
  fields: ["id", "title", "description"],
})
```

### Nested Relations

Use dot notation to include related entities:

```typescript
const { data } = await query.graph({
  entity: "product",
  fields: [
    "id",
    "title",
    "variants.*", // All fields from variants
    "variants.sku", // Specific variant field
    "category.id",
    "category.name",
  ],
})
```

### Performance Tip

**⚠️ IMPORTANT**: Only retrieve fields and relations you'll actually use. Avoid using `*` to select all fields or retrieving all fields of a relation unnecessarily.

```typescript
// ❌ BAD: Retrieves all fields (inefficient)
fields: ["*"]

// ❌ BAD: Retrieves all product fields (might be many)
fields: ["product.*"]

// ✅ GOOD: Only retrieves needed fields
fields: ["id", "title", "product.id", "product.title"]
```

## Filtering

### Exact Match

```typescript
filters: {
  email: "user@example.com"
}
```

### Multiple Values (IN operator)

```typescript
filters: {
  id: ["id1", "id2", "id3"]
}
```

### Range Queries

```typescript
filters: {
  created_at: {
    $gte: startDate, // Greater than or equal
    $lte: endDate,   // Less than or equal
  }
}
```

### Text Search (LIKE)

```typescript
filters: {
  name: {
    $like: "%search%" // Contains "search"
  }
}

// Starts with
filters: {
  name: {
    $like: "search%"
  }
}

// Ends with
filters: {
  name: {
    $like: "%search"
  }
}
```

### Not Equal

```typescript
filters: {
  status: {
    $ne: "deleted"
  }
}
```

### Multiple Conditions

```typescript
filters: {
  status: "active",
  created_at: {
    $gte: new Date("2024-01-01"),
  },
  price: {
    $gte: 10,
    $lte: 100,
  },
}
```

### Filtering Nested Relations (Same Module)

To filter by fields in nested relations **within the same module**, use object notation:

```typescript
// Product and ProductVariant are in the same module (Product Module)
const { data: products } = await query.graph({
  entity: "product",
  fields: ["id", "title", "variants.*"],
  filters: {
    variants: {
      sku: "ABC1234" // ✅ Works: variants are in same module as product
    }
  }
})
```

## Important Filtering Limitation

**⚠️ CRITICAL**: You **CANNOT** filter by fields from linked data models (different modules). Filters only work on data models within the same module.

### What This Means

- **Same Module** (✅ Can filter): Product and ProductVariant, Order and LineItem, Cart and CartItem
- **Different Modules** (❌ Cannot filter): Product and Brand (custom), Product and Customer, Review and Product

### Example: Cannot Filter Products by Linked Brand

```typescript
// ❌ THIS DOES NOT WORK
const { data: products } = await query.graph({
  entity: "product",
  fields: ["id", "title", "brand.*"],
  filters: {
    "brand.name": "Nike" // ❌ Cannot filter by linked module field
  }
})

// ❌ THIS ALSO DOES NOT WORK
const { data: products } = await query.graph({
  entity: "product",
  fields: ["id", "title", "brand.*"],
  filters: {
    brand: {
      name: "Nike" // ❌ Still doesn't work - brand is in different module
    }
  }
})
```

### Solution 1: Query from Other Side (Recommended)

**✅ BEST APPROACH**: Query the linked module and filter on it directly:

```typescript
// ✅ CORRECT: Query brands and get their products
const { data: brands } = await query.graph({
  entity: "brand",
  fields: ["id", "name", "products.*"],
  filters: {
    name: "Nike" // ✅ Filter on brand directly
  }
})

// Access Nike products
const nikeProducts = brands[0]?.products || []
```

### Solution 2: Filter After Query

**⚠️ LESS EFFICIENT**: Query all data, then filter in JavaScript:

```typescript
// Get all products with brands
const { data: products } = await query.graph({
  entity: "product",
  fields: ["id", "title", "brand.*"],
})

// Filter in JavaScript after query
const nikeProducts = products.filter(p => p.brand?.name === "Nike")
```

**Note**: Solution 1 (query from other side) is preferred because:
- Database filters are more efficient than JavaScript filters
- Reduces data transfer and memory usage
- Supports pagination at the database level

### More Examples

#### Example: Approved Reviews for a Specific Product

When you need to filter linked data by its own properties, query from that entity directly:

```typescript
// ❌ WRONG: Cannot filter linked reviews from product query
const { data: products } = await query.graph({
  entity: "product",
  fields: ["id", "reviews.*"],
  filters: {
    id: productId,
    reviews: {
      status: "approved" // ❌ Doesn't work - reviews is linked module
    }
  }
})

// ❌ ALSO WRONG: Filtering in JavaScript is inefficient
const { data: products } = await query.graph({
  entity: "product",
  fields: ["id", "reviews.*"],
  filters: { id: productId }
})
const approvedReviews = products[0].reviews.filter(r => r.status === "approved") // ❌ Client-side filter

// ✅ CORRECT: Query reviews directly with filters
const { data: reviews } = await query.graph({
  entity: "review",
  fields: ["id", "rating", "comment", "product.*"],
  filters: {
    product_id: productId, // Filter by product
    status: "approved"     // Filter by review status - both in same query!
  }
})
```

**Why this is better:**
- Database filters are more efficient than JavaScript filters
- Reduces data transferred over the network
- Supports pagination properly
- Only retrieves the data you need

#### Example: Reviews for Active Products (Cross-Module)

```typescript
// ❌ WRONG
const { data } = await query.graph({
  entity: "review",
  fields: ["id", "rating", "product.*"],
  filters: {
    product: {
      status: "active" // Doesn't work - product is linked module
    }
  }
})

// ✅ CORRECT: Get active products with reviews
const { data: products } = await query.graph({
  entity: "product",
  fields: ["id", "title", "reviews.*"],
  filters: { status: "active" }
})

// Flatten reviews if needed
const reviews = products.flatMap(p => p.reviews)
```

#### Example: Products with Variants (Same Module - Works!)

```typescript
// ✅ CORRECT: Product and variants are in same module
const { data: products } = await query.graph({
  entity: "product",
  fields: ["id", "title", "variants.*"],
  filters: {
    variants: {
      inventory_quantity: {
        $gte: 10 // ✅ Works: both in Product Module
      }
    }
  }
})
```

## Pagination

### Basic Pagination

```typescript
const { data, metadata } = await query.graph({
  entity: "product",
  fields: ["id", "title"],
  pagination: {
    skip: 0,   // Offset
    take: 10,  // Limit
  },
})

// metadata.count contains total count
console.log(`Total: ${metadata.count}`)
```

### With Ordering

```typescript
const { data } = await query.graph({
  entity: "product",
  fields: ["id", "title", "created_at"],
  pagination: {
    skip: 0,
    take: 10,
    order: {
      created_at: "DESC", // Newest first
    },
  },
})
```

### Multiple Order Fields

```typescript
pagination: {
  order: {
    status: "ASC",
    created_at: "DESC",
  }
}
```

## Querying Linked Data

When entities are linked via [module links](module-links.md), query across them using dot notation:

```typescript
// Get products with their linked brands
const { data: products } = await query.graph({
  entity: "product",
  fields: [
    "id",
    "title",
    "brand.*", // All brand fields
  ],
  filters: {
    id: "prod_123",
  },
})

// Access linked data
console.log(products[0].brand.name)
```

### Reverse Query (From Link to Original)

```typescript
// Get brands with their linked products
const { data: brands } = await query.graph({
  entity: "brand",
  fields: [
    "id",
    "name",
    "products.*", // All linked products
  ],
})

// Access linked products
brands[0].products.forEach(product => {
  console.log(product.title)
})
```

## Validation with throwIfKeyNotFound

Use `throwIfKeyNotFound` to validate that a record exists before performing operations:

```typescript
// Outside workflows
const query = req.scope.resolve("query")

const { data } = await query.graph({
  entity: "product",
  fields: ["id", "title"],
  filters: {
    id: productId,
  },
}, {
  throwIfKeyNotFound: true, // Throws if product doesn't exist
})

// If we get here, product exists
const product = data[0]
```

```typescript
// In workflows
const { data: products } = useQueryGraphStep({
  entity: "product",
  fields: ["id", "title"],
  filters: {
    id: input.product_id,
  },
  options: {
    throwIfKeyNotFound: true, // Throws if product doesn't exist
  },
})
```

**When to use:**
- ✅ Before updating or deleting a record
- ✅ When the record MUST exist for the operation to continue
- ✅ To avoid manual existence checks

```typescript
// ❌ BAD: Manual check
const { data } = await query.graph({ /* ... */ })
if (!data || data.length === 0) {
  throw new MedusaError(MedusaError.Types.NOT_FOUND, "Product not found")
}

// ✅ GOOD: Let query handle it
const { data } = await query.graph(
  { /* ... */ },
  { throwIfKeyNotFound: true }
)
```

## Performance Best Practices

### 1. Only Query What You Need

**⚠️ CRITICAL**: Always specify only the fields you'll use. Avoid using `*` or querying unnecessary relations.

```typescript
// ❌ BAD: Retrieves everything (slow, wasteful)
fields: ["*"]

// ✅ GOOD: Only needed fields (fast)
fields: ["id", "title", "price"]
```

### 2. Limit Relation Depth

There's no hard limit on relation depth, but deeper queries are slower. Only include relations you'll actually use.

```typescript
// ❌ BAD: Unnecessary depth
fields: [
  "id",
  "title",
  "variants.*",
  "variants.product.*", // Circular, unnecessary
  "variants.prices.*",
  "variants.prices.currency.*", // Probably don't need all currency fields
]

// ✅ GOOD: Appropriate depth
fields: [
  "id",
  "title",
  "variants.id",
  "variants.sku",
  "variants.prices.amount",
  "variants.prices.currency_code",
]
```

### 3. Use Pagination for Large Result Sets

```typescript
// ✅ GOOD: Paginated query
const { data, metadata } = await query.graph({
  entity: "product",
  fields: ["id", "title"],
  pagination: {
    take: 50, // Don't retrieve thousands of records at once
    skip: 0,
  },
})
```

### 4. Filter Early

Apply filters to reduce the data set before retrieving fields and relations:

```typescript
// ✅ GOOD: Filters reduce result set first
const { data } = await query.graph({
  entity: "product",
  fields: ["id", "title", "variants.*"],
  filters: {
    status: "published",
    created_at: {
      $gte: lastWeek,
    },
  },
})
```

### 5. Use Specific Queries for Different Use Cases

```typescript
// ✅ For listings (minimal fields)
const { data: listings } = await query.graph({
  entity: "product",
  fields: ["id", "title", "thumbnail", "price"],
})

// ✅ For detail pages (more fields)
const { data: details } = await query.graph({
  entity: "product",
  fields: [
    "id",
    "title",
    "description",
    "thumbnail",
    "images.*",
    "variants.*",
    "variants.prices.*",
  ],
  filters: { id: productId },
})
```

## Common Patterns

### Pattern: List with Search

```typescript
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const query = req.scope.resolve("query")
  const { q } = req.validatedQuery

  const filters: any = {}
  if (q) {
    filters.title = { $like: `%${q}%` }
  }

  const { data: products } = await query.graph({
    entity: "product",
    fields: ["id", "title", "thumbnail"],
    filters,
    ...req.queryConfig, // Uses request query config
  })

  return res.json({ products })
}
```

### Pattern: Retrieve with Validation

```typescript
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const query = req.scope.resolve("query")
  const { id } = req.params

  // Throws 404 if product doesn't exist
  const { data } = await query.graph({
    entity: "product",
    fields: ["id", "title", "description", "variants.*"],
    filters: { id },
  }, {
    throwIfKeyNotFound: true,
  })

  return res.json({ product: data[0] })
}
```

### Pattern: Query with Relations and Filters

```typescript
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const query = req.scope.resolve("query")
  const { category_id } = req.validatedQuery

  const { data: products } = await query.graph({
    entity: "product",
    fields: [
      "id",
      "title",
      "thumbnail",
      "variants.id",
      "variants.prices.amount",
      "category.name",
    ],
    filters: {
      category_id,
      status: "published",
    },
    pagination: {
      take: 20,
      skip: 0,
    },
  })

  return res.json({ products })
}
```

### Pattern: Count Records

```typescript
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const query = req.scope.resolve("query")

  const { data, metadata } = await query.graph({
    entity: "product",
    fields: ["id"], // Minimal fields for counting
    filters: {
      status: "published",
    },
  })

  return res.json({
    count: metadata.count,
  })
}
```

### Pattern: Recent Items

```typescript
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const query = req.scope.resolve("query")

  const { data: recentProducts } = await query.graph({
    entity: "product",
    fields: ["id", "title", "created_at"],
    pagination: {
      take: 10,
      skip: 0,
      order: {
        created_at: "DESC", // Newest first
      },
    },
  })

  return res.json({ products: recentProducts })
}
```
