# Creating Workflows

Workflows are the standard way to perform mutations (create, update, delete) in modules in Medusa. If you have built a custom module and need to perform mutations on models in the module, you should create a workflow.

## Creating Workflows - Implementation Checklist

**IMPORTANT FOR CLAUDE CODE**: When implementing workflows, use the TodoWrite tool to track your progress through these steps. This ensures you don't miss any critical steps and provides visibility to the user.

Create these tasks in your todo list:

- Define the input type for your workflow
- Create step function (one mutation per step)
- Add compensation function to steps for rollback
- Create workflow composition function
- Follow workflow composition rules (no async, no arrow functions, etc.)
- Return WorkflowResponse with results
- Test idempotency (workflow can be retried safely)
- **CRITICAL: Run build to validate implementation** (catches type errors and issues)

## Basic Workflow Structure

**File Organization:**
- **Recommended**: Create workflow steps in `src/workflows/steps/[step-name].ts`
- Workflow composition functions go in `src/workflows/[workflow-name].ts`
- This keeps steps reusable and organized

```typescript
// src/workflows/steps/create-my-model.ts
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"

type Input = {
  my_key: string
}

// Note: a step should only do one mutation this ensures rollback mechanisms work
// For workflows that retry build your steps to be idempotent
export const createMyModelStep = createStep(
  "create-my-model",
  async (input: Input, { container }) => {
    const myModule = container.resolve("my")

    const [newMy] = await myModule.createMyModels({
      ...input,
    })

    return new StepResponse(
      newMy,
      newMy.id // explicit compensation input - otherwise defaults to step's output
    )
  },
  // Optional compensation function
  async (id, { container }) => {
    const myModule = container.resolve("my")
    await myModule.deleteMyModels(id)
  }
)

// src/workflows/create-my-model.ts
import { createWorkflow, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import { createMyModelStep } from "./steps/create-my-model"

type Input = {
  my_key: string
}

const createMyModel = createWorkflow(
  "create-my-model",
  // Note: See "Workflow Composition Rules" section below for important constraints
  // The workflow function must be a regular synchronous function (not async/arrow)
  // No direct variable manipulation, conditionals, or date creation - use transform/when instead
  function (input: Input) {
    const newMy = createMyModelStep(input)

    return new WorkflowResponse({
      newMy,
    })
  }
)

export default createMyModel
```

## Workflow Composition Rules

The workflow composition function runs at application load time and has important limitations:

### Function Declaration
- ✅ Use regular synchronous functions
- ❌ No `async` functions
- ❌ No arrow functions (use `function` keyword)

### Using Steps Multiple Times

**⚠️ CRITICAL**: When using the same step multiple times in a workflow, you MUST rename each invocation AFTER the first invocation using `.config()` to avoid conflicts.

```typescript
// ✅ CORRECT - Rename each step invocation with .config()
export const processCustomersWorkflow = createWorkflow(
  "process-customers",
  function (input) {
    const customers = transform({ ids: input.customer_ids }, (input) => input.ids)

    // First invocation - no need to rename
    const customer1 = fetchCustomerStep(customers[0])

    // Second invocation - different name
    const customer2 = fetchCustomerStep(customers[1]).config({
      name: "fetch-customer-2"
    })

    const result = transform({ customer1, customer2 }, (data) => ({
      customers: [data.customer1, data.customer2]
    }))

    return new WorkflowResponse(result)
  }
)

// ❌ WRONG - Calling the same step multiple times without renaming
export const processCustomersWorkflow = createWorkflow(
  "process-customers",
  function (input) {
    const customers = transform({ ids: input.customer_ids }, (input) => input.ids)

    // This will cause runtime errors - duplicate step names
    const customer1 = fetchCustomerStep(customers[0])
    const customer2 = fetchCustomerStep(customers[1]) // ❌ Conflict!

    return new WorkflowResponse({ customers: [customer1, customer2] })
  }
)
```

**Why this matters:**
- Medusa uses step names to track execution state
- Duplicate names cause conflicts in the workflow execution engine
- Each step invocation needs a unique identifier
- The workflow will fail at runtime if steps aren't renamed

### Variable Operations
- ❌ No direct variable manipulation or concatenation → Use `transform({ in }, ({ in }) => \`Transformed: ${in}\`)` instead
- Variables lack values until execution time - all operations must use `transform()`

### Date/Time Operations
- ❌ No `new Date()` (will be fixed to load time) → Wrap in `transform()` for execution-time evaluation

### Conditional Logic
- ❌ No `if`/`else` statements → Use `when(input, (input) => input.is_active).then(() => { /* steps */ })` instead
- ❌ No ternary operators (`? :`) → Use `transform()` instead
- ❌ No nullish coalescing (`??`) → Use `transform()` instead
- ❌ No logical OR (`||`) → Use `transform()` instead
- ❌ No optional chaining (`?.`) → Use `transform()` instead
- ❌ No double negation (`!!`) → Use `transform()` instead

### Error Handling
- ❌ No `try-catch` blocks → See error handling patterns in Medusa documentation

### Return Values
- ✅ Only return serializable values (primitives, plain objects)
- ❌ No non-serializable types (Maps, Sets, etc.)
- For buffers: Return as object property, then recreate with `Buffer.from()` when processing results

## Step Best Practices

1. **One mutation per step**: Ensures rollback mechanisms work correctly
2. **Idempotency**: Design steps to be safely retryable
3. **Explicit compensation input**: Specify what data the compensation function needs if different from step output
4. **Return StepResponse**: Always wrap your return value in `StepResponse`

## Reusing Built-in Medusa Steps

**⚠️ IMPORTANT**: Before creating custom steps, check if Medusa provides a built-in step for your use case. Reusing built-in steps is preferred over creating custom ones.

### Common Built-in Steps to Reuse

**Creating Links Between Modules:**

**⚠️ CRITICAL - Link Order (Direction):** When creating links, the order of modules in `createRemoteLinkStep` MUST match the order in `defineLink()`. Mismatched order causes runtime errors.

```typescript
// Link definition in src/links/review-product.ts
import { defineLink } from "@medusajs/framework/utils"
import ReviewModule from "../modules/review"
import ProductModule from "@medusajs/medusa/product"

// Order: review FIRST, then product
export default defineLink(
  {
    linkable: ReviewModule.linkable.review,
    isList: true,
  },
  ProductModule.linkable.product
)
```

```typescript
// ✅ CORRECT - Order matches defineLink (review first, then product)
import { createRemoteLinkStep } from "@medusajs/medusa/core-flows"
import { createWorkflow, transform, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import { Modules } from "@medusajs/framework/utils"
import { REVIEW_MODULE } from "../modules/review"

export const createReviewWorkflow = createWorkflow(
  "create-review",
  function (input) {
    const review = createReviewStep(input)

    // Order MUST match defineLink: review first, then product
    const linkData = transform({ review, input }, ({ review, input }) => [{
      [REVIEW_MODULE]: {
        review_id: review.id,
      },
      [Modules.PRODUCT]: {
        product_id: input.product_id,
      },
    }])

    createRemoteLinkStep(linkData)

    return new WorkflowResponse({ review })
  }
)

// ❌ WRONG - Order doesn't match defineLink (product first, then review)
const linkData = transform({ review, input }, ({ review, input }) => [{
  [Modules.PRODUCT]: {
    product_id: input.product_id,
  },
  [REVIEW_MODULE]: {
    review_id: review.id,
  },
}]) // Runtime error: link direction mismatch!
```

```typescript
// ❌ WRONG - Don't create custom link steps
const createReviewLinkStep = createStep(
  "create-review-link",
  async ({ reviewId, productId }, { container }) => {
    const link = container.resolve("link")
    await link.create({
      product: { product_id: productId },
      review: { review_id: reviewId },
    })
    // This duplicates functionality that createRemoteLinkStep provides
  }
)
```

**Removing Links:**

```typescript
// ✅ CORRECT - Use Medusa's built-in dismissRemoteLinkStep
import { dismissRemoteLinkStep } from "@medusajs/medusa/core-flows"

export const deleteReviewWorkflow = createWorkflow(
  "delete-review",
  function (input) {
    const linkData = transform({ input }, ({ input }) => [{
      [Modules.PRODUCT]: { product_id: input.product_id },
      review: { review_id: input.review_id },
    }])

    dismissRemoteLinkStep(linkData)
    deleteReviewStep(input)

    return new WorkflowResponse({ success: true })
  }
)
```

**Querying Data in Workflows:**

```typescript
// ✅ CORRECT - Use Medusa's built-in useQueryGraphStep
import { useQueryGraphStep } from "@medusajs/medusa/core-flows"
import { createWorkflow, WorkflowResponse } from "@medusajs/framework/workflows-sdk"

export const getProductReviewsWorkflow = createWorkflow(
  "get-product-reviews",
  function (input) {
    // Query product with reviews using built-in step
    const { data: products } = useQueryGraphStep({
      entity: "product",
      fields: ["id", "title", "reviews.*"],
      filters: {
        id: input.product_id,
      },
    })

    return new WorkflowResponse({ product: products[0] })
  }
)

// ❌ WRONG - Don't create custom query steps
const queryProductStep = createStep(
  "query-product",
  async ({ productId }, { container }) => {
    const query = container.resolve("query")
    const { data } = await query.graph({
      entity: "product",
      fields: ["id", "title", "reviews.*"],
      filters: { id: productId },
    })
    return new StepResponse(data[0])
  }
)
// This duplicates functionality that useQueryGraphStep provides
```

**Why reuse built-in steps:**
- Already tested and optimized by Medusa
- Handles edge cases and error scenarios
- Maintains consistency with Medusa's internal workflows
- Includes proper compensation/rollback logic
- Less code to maintain

**Other common built-in steps to look for:**
- Event emission steps
- Notification steps
- Inventory management steps
- Payment processing steps

Check Medusa documentation or `@medusajs/medusa/core-flows` for available built-in steps before creating custom ones.

## Business Logic and Validation Placement

**CRITICAL**: All business logic and validation must be performed inside workflow steps, NOT in API routes.

### ✅ CORRECT - Validation in Workflow Step

```typescript
// src/workflows/steps/delete-review.ts
export const deleteReviewStep = createStep(
  "delete-review",
  async ({ reviewId, customerId }: Input, { container }) => {
    const reviewModule = container.resolve("review")

    // Validation happens inside the step
    const review = await reviewModule.retrieveReview(reviewId)

    if (review.customer_id !== customerId) {
      throw new MedusaError(
        MedusaError.Types.NOT_ALLOWED,
        "You can only delete your own reviews"
      )
    }

    await reviewModule.deleteReviews(reviewId)

    return new StepResponse({ id: reviewId }, reviewId)
  },
  async (reviewId, { container }) => {
    // Compensation: restore the review if needed
  }
)
```

### ❌ WRONG - Validation in API Route

```typescript
// src/api/store/reviews/[id]/route.ts
export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  const { id } = req.params
  const customerId = req.auth_context.actor_id

  // ❌ WRONG: Don't validate business rules in the route
  const reviewModule = req.scope.resolve("review")
  const review = await reviewModule.retrieveReview(id)

  if (review.customer_id !== customerId) {
    throw new MedusaError(MedusaError.Types.NOT_ALLOWED, "Not your review")
  }

  // ❌ WRONG: Don't call workflows after manual validation
  const { result } = await deleteReviewWorkflow(req.scope).run({
    input: { reviewId: id }
  })
}
```

**Why this matters:**
- Workflows are the single source of truth for business logic
- Validation in routes bypasses workflow rollback mechanisms
- Makes testing harder and logic harder to reuse
- Breaks the Module → Workflow → API Route architecture

## Advanced Features

Workflows have advanced options to define retries, async behavior, pausing for human confirmation, and much more. Ask MedusaDocs for more details if these are relevant to your use case.
