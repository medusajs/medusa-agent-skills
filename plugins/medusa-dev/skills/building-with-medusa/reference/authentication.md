# Authentication in Medusa

Authentication in Medusa secures API routes and ensures only authorized users can access protected resources.

## Contents
- [Default Protected Routes](#default-protected-routes)
- [Authentication Methods](#authentication-methods)
- [Custom Protected Routes](#custom-protected-routes)
- [Accessing Authenticated User](#accessing-authenticated-user)
- [Authentication Patterns](#authentication-patterns)

## Default Protected Routes

Medusa automatically protects certain route prefixes:

### Admin Routes (`/admin/*`)
- **Who can access**: Authenticated admin users only
- **Authentication methods**: Session, Bearer token, API key
- **Example**: `/admin/products`, `/admin/custom-reports`

### Customer Routes (`/store/customers/me/*`)
- **Who can access**: Authenticated customers only
- **Authentication methods**: Session, Bearer token
- **Example**: `/store/customers/me/orders`, `/store/customers/me/addresses`

**These routes require no additional configuration** - authentication is handled automatically by Medusa.

## Authentication Methods

### Session Authentication
- Used after login via email/password
- Cookie-based session management
- Automatically handled by Medusa SDK

### Bearer Token (JWT)
- Token-based authentication
- Passed in `Authorization: Bearer <token>` header
- Used by frontend applications

### API Key
- Admin-only authentication method
- Used for server-to-server communication
- Passed in `x-medusa-access-token` header

## Custom Protected Routes

**⚠️ CRITICAL: Only add `authenticate` middleware to routes OUTSIDE the default prefixes.**

Routes with these prefixes are automatically authenticated - **do NOT add middleware:**
- `/admin/*` - Already requires authenticated admin user
- `/store/customers/me/*` - Already requires authenticated customer

```typescript
// ✅ CORRECT - Custom route needs authenticate middleware
export default defineMiddlewares({
  routes: [
    {
      matcher: "/store/reviews*",  // Not a default protected prefix
      middlewares: [authenticate("customer", ["session", "bearer"])],
    },
  ],
})

// ❌ WRONG - /admin routes are automatically authenticated
export default defineMiddlewares({
  routes: [
    {
      matcher: "/admin/reports*",  // Already protected!
      middlewares: [authenticate("user", ["session", "bearer"])], // Redundant!
    },
  ],
})
```

To protect custom routes outside the default prefixes, use the `authenticate` middleware.

### Protecting Custom Admin Routes

```typescript
// api/middlewares.ts
import {
  defineMiddlewares,
  authenticate,
} from "@medusajs/framework/http"

export default defineMiddlewares({
  routes: [
    {
      matcher: "/custom/admin*",
      middlewares: [
        authenticate("user", ["session", "bearer", "api-key"])
      ],
    },
  ],
})
```

**Parameters:**
- First parameter: `"user"` for admin users, `"customer"` for customers
- Second parameter: Array of allowed authentication methods

### Protecting Custom Customer Routes

```typescript
// api/middlewares.ts
import {
  defineMiddlewares,
  authenticate,
} from "@medusajs/framework/http"

export default defineMiddlewares({
  routes: [
    {
      matcher: "/store/reviews*",
      middlewares: [
        authenticate("customer", ["session", "bearer"])
      ],
    },
  ],
})
```

### Multiple Protected Routes

```typescript
// api/middlewares.ts
export default defineMiddlewares({
  routes: [
    // Protect custom admin routes
    {
      matcher: "/custom/admin*",
      middlewares: [authenticate("user", ["session", "bearer", "api-key"])],
    },
    // Protect custom customer routes
    {
      matcher: "/store/reviews*",
      middlewares: [authenticate("customer", ["session", "bearer"])],
    },
    // Protect wishlist routes
    {
      matcher: "/store/wishlists*",
      middlewares: [authenticate("customer", ["session", "bearer"])],
    },
  ],
})
```

## Accessing Authenticated User

Once a route is protected with the `authenticate` middleware, you can access the authenticated user's information via `req.auth_context`.

**⚠️ CRITICAL - Type Safety**: For protected routes, you MUST use `AuthenticatedMedusaRequest` instead of `MedusaRequest` to avoid type errors when accessing `req.auth_context.actor_id`.

**⚠️ CRITICAL - Manual Validation**: Do NOT manually validate authentication in your route handlers when using the `authenticate` middleware. The middleware already ensures the user is authenticated - manual checks are redundant and indicate a misunderstanding of how middleware works.

### ✅ CORRECT - Using AuthenticatedMedusaRequest

```typescript
// api/store/reviews/[id]/route.ts
// Middleware already applied: authenticate("customer", ["session", "bearer"])
import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { deleteReviewWorkflow } from "../../../../workflows/delete-review"

export async function DELETE(
  req: AuthenticatedMedusaRequest, // ✅ Use AuthenticatedMedusaRequest for protected routes
  res: MedusaResponse
) {
  const { id } = req.params
  // ✅ CORRECT: Just use req.auth_context.actor_id directly
  // The authenticate middleware guarantees this exists
  const customerId = req.auth_context.actor_id // No type error!

  // Pass to workflow - let the workflow handle business logic validation
  const { result } = await deleteReviewWorkflow(req.scope).run({
    input: {
      reviewId: id,
      customerId, // Workflow will validate if review belongs to customer
    },
  })

  return res.json({ success: true })
}
```

### ❌ WRONG - Using MedusaRequest for Protected Routes

```typescript
// api/store/reviews/[id]/route.ts
// Middleware already applied: authenticate("customer", ["session", "bearer"])
import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

export async function DELETE(
  req: MedusaRequest, // ❌ WRONG: Should use AuthenticatedMedusaRequest
  res: MedusaResponse
) {
  const { id } = req.params
  const customerId = req.auth_context.actor_id // ❌ Type error: auth_context might be undefined

  return res.json({ success: true })
}
```

### ❌ WRONG - Manual Authentication Check

```typescript
// api/store/reviews/[id]/route.ts
// Middleware already applied: authenticate("customer", ["session", "bearer"])
import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"

export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  const { id } = req.params

  // ❌ WRONG: Don't manually check if user is authenticated
  // The authenticate middleware already did this!
  if (!req.auth_context?.actor_id) {
    throw new MedusaError(
      MedusaError.Types.UNAUTHORIZED,
      "You must be authenticated"
    )
  }

  const customerId = req.auth_context.actor_id

  // Also wrong: don't validate business logic in routes
  // (see workflows.md for why this should be in the workflow)

  return res.json({ success: true })
}
```

**Why manual checks are wrong:**
- The `authenticate` middleware already validates authentication
- If authentication failed, the request never reaches your handler
- Manual checks suggest you don't trust or understand the middleware
- Adds unnecessary code and potential bugs

### In Admin Routes

```typescript
// api/admin/custom/route.ts
import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"

export async function GET(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  // Get authenticated admin user ID
  const userId = req.auth_context.actor_id

  const logger = req.scope.resolve("logger")
  logger.info(`Request from admin user: ${userId}`)

  // Use userId to filter data or track actions
  // ...

  return res.json({ success: true })
}
```

### In Customer Routes

```typescript
// api/store/reviews/route.ts
import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"

export async function POST(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  // Get authenticated customer ID
  const customerId = req.auth_context.actor_id

  const { product_id, rating, comment } = req.validatedBody

  // Create review associated with the authenticated customer
  const { result } = await createReviewWorkflow(req.scope).run({
    input: {
      customer_id: customerId, // From authenticated context
      product_id,
      rating,
      comment,
    },
  })

  return res.json({ review: result })
}
```

## Authentication Patterns

### Pattern: User-Specific Data

```typescript
// api/admin/my-reports/route.ts
export async function GET(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const userId = req.auth_context.actor_id
  const query = req.scope.resolve("query")

  // Get reports created by this admin user
  const { data: reports } = await query.graph({
    entity: "report",
    fields: ["id", "title", "created_at"],
    filters: {
      created_by: userId,
    },
  })

  return res.json({ reports })
}
```

### Pattern: Ownership Validation

**⚠️ IMPORTANT**: Ownership validation is business logic and should be done in workflow steps, not API routes. The route should only pass the authenticated user ID to the workflow, and the workflow validates ownership.

```typescript
// api/store/reviews/[id]/route.ts
// ✅ CORRECT - Pass user ID to workflow, let workflow validate ownership
export async function DELETE(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const customerId = req.auth_context.actor_id
  const { id } = req.params

  // Pass to workflow - workflow will validate ownership
  const { result } = await deleteReviewWorkflow(req.scope).run({
    input: {
      reviewId: id,
      customerId, // Workflow validates this review belongs to this customer
    },
  })

  return res.json({ success: true })
}

// ❌ WRONG - Don't validate ownership in the route
export async function DELETE(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const customerId = req.auth_context.actor_id
  const { id } = req.params
  const query = req.scope.resolve("query")

  // ❌ WRONG: Don't check ownership in the route
  const { data: reviews } = await query.graph({
    entity: "review",
    fields: ["id", "customer_id"],
    filters: { id },
  })

  if (!reviews || reviews.length === 0) {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, "Review not found")
  }

  if (reviews[0].customer_id !== customerId) {
    throw new MedusaError(MedusaError.Types.NOT_ALLOWED, "Not your review")
  }

  // This bypasses workflow validation
  await deleteReviewWorkflow(req.scope).run({
    input: { id },
  })

  return res.status(204).send()
}
```

**See [workflows.md](workflows.md#business-logic-and-validation-placement) for the complete pattern of validating ownership in workflow steps.**

### Pattern: Customer Profile Routes

```typescript
// api/store/customers/me/wishlist/route.ts
// Automatically protected because it's under /store/customers/me/*

export async function GET(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const customerId = req.auth_context.actor_id
  const query = req.scope.resolve("query")

  // Get customer's wishlist
  const { data: wishlists } = await query.graph({
    entity: "wishlist",
    fields: ["id", "products.*"],
    filters: {
      customer_id: customerId,
    },
  })

  return res.json({ wishlist: wishlists[0] || null })
}

export async function POST(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const customerId = req.auth_context.actor_id
  const { product_id } = req.validatedBody

  // Add product to customer's wishlist
  const { result } = await addToWishlistWorkflow(req.scope).run({
    input: {
      customer_id: customerId,
      product_id,
    },
  })

  return res.json({ wishlist: result })
}
```

### Pattern: Admin Action Tracking

```typescript
// api/admin/products/[id]/archive/route.ts
export async function POST(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const adminUserId = req.auth_context.actor_id
  const { id } = req.params

  // Archive product and track who did it
  const { result } = await archiveProductWorkflow(req.scope).run({
    input: {
      product_id: id,
      archived_by: adminUserId,
      archived_at: new Date(),
    },
  })

  const logger = req.scope.resolve("logger")
  logger.info(`Product ${id} archived by admin user ${adminUserId}`)

  return res.json({ product: result })
}
```

### Pattern: Optional Authentication

Some routes may benefit from authentication but don't require it. Use the `authenticate` middleware with `allowUnauthenticated: true`:

```typescript
// api/middlewares.ts
import {
  defineMiddlewares,
  authenticate,
} from "@medusajs/framework/http"

export default defineMiddlewares({
  routes: [
    {
      matcher: "/store/products/*/reviews",
      middlewares: [
        authenticate("customer", ["session", "bearer"], {
          allowUnauthenticated: true, // Allows access without authentication
        })
      ],
    },
  ],
})
```

```typescript
// api/store/products/[id]/reviews/route.ts
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const customerId = req.auth_context?.actor_id // May be undefined
  const { id } = req.params
  const query = req.scope.resolve("query")

  // Get all reviews
  const { data: reviews } = await query.graph({
    entity: "review",
    fields: ["id", "rating", "comment", "customer_id"],
    filters: {
      product_id: id,
    },
  })

  // If authenticated, mark customer's own reviews
  if (customerId) {
    reviews.forEach(review => {
      review.is_own = review.customer_id === customerId
    })
  }

  return res.json({ reviews })
}
```

## Frontend Integration

### Store (Customer) Authentication

When using the Medusa JS SDK in storefronts:

```typescript
// Frontend code
import { sdk } from "./lib/sdk"

// Login
await sdk.auth.login("customer", "emailpass", {
  email: "customer@example.com",
  password: "password",
})

// SDK automatically includes auth headers in subsequent requests
const { customer } = await sdk.store.customer.retrieve()

// Access protected routes
const { orders } = await sdk.store.customer.listOrders()
```

### Admin Authentication

When using the Medusa JS SDK in admin applications:

```typescript
// Admin frontend code
import { sdk } from "./lib/sdk"

// Login
await sdk.auth.login("user", "emailpass", {
  email: "admin@example.com",
  password: "password",
})

// SDK automatically includes JWT in Authorization header
const { products } = await sdk.admin.product.list()
```

## Security Best Practices

### 1. Use Actor ID from Context

```typescript
// ✅ GOOD: Uses authenticated context
const customerId = req.auth_context.actor_id

// ❌ BAD: Takes user ID from request
const { customer_id } = req.validatedBody // ❌ Can be spoofed
```

### 2. Appropriate Authentication Methods

```typescript
// ✅ GOOD: Admin routes support all methods
authenticate("user", ["session", "bearer", "api-key"])

// ✅ GOOD: Customer routes use session/bearer only
authenticate("customer", ["session", "bearer"])

// ❌ BAD: Customer routes with API key
authenticate("customer", ["api-key"]) // API keys are for admin only
```

### 3. Don't Expose Sensitive Data

```typescript
// ✅ GOOD: Filters sensitive fields
export async function GET(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const customerId = req.auth_context.actor_id

  const customer = await getCustomer(customerId)

  // Remove sensitive data before sending
  delete customer.password_hash
  delete customer.metadata?.internal_notes

  return res.json({ customer })
}
```
