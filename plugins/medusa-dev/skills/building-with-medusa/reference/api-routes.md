# Custom API Routes

API routes (also called "endpoints") are the primary way to expose custom functionality to storefronts and admin dashboards.

## Contents
- [Path Conventions](#path-conventions)
- [Middleware Validation](#middleware-validation)
- [Query Parameter Validation](#query-parameter-validation)
- [Request Query Config for List Endpoints](#request-query-config-for-list-endpoints)
- [API Route Structure](#api-route-structure)
- [Error Handling](#error-handling)
- [Protected Routes](#protected-routes)
- [Using Workflows in API Routes](#using-workflows-in-api-routes)

## Path Conventions

### Store API Routes (Storefront)
- **Path prefix**: `/store/<rest-of-path>`
- **Examples**: `/store/newsletter-signup`, `/store/custom-search`
- **Authentication**: SDK automatically includes publishable API key

### Admin API Routes (Dashboard)
- **Path prefix**: `/admin/<rest-of-path>`
- **Examples**: `/admin/custom-reports`, `/admin/bulk-operations`
- **Authentication**: SDK automatically includes auth headers (bearer/session)

**Detailed authentication patterns**: See [authentication.md](authentication.md)

## Middleware Validation

**⚠️ CRITICAL**: Always validate request bodies using Zod schemas and the `validateAndTransformBody` middleware.

### Combining Multiple Middlewares

When you need both authentication AND validation, pass them as an array. **NEVER nest validation inside authenticate:**

```typescript
// ✅ CORRECT - Multiple middlewares in array
export default defineMiddlewares({
  routes: [
    {
      matcher: "/store/products/:id/reviews",
      method: "POST",
      middlewares: [
        authenticate("customer", ["session", "bearer"]),
        validateAndTransformBody(CreateReviewSchema)
      ],
    },
  ],
})

// ❌ WRONG - Don't nest validator inside authenticate
export default defineMiddlewares({
  routes: [
    {
      matcher: "/store/products/:id/reviews",
      method: "POST",
      middlewares: [authenticate("customer", ["session", "bearer"], {
        validator: CreateReviewSchema  // This doesn't work!
      })],
    },
  ],
})
```

**Middleware order matters:** Put `authenticate` before `validateAndTransformBody` so authentication happens first.

### Step 1: Create Middleware File

```typescript
// api/store/[feature]/middlewares.ts
import { MiddlewareRoute, validateAndTransformBody } from "@medusajs/framework"
import { z } from "zod"

export const CreateMySchema = z.object({
  email: z.string().email(),
  name: z.string().min(2),
  // other fields
})

// Export the inferred type for use in route handlers
export type CreateMySchema = z.infer<typeof CreateMySchema>

export const myMiddlewares: MiddlewareRoute[] = [
  {
    matcher: "/store/my-route",
    method: "POST",
    middlewares: [validateAndTransformBody(CreateMySchema)],
  },
]
```

### Step 2: Register in api/middlewares.ts

```typescript
// api/middlewares.ts
import { defineMiddlewares } from "@medusajs/framework/http"
import { myMiddlewares } from "./store/[feature]/middlewares"

export default defineMiddlewares({
  routes: [...myMiddlewares],
})
```

**⚠️ CRITICAL - Middleware Export Pattern:**

Middlewares are exported as **named arrays**, NOT default exports with config objects:

```typescript
// ✅ CORRECT - Named export of MiddlewareRoute array
// api/store/reviews/middlewares.ts
export const reviewMiddlewares: MiddlewareRoute[] = [
  {
    matcher: "/store/reviews",
    method: "POST",
    middlewares: [validateAndTransformBody(CreateReviewSchema)],
  },
]

// ✅ CORRECT - Import and spread the named array
// api/middlewares.ts
import { reviewMiddlewares } from "./store/reviews/middlewares"

export default defineMiddlewares({
  routes: [...reviewMiddlewares],
})
```

```typescript
// ❌ WRONG - Don't use default export with .config
// api/store/reviews/middlewares.ts
export default {
  config: {
    routes: [...], // This is NOT the middleware pattern!
  },
}

// ❌ WRONG - Don't access .config.routes
// api/middlewares.ts
import reviewMiddlewares from "./store/reviews/middlewares"
export default defineMiddlewares({
  routes: [...reviewMiddlewares.config.routes], // This doesn't work!
})
```

**Why this matters:**
- Middleware files export arrays directly, not config objects
- Route files (like `route.ts`) use `export const config = defineRouteConfig(...)`
- Don't confuse the two patterns - middlewares are simpler (just an array)

### Step 3: Use Typed req.validatedBody in Route

**⚠️ CRITICAL**: When using `req.validatedBody`, you MUST pass the inferred Zod schema type as a type argument to `MedusaRequest`. Otherwise, you'll get TypeScript errors when accessing `req.validatedBody`.

```typescript
// api/store/my-route/route.ts
import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { CreateMySchema } from "./middlewares"

// ✅ CORRECT: Pass the Zod schema type as type argument
export async function POST(
  req: MedusaRequest<CreateMySchema>,
  res: MedusaResponse
) {
  // Now req.validatedBody is properly typed
  const { email, name } = req.validatedBody

  // ... rest of implementation
}

// ❌ WRONG: Without type argument, req.validatedBody will have type errors
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const { email, name } = req.validatedBody // Type error!
}
```

## Query Parameter Validation

For API routes that accept query parameters, use the `validateAndTransformQuery` middleware to validate them.

**⚠️ IMPORTANT**: When using `validateAndTransformQuery`, access query parameters via `req.validatedQuery` instead of `req.query`.

### Step 1: Create Validation Schema

Create a Zod schema for the query parameters. Since query parameters are originally strings or arrays of strings, use `z.preprocess` to transform them to other types:

```typescript
// api/custom/validators.ts
import { z } from "zod"

export const GetMyRouteSchema = z.object({
  cart_id: z.string(), // String parameters don't need preprocessing
  limit: z.preprocess(
    (val) => {
      if (val && typeof val === "string") {
        return parseInt(val)
      }
      return val
    },
    z.number().optional()
  ),
  status: z.enum(["active", "pending", "completed"]).optional(),
})
```

### Step 2: Add Middleware

```typescript
// api/middlewares.ts
import {
  validateAndTransformQuery,
  defineMiddlewares,
} from "@medusajs/framework/http"
import { GetMyRouteSchema } from "./custom/validators"

export default defineMiddlewares({
  routes: [
    {
      matcher: "/store/my-route",
      method: "GET",
      middlewares: [
        validateAndTransformQuery(GetMyRouteSchema, {}),
      ],
    },
  ],
})
```

### Step 3: Use Validated Query in Route

```typescript
// api/store/my-route/route.ts
import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  // Access validated query parameters (not req.query!)
  const { cart_id, limit, status } = req.validatedQuery

  // cart_id is string, limit is number, status is enum
  const query = req.scope.resolve("query")

  const { data } = await query.graph({
    entity: "my_entity",
    fields: ["id", "name"],
    filters: { cart_id, status },
  })

  return res.json({ items: data })
}
```

## Request Query Config for List Endpoints

**⚠️ BEST PRACTICE**: For API routes that retrieve lists of resources, use request query config to allow clients to control fields, pagination, and ordering.

This pattern:
- Allows clients to specify which fields/relations to retrieve
- Enables client-controlled pagination
- Supports custom ordering
- Provides sensible defaults

### Step 1: Add Middleware with createFindParams

```typescript
// api/middlewares.ts
import {
  validateAndTransformQuery,
  defineMiddlewares,
} from "@medusajs/framework/http"
import { createFindParams } from "@medusajs/medusa/api/utils/validators"

// createFindParams() generates a schema that accepts:
// - fields: Select specific fields/relations
// - offset: Skip N items
// - limit: Max items to return
// - order: Order by field(s) ASC/DESC
export const GetProductsSchema = createFindParams()

export default defineMiddlewares({
  routes: [
    {
      matcher: "/store/products",
      method: "GET",
      middlewares: [
        validateAndTransformQuery(
          GetProductsSchema,
          {
            defaults: [
              "id",
              "title",
              "variants.*", // Include all variant fields by default
            ],
            isList: true, // Indicates this returns a list
            defaultLimit: 15, // Default pagination limit
          }
        ),
      ],
    },
  ],
})
```

**Configuration Options:**
- `defaults`: Array of default fields and relations to retrieve
- `isList`: Boolean indicating if this returns a list (affects pagination)
- `allowed`: (Optional) Array of fields/relations allowed in the `fields` query param
- `defaultLimit`: (Optional) Default limit if not provided (default: 50)

### Step 2: Use Query Config in Route

**⚠️ CRITICAL**: When using `req.queryConfig`, do NOT explicitly set the `fields` property in your query. The `queryConfig` already contains the fields configuration, and setting it explicitly will cause TypeScript errors.

```typescript
// api/store/products/route.ts
import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const query = req.scope.resolve("query")

  // ✅ CORRECT: Only use ...req.queryConfig (includes fields, pagination, etc.)
  const { data: products } = await query.graph({
    entity: "product",
    ...req.queryConfig, // Contains fields, select, limit, offset, order
  })

  return res.json({ products })
}

// ❌ WRONG: Don't set fields explicitly when using queryConfig
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const query = req.scope.resolve("query")

  const { data: products } = await query.graph({
    entity: "product",
    fields: ["id", "title"], // ❌ Type error! queryConfig already sets fields
    ...req.queryConfig,
  })

  return res.json({ products })
}
```

**If you need additional filters**, only add those - not fields:

```typescript
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const query = req.scope.resolve("query")
  const { id } = req.params

  // ✅ CORRECT: Add filters while using queryConfig
  const { data: products } = await query.graph({
    entity: "product",
    filters: { id }, // Additional filters are OK
    ...req.queryConfig, // Fields come from here
  })

  return res.json({ products })
}
```

### Step 3: Client Usage Examples

Clients can now control the API response:

```typescript
// Default response (uses middleware defaults)
GET /store/products
// Returns: id, title, variants.*

// Custom fields selection
GET /store/products?fields=id,title,description
// Returns: only id, title, description

// Pagination
GET /store/products?limit=10&offset=20
// Returns: 10 items, skipping first 20

// Ordering
GET /store/products?order=title
// Returns: products ordered by title ascending

GET /store/products?order=-created_at
// Returns: products ordered by created_at descending (- prefix)

// Combined
GET /store/products?fields=id,title,brand.*&limit=5&order=-created_at
// Returns: 5 items with custom fields, newest first
```

### Advanced: Custom Query Param + Query Config

You can combine custom query parameters with query config:

```typescript
// validators.ts
import { z } from "zod"
import { createFindParams } from "@medusajs/medusa/api/utils/validators"

export const GetProductsSchema = createFindParams().merge(
  z.object({
    category_id: z.string().optional(),
    in_stock: z.preprocess(
      (val) => val === "true",
      z.boolean().optional()
    ),
  })
)
```

```typescript
// route.ts
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const query = req.scope.resolve("query")
  const { category_id, in_stock } = req.validatedQuery

  const filters: any = {}
  if (category_id) filters.category_id = category_id
  if (in_stock !== undefined) filters.in_stock = in_stock

  const { data: products } = await query.graph({
    entity: "product",
    filters,
    ...req.queryConfig, // Still get fields, pagination, order
  })

  return res.json({ products })
}
```

## Import Organization

**⚠️ CRITICAL**: Always import workflows, modules, and other dependencies at the TOP of the file, never inside the route handler function body.

### ✅ CORRECT - Imports at Top

```typescript
// api/store/reviews/route.ts
import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { createReviewWorkflow } from "../../../workflows/create-review"
import { CreateReviewSchema } from "./middlewares"

export async function POST(
  req: MedusaRequest<CreateReviewSchema>,
  res: MedusaResponse
) {
  const { result } = await createReviewWorkflow(req.scope).run({
    input: req.validatedBody
  })

  return res.json({ review: result })
}
```

### ❌ WRONG - Dynamic Imports in Route Body

```typescript
// api/store/reviews/route.ts
import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  // ❌ WRONG: Don't use dynamic imports in route handlers
  const { createReviewWorkflow } = await import("../../../workflows/create-review")

  const { result } = await createReviewWorkflow(req.scope).run({
    input: req.validatedBody
  })

  return res.json({ review: result })
}
```

**Why this matters:**
- Dynamic imports add unnecessary overhead to every request
- Makes code harder to read and maintain
- Breaks static analysis and TypeScript checking
- Can cause module resolution issues in production

## API Route Structure

**⚠️ IMPORTANT**: Medusa uses only GET, POST and DELETE as a convention.
- **GET** for reads
- **POST** for mutations (create/update)
- **DELETE** for deletions

Don't use PUT or PATCH.

### Basic API Route

```typescript
// api/store/my-route/route.ts
import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const query = req.scope.resolve("query")

  // Query data
  const { data: items } = await query.graph({
    entity: "entity_name",
    fields: ["id", "name"],
  })

  return res.status(200).json({ items })
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const { field } = req.validatedBody

  // Execute workflow (mutations should always use workflows)
  const { result } = await myWorkflow(req.scope).run({
    input: { field },
  })

  return res.status(200).json({ result })
}
```

### Accessing Request Data

```typescript
// Validated body (from middleware)
const { email, name } = req.validatedBody

// Query parameters
const { page, limit } = req.query

// Route parameters
const { id } = req.params

// Resolve services
const query = req.scope.resolve("query")
const myService = req.scope.resolve("my-module")
```

## Error Handling

Use `MedusaError` for consistent error responses:

```typescript
import { MedusaError } from "@medusajs/framework/utils"

// Not found
throw new MedusaError(MedusaError.Types.NOT_FOUND, "Resource not found")

// Invalid data
throw new MedusaError(MedusaError.Types.INVALID_DATA, "Invalid input provided")

// Unauthorized
throw new MedusaError(MedusaError.Types.UNAUTHORIZED, "Authentication required")

// Conflict
throw new MedusaError(MedusaError.Types.CONFLICT, "Resource already exists")

// Other types: INVALID_STATE, NOT_ALLOWED, DUPLICATE_ERROR
```

### Error Response Format

Medusa automatically formats errors:

```json
{
  "type": "not_found",
  "message": "Resource not found"
}
```

## Protected Routes

### Default Protected Routes

All routes under these prefixes are automatically protected:
- `/admin/*` - Requires authenticated admin user
- `/store/customers/me/*` - Requires authenticated customer

### Custom Protected Routes

To protect routes under different prefixes, use the `authenticate` middleware:

```typescript
// api/middlewares.ts
import {
  defineMiddlewares,
  authenticate,
} from "@medusajs/framework/http"

export default defineMiddlewares({
  routes: [
    // Only allow authenticated admin users
    {
      matcher: "/custom/admin*",
      middlewares: [authenticate("user", ["session", "bearer", "api-key"])],
    },
    // Only allow authenticated customers
    {
      matcher: "/store/reviews*",
      middlewares: [authenticate("customer", ["session", "bearer"])],
    },
  ],
})
```

### Accessing Authenticated User

**⚠️ CRITICAL**: For routes protected with `authenticate` middleware, you MUST use `AuthenticatedMedusaRequest` instead of `MedusaRequest` to avoid type errors when accessing `req.auth_context.actor_id`.

```typescript
import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"

// ✅ CORRECT - Use AuthenticatedMedusaRequest for protected routes
export async function POST(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) {
  // For admin routes
  const userId = req.auth_context.actor_id // Admin user ID

  // For customer routes
  const customerId = req.auth_context.actor_id // Customer ID

  // Your logic here
}

// ❌ WRONG - Don't use MedusaRequest for protected routes
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const userId = req.auth_context.actor_id // Type error!
}
```

**See [authentication.md](authentication.md) for complete authentication patterns.**

## Using Workflows in API Routes

**⚠️ BEST PRACTICE**: Workflows are the standard way to perform mutations (create, update, delete) in Medusa. API routes should execute workflows and return their response.

### Example: Create Workflow

```typescript
import { createCustomersWorkflow } from "@medusajs/medusa/core-flows"

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const { email } = req.validatedBody

  const { result } = await createCustomersWorkflow(req.scope).run({
    input: {
      customersData: [
        {
          email,
          has_account: false,
        },
      ],
    },
  })

  return res.json({ customer: result[0] })
}
```

### Example: Custom Workflow

```typescript
import { myCustomWorkflow } from "../../workflows/my-workflow"

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const { data } = req.validatedBody

  try {
    const { result } = await myCustomWorkflow(req.scope).run({
      input: { data },
    })

    return res.json({ result })
  } catch (error) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      error.message
    )
  }
}
```

## Common Built-in Workflows

Ask MedusaDocs for specific workflow names and their input parameters:
- Customer workflows: create, update, delete customers
- Product workflows: create, update, delete products
- Order workflows: create, cancel, fulfill orders
- Cart workflows: create, update, complete carts
- And many more...

## API Route Organization

Organize routes by feature or domain:

```
src/api/
├── admin/
│   ├── custom-reports/
│   │   ├── route.ts
│   │   └── middlewares.ts
│   └── bulk-operations/
│       ├── route.ts
│       └── middlewares.ts
└── store/
    ├── newsletter/
    │   ├── route.ts
    │   └── middlewares.ts
    └── reviews/
        ├── route.ts
        ├── [id]/
        │   └── route.ts
        └── middlewares.ts
```

## Common Patterns

### Pattern: List with Query Config (Recommended)

```typescript
// middlewares.ts
import { validateAndTransformQuery } from "@medusajs/framework/http"
import { createFindParams } from "@medusajs/medusa/api/utils/validators"

export const GetMyEntitiesSchema = createFindParams()

export default defineMiddlewares({
  routes: [
    {
      matcher: "/store/my-entities",
      method: "GET",
      middlewares: [
        validateAndTransformQuery(GetMyEntitiesSchema, {
          defaults: ["id", "name", "created_at"],
          isList: true,
          defaultLimit: 15,
        }),
      ],
    },
  ],
})

// route.ts
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const query = req.scope.resolve("query")

  const { data, metadata } = await query.graph({
    entity: "my_entity",
    ...req.queryConfig, // Handles fields, pagination automatically
  })

  return res.json({
    items: data,
    count: metadata.count,
    limit: req.queryConfig.pagination.take,
    offset: req.queryConfig.pagination.skip,
  })
}
```

### Pattern: Retrieve Single Resource with Relations

```typescript
// For single resource endpoints, you can still use query config
// middlewares.ts
export const GetMyEntitySchema = createFindParams()

export default defineMiddlewares({
  routes: [
    {
      matcher: "/store/my-entities/:id",
      method: "GET",
      middlewares: [
        validateAndTransformQuery(GetMyEntitySchema, {
          defaults: ["id", "name", "variants.*", "brand.*"],
          isList: false, // Single resource
        }),
      ],
    },
  ],
})

// route.ts
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const query = req.scope.resolve("query")
  const { id } = req.params

  const { data } = await query.graph({
    entity: "my_entity",
    filters: { id },
    ...req.queryConfig,
  })

  if (!data || data.length === 0) {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, "Resource not found")
  }

  return res.json({ item: data[0] })
}
```

### Pattern: Search with Custom Filters + Query Config

```typescript
// validators.ts
export const GetMyEntitiesSchema = createFindParams().merge(
  z.object({
    q: z.string().optional(), // Search query
    status: z.enum(["active", "pending", "completed"]).optional(),
  })
)

// middlewares.ts
export default defineMiddlewares({
  routes: [
    {
      matcher: "/store/my-entities",
      method: "GET",
      middlewares: [
        validateAndTransformQuery(GetMyEntitiesSchema, {
          defaults: ["id", "name", "status"],
          isList: true,
        }),
      ],
    },
  ],
})

// route.ts
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const query = req.scope.resolve("query")
  const { q, status } = req.validatedQuery

  const filters: any = {}

  if (q) {
    filters.name = { $like: `%${q}%` }
  }

  if (status) {
    filters.status = status
  }

  const { data } = await query.graph({
    entity: "my_entity",
    filters,
    ...req.queryConfig, // Client can still control fields, pagination
  })

  return res.json({ items: data })
}
```

### Pattern: Manual Query (When Query Config Not Needed)

For simple queries where you don't need client-controlled fields/pagination:

```typescript
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const query = req.scope.resolve("query")

  const { data } = await query.graph({
    entity: "my_entity",
    fields: ["id", "name"],
    filters: { status: "active" },
    pagination: {
      take: 10,
      skip: 0,
    },
  })

  return res.json({ items: data })
}
```
