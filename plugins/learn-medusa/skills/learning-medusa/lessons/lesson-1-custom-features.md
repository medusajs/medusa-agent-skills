# Lesson 1: Build Custom Features with Medusa

## Learning Objectives

By the end of this lesson, you will:

- **Understand** the Module → Workflow → API Route architecture
- **Create** a Brand Module with data model and service
- **Implement** createBrandWorkflow with rollback logic
- **Expose** POST /admin/brands API route with validation
- **Test** your custom feature using cURL

**Time**: 45-60 minutes

## Architecture Overview: The Three-Layer Pattern

Before we start coding, let's understand **why** Medusa uses this layered architecture.

### The Pattern

Every custom feature in Medusa follows this flow:

```
┌─────────────────────────────────────────────────┐
│  API Route (HTTP Interface)                     │
│  - Accepts requests                             │
│  - Validates input                              │
│  - Executes workflow                            │
│  - Returns response                             │
└─────────────────┬───────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────┐
│  Workflow (Business Logic Orchestration)        │
│  - Coordinates steps                            │
│  - Handles rollback                             │
│  - Manages transactions                         │
└─────────────────┬───────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────┐
│  Module (Data Layer)                            │
│  - Defines data models                          │
│  - Provides CRUD operations                     │
│  - Isolated from other modules                  │
└─────────────────────────────────────────────────┘
```

### Why This Pattern?

**Separation of Concerns**: Each layer has one responsibility
- API routes handle HTTP concerns (validation, serialization)
- Workflows handle business logic (orchestration, rollback)
- Modules handle data (CRUD, database)

**Reusability**: Workflows can be called from:
- Multiple API routes
- Other workflows
- Scheduled jobs
- Event subscribers

**Testability**: Each layer can be tested independently

**Consistency**: All features follow the same pattern

**Documentation**: [Learn more about Medusa Architecture](https://docs.medusajs.com/learn/introduction/architecture)

---

## What We're Building

In this lesson, we'll build a brands feature that allows admin users to create brands via an API endpoint.

**Features**:
- Create a `brand` table in the database
- Provide methods to manage brands (create, retrieve, update, delete)
- Expose POST /admin/brands endpoint to create brands
- Include validation and error handling
- Add rollback logic if errors occur

**By the end**, you'll be able to:
```bash
curl -X POST 'http://localhost:9000/admin/brands' \
  -H 'Authorization: Bearer {token}' \
  --data '{ "name": "Acme" }'
```

And get back:
```json
{
  "brand": {
    "id": "brand_123",
    "name": "Acme",
    "created_at": "2024-01-16T...",
    "updated_at": "2024-01-16T..."
  }
}
```

Let's start!

---

## Part 1: Create the Brand Module

### What is a Module?

A **Module** is a reusable package of functionality for a single domain. Think of it as a mini-application within Medusa that:

- Defines data models (tables in the database)
- Provides a service with CRUD methods
- Is isolated from other modules (no direct dependencies)

Medusa comes with built-in modules like:
- **Product Module**: Manages products, variants, options
- **Cart Module**: Manages shopping carts
- **Customer Module**: Manages customers

We're creating a **Brand Module** for managing brands.

**Documentation**: [Modules Guide](https://docs.medusajs.com/learn/fundamentals/modules)

### Step 1.1: Create Module Directory

Create the directory structure for the Brand Module:

```bash
mkdir -p src/modules/brand/models
```

**Why this structure?**
- Modules MUST be in `src/modules/`
- Data models MUST be in a `models/` subdirectory
- Medusa auto-discovers modules in this structure

### Step 1.2: Create Brand Data Model

A **data model** represents a table in the database. We use Medusa's Data Model Language (DML) to define it.

Create `src/modules/brand/models/brand.ts`:

```typescript
import { model } from "@medusajs/framework/utils"

export const Brand = model.define("brand", {
  id: model.id().primaryKey(),
  name: model.text(),
})
```

**Let's break this down**:

1. **`model.define("brand", { ... })`**:
   - First arg: Table name in database (use snake-case)
   - Second arg: Schema definition (columns)

2. **`id: model.id().primaryKey()`**:
   - Creates a primary key column
   - Auto-generates unique IDs

3. **`name: model.text()`**:
   - Creates a text column for the brand name

**What about timestamps?**
Medusa automatically adds `created_at`, `updated_at`, and `deleted_at` columns!

**What about linkable()?**
Don't add `.linkable()` manually - Medusa adds it automatically. This is a common mistake!

**Documentation**: [Data Models Guide](https://docs.medusajs.com/learn/fundamentals/data-models)

### Step 1.3: Create Module Service

The **service** is the interface to your module's functionality. It provides methods to manage your data models.

Create `src/modules/brand/service.ts`:

```typescript
import { MedusaService } from "@medusajs/framework/utils"
import { Brand } from "./models/brand"

class BrandModuleService extends MedusaService({
  Brand,
}) {
  // Methods are auto-generated! No code needed here.
}

export default BrandModuleService
```

**What's happening here?**

`MedusaService({ Brand })` **generates** these methods automatically:
- `createBrands(data)` - Create one or more brands
- `retrieveBrand(id, config)` - Get a brand by ID
- `listBrands(filters, config)` - List brands with filters
- `updateBrands(id, data)` - Update a brand
- `deleteBrands(id)` - Delete a brand
- `softDeleteBrands(id)` - Soft delete (sets deleted_at)
- `restoreBrands(id)` - Restore soft-deleted brand
- `listAndCountBrands(filters, config)` - List with total count

You get all of these for free!

**Can you add custom methods?**
Yes! Add them inside the class body. But for basic CRUD, the generated methods are sufficient.

**Documentation**: [Service Factory Reference](https://docs.medusajs.com/resources/service-factory-reference)

### Step 1.4: Export Module Definition

Every module must export a definition that tells Medusa:
- The module's name
- The module's main service

Create `src/modules/brand/index.ts`:

```typescript
import { Module } from "@medusajs/framework/utils"
import BrandModuleService from "./service"

export const BRAND_MODULE = "brand"

export default Module(BRAND_MODULE, {
  service: BrandModuleService,
})
```

**Key points**:

1. **Module name MUST be camelCase**: "brand" ✓, "brand-module" ✗
   - Using dashes will cause runtime errors!

2. **Export `BRAND_MODULE` constant**: Makes it easy to reference reliably elsewhere

3. **`Module()` creates the definition**: Registers the service with Medusa

### Step 1.5: Register Module in Config

Medusa needs to know about your custom module. Add it to `medusa-config.ts`:

```typescript
module.exports = defineConfig({
  // ... existing config
  modules: [
    {
      resolve: "./src/modules/brand",
    },
  ],
})
```

**What if I already have a modules array?**
Add your module to the existing array:

```typescript
modules: [
  {
    resolve: "./src/modules/existing",
  },
  {
    resolve: "./src/modules/brand", // Add this
  },
],
```

### Step 1.6: Generate and Run Migrations

A **migration** is a file that defines database changes. It ensures your module is reusable and makes team collaboration smooth.

Run these commands:

```bash
npx medusa db:generate brand
npx medusa db:migrate
```

**What do these do?**

1. **`db:generate brand`**: Creates a migration file for the Brand Module
   - Looks at your data models
   - Generates SQL to create the `brand` table
   - Saves it in `src/migrations/`

2. **`db:migrate`**: Runs all pending migrations
   - Executes the SQL against your database
   - Creates the `brand` table with columns: `id`, `name`, `created_at`, `updated_at`, `deleted_at`

**Documentation**: [Migrations Guide](https://docs.medusajs.com/learn/fundamentals/data-models/write-migration)

---

## Checkpoint 1.1: Verify Module Creation

Before proceeding, let's verify the module is working.

### Verification Questions

Answer these to test your understanding:

1. **What does `MedusaService()` do?**
   <details>
   <summary>Click to reveal answer</summary>
   It generates CRUD methods for your data models automatically.
   </details>

2. **Why is the module name "brand" and not "brand-module"?**
   <details>
   <summary>Click to reveal answer</summary>
   Module names must be camelCase. Dashes cause runtime resolution errors.
   </details>

3. **What happens if you forget to run migrations?**
   <details>
   <summary>Click to reveal answer</summary>
   The `brand` table won't exist in the database, so service methods will fail.
   </details>

### Implementation Check

Run these commands and share the output:

1. **Check migrations succeeded**:
   ```bash
   npx medusa db:migrate
   ```
   Expected: "No pending migrations" or "Migrations complete"

2. **Check build succeeds**:
   ```bash
   npm run build
   ```
   Expected: No TypeScript errors

3. **Show me your files**:
   - `src/modules/brand/models/brand.ts`
   - `src/modules/brand/service.ts`
   - `src/modules/brand/index.ts`

### Common Issues

**"Cannot find module 'brand'"**
- **Cause**: Module not registered in `medusa-config.ts`
- **Fix**: Add `{ resolve: "./src/modules/brand" }` to modules array

**"Module name must be camelCase"**
- **Cause**: Used dashes in module name
- **Fix**: Use "brand" not "brand-module" in `BRAND_MODULE`

**"Table brand already exists"**
- **Cause**: Migration already run or table manually created
- **Fix**: Drop the table or use a different name

**Build errors**
- Check all imports are correct
- Ensure TypeScript is happy with your code
- Share the error message for help debugging

### Testing Checklist

- [ ] Migration succeeded without errors
- [ ] Build succeeds (`npm run build`)
- [ ] Module registered in `medusa-config.ts`
- [ ] Service exports properly

---

## Part 2: Create the Brand Workflow

### What is a Workflow?

A **Workflow** orchestrates multiple operations that need to complete together. If any operation fails, the workflow automatically rolls back all previous operations.

**Why workflows?**

Imagine you're creating a brand AND uploading its logo to S3:

**Without Workflow** (Fragile):
```typescript
// Create brand
const brand = await brandService.createBrands({ name: "Acme" })

// Upload logo
await s3.upload(brand.id, logo) // What if this fails?
// Now you have a brand in DB but no logo!
// Manual cleanup required...
```

**With Workflow** (Robust):
```typescript
const workflow = createWorkflow("create-brand-with-logo", function (input) {
  const brand = createBrandStep(input)
  const upload = uploadLogoStep({ brandId: brand.id, logo: input.logo })
  return new WorkflowResponse(brand)
})

// If upload fails, workflow automatically:
// 1. Calls uploadLogoStep compensation (cleanup S3)
// 2. Calls createBrandStep compensation (delete brand)
// 3. Returns error
// No orphaned data!
```

**Key Benefits**:
- **Automatic rollback**: Compensation functions undo changes
- **Transaction safety**: All or nothing
- **Retry logic**: Can retry failed steps
- **Composability**: Workflows can call other workflows

**Documentation**: [Workflows Guide](https://docs.medusajs.com/learn/fundamentals/workflows)

### Step 2.1: Create Brand Step

A **step** is the atomic unit of work in a workflow. Each step has:
- A step function (performs the action)
- A compensation function (undoes the action on error)

Create `src/workflows/steps/create-brand.ts`:

```typescript
import {
  createStep,
  StepResponse,
} from "@medusajs/framework/workflows-sdk"
import { BRAND_MODULE } from "../modules/brand"
import BrandModuleService from "../modules/brand/service"

export type CreateBrandStepInput = {
  name: string
}

export const createBrandStep = createStep(
  "create-brand-step",
  async (input: CreateBrandStepInput, { container }) => {
    const brandModuleService: BrandModuleService = container.resolve(
      BRAND_MODULE
    )

    const brand = await brandModuleService.createBrands(input)

    return new StepResponse(brand, brand.id)
  },
  async (brandId, { container }) => {
    if (!brandId) {
      return
    }
    const brandModuleService: BrandModuleService = container.resolve(
      BRAND_MODULE
    )

    await brandModuleService.deleteBrands(brandId)
  }
)
```

**Let's break this down**:

**1. Step Function (2nd parameter)**:
```typescript
async (input: CreateBrandStepInput, { container }) => {
  // Resolve the Brand Module service from Medusa container
  const brandModuleService = container.resolve(BRAND_MODULE)

  // Create the brand using the service
  const brand = await brandModuleService.createBrands(input)

  // Return StepResponse(data, compensationData)
  return new StepResponse(brand, brand.id)
}
```

- **`input`**: Data passed to the step
- **`container`**: Medusa container - registry of all services, modules, tools
- **`container.resolve()`**: Gets a registered service by name
- **`StepResponse(data, compensationData)`**:
  - `data`: Returned to the workflow (the brand object)
  - `compensationData`: Passed to compensation function (brand ID)

**2. Compensation Function (3rd parameter)**:
```typescript
async (brandId, { container }) => {
  if (!brandId) {
    return
  }
  const brandModuleService: BrandModuleService = container.resolve(
    BRAND_MODULE
  )

  await brandModuleService.deleteBrands(brandId)
}
```

- Receives the `compensationData` from StepResponse (brand ID)
- Undoes what the step did (deletes the brand)
- Called automatically if an error occurs later in the workflow

**Key Concept: The Medusa Container**

The **Medusa container** is a dependency injection container that holds:
- Core modules (Product, Cart, Customer, etc.)
- Custom modules (Brand)
- Services (logger, database, etc.)
- Framework tools (Link, Query, etc.)

You access them via `container.resolve()`:
```typescript
const brandService = container.resolve("brand")
const logger = container.resolve("logger")
const link = container.resolve("link")
```

**Documentation**: [Workflow Steps](https://docs.medusajs.com/learn/fundamentals/workflows#1-create-the-steps) | [Medusa Container](https://docs.medusajs.com/learn/fundamentals/medusa-container)

### Step 2.2: Create Brand Workflow

Now we compose the step into a workflow:

Create the workflow in `src/workflows/create-brand.ts`:

```typescript
import {
  createWorkflow,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { createBrandStep } from "./steps/create-brand.ts"

type CreateBrandWorkflowInput = {
  name: string
}

export const createBrandWorkflow = createWorkflow(
  "create-brand",
  function (input: CreateBrandWorkflowInput) {
    const brand = createBrandStep(input)
    return new WorkflowResponse(brand)
  }
)
```

**CRITICAL: Workflow Constructor Rules**

The workflow constructor function has strict constraints:

```typescript
// ✅ CORRECT
createWorkflow("name", function (input) {
  const result = myStep(input)  // No await!
  return new WorkflowResponse(result)
})

// ❌ WRONG - Will break!
createWorkflow("name", async function (input) {  // No async!
  const result = await myStep(input)       // No await!
  if (input.condition) { ... }             // No conditionals!
  return new WorkflowResponse(result)
})
```

**Why these rules?**

Workflows are **declarative**, not imperative. The constructor function:
- Runs at **load time**, not execution time
- Defines the **graph of steps**, not the execution
- Cannot have runtime logic (conditionals, loops)

**For runtime logic, use**:
- `when()` - Conditional step execution
- `transform()` - Data transformation
- `parallelize()` - Parallel execution

**Common Mistake**: Using `async` or `await`
```typescript
// ❌ WRONG
const brand = await createBrandStep(input)  // No await!

// ✅ CORRECT
const brand = createBrandStep(input)  // Step returns immediately
```

**Documentation**: [Workflows](https://docs.medusajs.com/learn/fundamentals/workflows)

---

## Checkpoint 1.2: Verify Workflow

### Verification Questions

1. **Why can't you use `await` in the workflow constructor?**
   <details>
   <summary>Click to reveal answer</summary>
   The workflow constructor runs at load time to define the step graph, not at execution time. Steps are executed later by the workflow engine.
   </details>

2. **What does the compensation function do?**
   <details>
   <summary>Click to reveal answer</summary>
   It undoes what the step did if an error occurs later in the workflow, maintaining data consistency.
   </details>

3. **Why pass `brand.id` as the second parameter to `StepResponse`?**
   <details>
   <summary>Click to reveal answer</summary>
   This data is passed to the compensation function so it knows which brand to delete if rollback is needed.
   </details>

### Implementation Check

1. **Check build succeeds**:
   ```bash
   npm run build
   ```
   Expected: No TypeScript errors

2. **Show me your file**:
   - `src/workflows/create-brand.ts`

### Common Issues

**"Async function not allowed"**
- **Cause**: Used `async` keyword in workflow constructor
- **Fix**: Remove `async`:
  ```typescript
  // ❌ Wrong
  createWorkflow("name", async (input) => { ... })

  // ✅ Correct
  createWorkflow("name", function (input) { ... })
  ```

**"Cannot use await"**
- **Cause**: Used `await` to call step
- **Fix**: Remove `await`:
  ```typescript
  // ❌ Wrong
  const brand = await createBrandStep(input)

  // ✅ Correct
  const brand = createBrandStep(input)
  ```

**"Arrow functions not allowed"**
- **Cause**: Used arrow function for workflow constructor
- **Fix**: Use `function` keyword:
  ```typescript
  // ❌ Wrong
  createWorkflow("name", (input) => { ... })

  // ✅ Correct
  createWorkflow("name", function (input) { ... })
  ```

### Testing Checklist

- [ ] Build succeeds (`npm run build`)
- [ ] No TypeScript errors
- [ ] Workflow uses `function`, not arrow function
- [ ] No `async` keyword in workflow constructor
- [ ] No `await` when calling steps

---

## Part 3: Create the API Route

### What is an API Route?

An **API Route** is a REST endpoint that exposes your features to clients:
- Admin dashboard
- Storefront
- Mobile apps
- Third-party integrations

**Key Principle**: Routes are THIN
- Validate input
- Execute workflow
- Return response

**All business logic belongs in workflows!**

**Documentation**: [API Routes Guide](https://docs.medusajs.com/learn/fundamentals/api-routes)

### Step 3.1: Create Validation Schema

We use **Zod** to validate request bodies. Create `src/api/admin/brands/validators.ts`:

```typescript
import { z } from "@medusajs/framework/zod"

export const PostAdminCreateBrand = z.object({
  name: z.string(),
})

export type PostAdminCreateBrandType = z.infer<typeof PostAdminCreateBrand>
```

**What's happening?**

- **Zod schema**: Defines expected request body shape
- **`z.string()`**: Name must be a string
- **`z.infer`**: Extracts TypeScript type from schema

**Why separate file?**
- Keeps route file clean
- Makes schemas reusable
- Follows Medusa conventions

**Documentation**: [API Validation Guide](https://docs.medusajs.com/learn/fundamentals/api-routes/validation)

### Step 3.2: Create the API Route

The route path is determined by file location. For `/admin/brands`, create `src/api/admin/brands/route.ts`:

```typescript
import {
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { createBrandWorkflow } from "../../../workflows/create-brand"
import { PostAdminCreateBrandType } from "./validators"

export const POST = async (
  req: MedusaRequest<PostAdminCreateBrandType>,
  res: MedusaResponse
) => {
  const { result } = await createBrandWorkflow(req.scope)
    .run({
      input: req.validatedBody,
    })

  res.json({ brand: result })
}
```

**Let's break this down**:

**1. Route Handler Export**:
```typescript
export const POST = async (req, res) => { ... }
```
- Export function named after HTTP method (POST, GET, DELETE)
- Medusa automatically registers this as `POST /admin/brands`

**2. Request Type**:
```typescript
req: MedusaRequest<PostAdminCreateBrandType>
```
- `MedusaRequest<T>`: Type-safe request object
- `T` is the validated body type
- Access validated body via `req.validatedBody`

**3. Execute Workflow**:
```typescript
const { result } = await createBrandWorkflow(req.scope).run({
  input: req.validatedBody,
})
```
- `req.scope`: The Medusa container
- `.run()`: Executes the workflow
- `input`: Data passed to workflow
- `result`: Data returned by workflow

**4. Return Response**:
```typescript
res.json({ brand: result })
```
- Returns JSON response to client

**Path Convention**:
```
File path: src/api/admin/brands/route.ts
Route path: POST /admin/brands

File path: src/api/admin/brands/[id]/route.ts
Route path: POST /admin/brands/:id

File path: src/api/store/products/route.ts
Route path: GET /store/products
```

**Documentation**: [Route Parameters](https://docs.medusajs.com/learn/fundamentals/api-routes/parameters)

### Step 3.3: Add Validation Middleware

**Middlewares** are functions that run before the route handler. They're useful for:
- Validation
- Authentication
- Custom parsing

Medusa provides `validateAndTransformBody` to validate request bodies using Zod schemas.

Create or update `src/api/middlewares.ts`:

```typescript
import {
  defineMiddlewares,
  validateAndTransformBody,
} from "@medusajs/framework/http"
import { PostAdminCreateBrand } from "./admin/brands/validators"

export default defineMiddlewares({
  routes: [
    {
      matcher: "/admin/brands",
      method: "POST",
      middlewares: [
        validateAndTransformBody(PostAdminCreateBrand),
      ],
    },
  ],
})
```

**What's happening?**

**1. Define Middlewares**:
```typescript
export default defineMiddlewares({ routes: [...] })
```
- Must export default from `src/api/middlewares.ts`
- Medusa auto-loads this file

**2. Route Configuration**:
```typescript
{
  matcher: "/admin/brands",   // Route path
  method: "POST",              // HTTP method
  middlewares: [...]           // Middlewares to apply
}
```

**3. Validation Middleware**:
```typescript
validateAndTransformBody(PostAdminCreateBrand)
```
- Validates request body against Zod schema
- Returns 400 error if validation fails
- Populates `req.validatedBody` if validation succeeds

**Common Mistake**: Typo in filename
- MUST be `middlewares.ts` (plural)
- NOT `middleware.ts` (singular)
- Typo causes middleware to be ignored silently!

**Documentation**: [Middlewares Guide](https://docs.medusajs.com/learn/fundamentals/api-routes/middlewares) | [Validation Middleware](https://docs.medusajs.com/learn/fundamentals/api-routes/validation)

---

## Checkpoint 1.3: Test the API Route

### Verification Questions

1. **Why is business logic in workflows, not routes?**
   <details>
   <summary>Click to reveal answer</summary>
   Routes are entry points. Workflows can be reused from multiple routes, scheduled jobs, event subscribers. Keeps logic centralized and testable.
   </details>

2. **What happens if validation fails?**
   <details>
   <summary>Click to reveal answer</summary>
   The `validateAndTransformBody` middleware returns a 400 error with details about what failed. The route handler never runs.
   </details>

3. **Why pass `req.scope` to the workflow?**
   <details>
   <summary>Click to reveal answer</summary>
   `req.scope` is the Medusa container. The workflow needs it to resolve services and modules.
   </details>

### Implementation Check

1. **Check build succeeds**:
   ```bash
   npm run build
   ```

2. **Show me your files**:
   - `src/api/admin/brands/validators.ts`
   - `src/api/admin/brands/route.ts`
   - `src/api/middlewares.ts`

### Test the API

Now let's test the complete feature!

**Step 1: Start the development server**
```bash
npm run dev
```

**Step 2: Get admin authentication token**

Since `/admin/brands` requires authentication, get a token first:

```bash
curl -X POST 'http://localhost:9000/auth/user/emailpass' \
-H 'Content-Type: application/json' \
--data-raw '{
    "email": "admin@medusa-test.com",
    "password": "supersecret"
}'
```

Replace with your admin email/password.

**Don't have an admin user?** Create one:
```bash
npx medusa user -e admin@test.com -p supersecret
```

**Step 3: Create a brand**

Using the token from step 2:

```bash
curl -X POST 'http://localhost:9000/admin/brands' \
-H 'Content-Type: application/json' \
-H 'Authorization: Bearer {token}' \
--data '{
    "name": "Acme"
}'
```

**Expected Response**:
```json
{
  "brand": {
    "id": "brand_01HQXYZ...",
    "name": "Acme",
    "created_at": "2024-01-16T10:30:00.000Z",
    "updated_at": "2024-01-16T10:30:00.000Z"
  }
}
```

### Common Issues

**401 Unauthorized**
- **Cause**: Token expired or invalid credentials
- **Fix**: Get fresh token from `/auth/user/emailpass`

**Empty array returned `[]`**
- **Cause**: Middleware file typo - probably named `middleware.ts` instead of `middlewares.ts`
- **Fix**: Rename to `src/api/middlewares.ts` (plural)

**400 Validation error**
- **Cause**: Request body doesn't match Zod schema
- **Fix**: Ensure you're sending `{ "name": "Acme" }` with correct JSON

**500 Server error**
- Check server logs for details
- Common causes:
  - Module not registered in config
  - Migration not run
  - Workflow syntax error

### Testing Checklist

- [ ] Dev server running
- [ ] Authentication token obtained
- [ ] Brand created successfully via cURL
- [ ] Response contains brand with ID, name, timestamps

---

## Lesson 1 Complete! 🎉

### What You Built

Congratulations! You just built a complete custom feature in Medusa:

- ✅ **Brand Module**: Data model + auto-generated service
- ✅ **createBrandWorkflow**: Business logic with rollback
- ✅ **POST /admin/brands**: API endpoint with validation
- ✅ **Tested**: Created a brand via cURL

### What You Learned

**Architecture**:
- Module → Workflow → API Route pattern
- Why each layer exists and what it's responsible for
- How they connect together

**Modules**:
- Data models define database tables
- Services provide CRUD operations
- Modules are isolated and reusable

**Workflows**:
- Orchestrate multi-step operations
- Provide automatic rollback via compensation functions
- Ensure data consistency

**API Routes**:
- Expose features to clients
- Validate input via middlewares
- Execute workflows (keep routes thin!)

### Architecture Reinforcement

Before moving to Lesson 2, reflect on these questions:

**1. Why can't I call `brandModuleService` directly from the API route?**

Think about it, then expand:
<details>
<summary>Answer</summary>

While you *could* do:
```typescript
export const POST = async (req, res) => {
  const brandService = req.scope.resolve("brand")
  const brand = await brandService.createBrands(req.body)
  res.json({ brand })
}
```

**Problems**:
- No rollback if subsequent operations fail
- Can't reuse logic elsewhere (scheduled jobs, other routes)
- Hard to test
- Violates separation of concerns

**Workflows solve this** by:
- Providing automatic rollback
- Being reusable from anywhere
- Having clear interfaces
- Being independently testable
</details>

**2. What happens if there's an error creating the brand?**

<details>
<summary>Answer</summary>

The workflow's compensation function (`createBrandStep`'s 3rd parameter) is called automatically, which deletes the brand. This ensures no orphaned data.
</details>

**3. Where would I add business validation (e.g., "brand name must be unique")?**

<details>
<summary>Answer</summary>

In a workflow step, NOT the API route!

```typescript
export const validateBrandNameStep = createStep(
  "validate-brand-name",
  async ({ name }, { container }) => {
    const brandService = container.resolve("brand")
    const existing = await brandService.listBrands({ name })

    if (existing.length > 0) {
      throw new Error("Brand name must be unique")
    }

    return new StepResponse({ validated: true })
  }
)

// Then in workflow:
export const createBrandWorkflow = createWorkflow(
  "create-brand",
  function (input) {
    validateBrandNameStep(input)
    const brand = createBrandStep(input)
    return new WorkflowResponse(brand)
  }
)
```
</details>

### Commit Your Work

Save your progress:

```bash
git add .
git commit -m "Complete Lesson 1: Brand Module, Workflow, and API Route"
```

---

## Ready for Lesson 2?

In **Lesson 2: Extend Medusa**, you'll learn how to:

- **Link brands to products** using Module Links (maintain module isolation)
- **Extend core workflows** using Workflow Hooks (add custom logic to Medusa's workflows)
- **Query linked data** across modules using Query

You'll be able to:
- Create a product with a brand: `POST /admin/products` with `additional_data: { brand_id: "..." }`
- Retrieve a product's brand: `GET /admin/products/:id?fields=+brand.*`
- List all brands with their products: `GET /admin/brands` returning linked products

**Documentation**: [Module Links](https://docs.medusajs.com/learn/fundamentals/module-links) | [Workflow Hooks](https://docs.medusajs.com/learn/fundamentals/workflows/workflow-hooks) | [Query Guide](https://docs.medusajs.com/learn/fundamentals/module-links/query)

When you're ready, let me know and we'll start Lesson 2!
