# Custom Modules

## Contents
- [When to Create a Custom Module](#when-to-create-a-custom-module)
- [Module Structure](#module-structure)
- [Creating a Custom Module - Implementation Checklist](#creating-a-custom-module---implementation-checklist)
- [Step 1: Create the Data Model](#step-1-create-the-data-model)
- [Step 2: Create the Service](#step-2-create-the-service)
- [Step 3: Export Module Definition](#step-3-export-module-definition)
- [Step 4: Register in Configuration](#step-4-register-in-configuration)
- [Steps 5-6: Generate and Run Migrations](#steps-5-6-generate-and-run-migrations)
- [Resolving Services from Container](#resolving-services-from-container)
- [Auto-Generated CRUD Methods](#auto-generated-crud-methods)
- [Loaders](#loaders)

A module is a reusable package of functionalities related to a single domain or integration. Modules contain data models (database tables) and a service class that provides methods to manage them.

## When to Create a Custom Module

- **New domain concepts**: Brands, wishlists, reviews, loyalty points
- **Third-party integrations**: ERPs, CMSs, custom services
- **Isolated business logic**: Features that don't fit existing commerce modules

## Module Structure

```
src/modules/blog/
├── models/
│   └── post.ts          # Data model definitions
├── service.ts           # Main service class
└── index.ts             # Module definition export
```

## Creating a Custom Module - Implementation Checklist

**IMPORTANT FOR CLAUDE CODE**: When implementing custom modules, use the TodoWrite tool to track your progress through these steps. This ensures you don't miss any critical steps (especially migrations!) and provides visibility to the user.

Create these tasks in your todo list:

- Create data model in src/modules/[name]/models/
- Create service extending MedusaService
- Export module definition in index.ts
- **CRITICAL: Register module in medusa-config.ts** (do this before using the module)
- **CRITICAL: Generate migrations: npx medusa db:generate [module-name]** (Never skip!)
- **CRITICAL: Run migrations: npx medusa db:migrate** (Never skip!)
- Use module service in API routes/workflows
- **CRITICAL: Run build to validate implementation** (catches type errors and issues)

## Step 1: Create the Data Model

```typescript
// src/modules/blog/models/post.ts
import { model } from "@medusajs/framework/utils"

const Post = model.define("post", {
  id: model.id().primaryKey(),
  title: model.text(),
  content: model.text().nullable(),
  published: model.boolean().default(false),
})

// note models automatically get created_at, updated_at and deleted_at added - don't add these explicitly

export default Post
```

**Data model reference**: See [data-models.md](data-models.md)

## Step 2: Create the Service

```typescript
// src/modules/blog/service.ts
import { MedusaService } from "@medusajs/framework/utils"
import Post from "./models/post"

class BlogModuleService extends MedusaService({
  Post,
}) {}

export default BlogModuleService
```

The service extends `MedusaService` which auto-generates CRUD methods for each data model.

## Step 3: Export Module Definition

```typescript
// src/modules/blog/index.ts
import BlogModuleService from "./service"
import { Module } from "@medusajs/framework/utils"

export const BLOG_MODULE = "blog"

export default Module(BLOG_MODULE, {
  service: BlogModuleService,
})
```

**⚠️ CRITICAL - Module Name Format:**
- Module names MUST be in camelCase
- **NEVER use dashes (kebab-case)** in module names
- ✅ CORRECT: `"blog"`, `"productReview"`, `"orderTracking"`
- ❌ WRONG: `"product-review"`, `"order-tracking"` (will cause runtime errors)

**Example of common mistake:**

```typescript
// ❌ WRONG - dashes will break the module
export const PRODUCT_REVIEW_MODULE = "product-review" // Don't do this!
export default Module("product-review", { service: ProductReviewService })

// ✅ CORRECT - use camelCase
export const PRODUCT_REVIEW_MODULE = "productReview"
export default Module("productReview", { service: ProductReviewService })
```

**Why this matters:** Medusa's internal module resolution uses property access syntax (e.g., `container.resolve("productReview")`), and dashes would break this.

## Step 4: Register in Configuration

**IMPORTANT**: You MUST register the module in the configurations BEFORE using it anywhere or generating migrations.

```typescript
// medusa-config.ts
module.exports = defineConfig({
  // ...
  modules: [{ resolve: "./src/modules/blog" }],
})
```

## Steps 5-6: Generate and Run Migrations

**⚠️ CRITICAL - DO NOT SKIP**: After creating a module and registering it in medusa-config.ts, you MUST run TWO SEPARATE commands. Without this step, the module's database tables won't exist and you will get runtime errors.

```bash
# Step 5: Generate migrations (creates migration files)
# Command format: npx medusa db:generate <module-name>
npx medusa db:generate blog

# Step 6: Run migrations (applies changes to database)
# This command takes NO arguments
npx medusa db:migrate
```

**⚠️ CRITICAL: These are TWO separate commands:**
- ✅ CORRECT: Run `npx medusa db:generate blog` then `npx medusa db:migrate`
- ❌ WRONG: `npx medusa db:generate blog "create blog module"` (no description parameter!)
- ❌ WRONG: Combining into one command

**Why this matters:**
- Migrations create the database tables for your module's data models
- Without migrations, the module service methods (createPosts, listPosts, etc.) will fail
- You must generate migrations BEFORE running them
- This step is REQUIRED before using the module anywhere in your code

**Common mistake:** Creating a module and immediately trying to use it in a workflow or API route without running migrations first. Always run migrations immediately after registering the module.

## Resolving Services from Container

Access your module service in different contexts:

```typescript
// In API routes
const blogService = req.scope.resolve("blog")
const post = await blogService.createPosts({ title: "Hello World" })

// In workflow steps
const blogService = container.resolve("blog")
const posts = await blogService.listPosts({ published: true })
```

The module name used in `Module("blog", ...)` becomes the container resolution key.

## Auto-Generated CRUD Methods

The service auto-generates methods for each data model:

```typescript
// Create - pass object or array of objects
const post = await blogService.createPosts({ title: "Hello" })
const posts = await blogService.createPosts([
  { title: "One" },
  { title: "Two" },
])

// Retrieve - by ID, with optional select/relations
const post = await blogService.retrievePost("post_123")
const post = await blogService.retrievePost("post_123", {
  select: ["id", "title"],
})

// List - with filters and options
const posts = await blogService.listPosts()
const posts = await blogService.listPosts({ published: true })
const posts = await blogService.listPosts(
  { published: true }, // filters
  { take: 20, skip: 0, order: { created_at: "DESC" } } // options
)

// List with count - returns [records, totalCount]
const [posts, count] = await blogService.listAndCountPosts({ published: true })

// Update - by ID or with selector/data pattern
const post = await blogService.updatePosts({ id: "post_123", title: "Updated" })
const posts = await blogService.updatePosts({
  selector: { published: false },
  data: { published: true },
})

// Delete - by ID, array of IDs, or filter object
await blogService.deletePosts("post_123")
await blogService.deletePosts(["post_123", "post_456"])
await blogService.deletePosts({ published: false })

// Soft delete / restore
await blogService.softDeletePosts("post_123")
await blogService.restorePosts("post_123")
```

## Loaders

Loaders run when the Medusa application starts. Use them to initialize connections, seed data (relevant to the Module), or register resources.

```typescript
// src/modules/blog/loaders/hello-world.ts
import { LoaderOptions } from "@medusajs/framework/types"

export default async function helloWorldLoader({ container }: LoaderOptions) {
  const logger = container.resolve("logger")
  logger.info("[BLOG MODULE] Started!")
}

// Export in module definition (src/modules/blog/index.ts)
import helloWorldLoader from "./loaders/hello-world"

export default Module("blog", {
  service: BlogModuleService,
  loaders: [helloWorldLoader],
})
```
