---
name: building-with-medusa
description: Load automatically when planning, researching, or implementing ANY Medusa backend features (custom modules, API routes, workflows, data models, module links, business logic). REQUIRED for all Medusa backend work in ALL modes (planning, implementation, exploration). Contains architectural patterns, best practices, and critical rules that MCP servers don't provide.
---

# Medusa Backend Development

Comprehensive backend development guide for Medusa applications. Contains patterns across 6 categories covering architecture, type safety, business logic placement, and common pitfalls.

## When to Apply

**Load this skill for ANY backend development task, including:**
- Creating or modifying custom modules and data models
- Implementing workflows for mutations
- Building API routes (store or admin)
- Defining module links between entities
- Writing business logic or validation
- Querying data across modules
- Implementing authentication/authorization

**Also load these skills when:**
- **building-admin-dashboard-customizations:** Building admin UI (widgets, pages, forms)
- **building-storefronts:** Calling backend API routes from storefronts (SDK integration)

## CRITICAL: Load Reference Files When Needed

**The quick reference below is NOT sufficient for implementation.** You MUST load relevant reference files before writing code for that component.

**Load these references based on what you're implementing:**

- **Creating a module?** → MUST load `reference/custom-modules.md` first
- **Creating workflows?** → MUST load `reference/workflows.md` first
- **Creating API routes?** → MUST load `reference/api-routes.md` first
- **Creating module links?** → MUST load `reference/module-links.md` first
- **Querying data?** → MUST load `reference/querying-data.md` first
- **Adding authentication?** → MUST load `reference/authentication.md` first

**Minimum requirement:** Load at least 1-2 reference files relevant to your specific task before implementing.

## Critical Architecture Pattern

**ALWAYS follow this flow - never bypass layers:**

```
Module (data models + CRUD operations)
  ↓ used by
Workflow (business logic + mutations with rollback)
  ↓ executed by
API Route (HTTP interface, validation middleware)
  ↓ called by
Frontend (admin dashboard/storefront via SDK)
```

**Key conventions:**
- Only GET, POST, DELETE methods (never PUT/PATCH)
- Workflows are required for ALL mutations
- Business logic belongs in workflow steps, NOT routes
- Query with `query.graph()` for cross-module data
- Module links maintain isolation between modules

## Rule Categories by Priority

| Priority | Category | Impact | Prefix |
|----------|----------|--------|--------|
| 1 | Architecture Violations | CRITICAL | `arch-` |
| 2 | Type Safety | CRITICAL | `type-` |
| 3 | Business Logic Placement | HIGH | `logic-` |
| 4 | Import & Code Organization | HIGH | `import-` |
| 5 | Data Access Patterns | MEDIUM | `data-` |
| 6 | File Organization | MEDIUM | `file-` |

## Quick Reference

### 1. Architecture Violations (CRITICAL)

- `arch-workflow-required` - Use workflows for ALL mutations, never call module services from routes
- `arch-layer-bypass` - Never bypass layers (route → service without workflow)
- `arch-http-methods` - Use only GET, POST, DELETE (never PUT/PATCH)
- `arch-module-isolation` - Use module links, not direct cross-module service calls
- `arch-query-config-fields` - Don't set explicit `fields` when using `req.queryConfig`

### 2. Type Safety (CRITICAL)

- `type-request-schema` - Pass Zod inferred type to `MedusaRequest<T>` when using `req.validatedBody`
- `type-authenticated-request` - Use `AuthenticatedMedusaRequest` for protected routes (not `MedusaRequest`)
- `type-export-schema` - Export both Zod schema AND inferred type from middlewares
- `type-linkable-auto` - Never add `.linkable()` to data models (automatically added)
- `type-module-name-camelcase` - Module names MUST be camelCase, never use dashes (causes runtime errors)

### 3. Business Logic Placement (HIGH)

- `logic-workflow-validation` - Put business validation in workflow steps, not API routes
- `logic-ownership-checks` - Validate ownership/permissions in workflows, not routes
- `logic-module-service` - Keep modules simple (CRUD only), put logic in workflows

### 4. Import & Code Organization (HIGH)

- `import-top-level` - Import workflows/modules at file top, never use `await import()` in route body
- `import-static-only` - Use static imports for all dependencies
- `import-no-dynamic-routes` - Dynamic imports add overhead and break type checking

### 5. Data Access Patterns (MEDIUM)

- `data-query-graph` - Use `query.graph()` for cross-module queries with dot notation
- `data-list-and-count` - Use `listAndCount` for single-module paginated queries
- `data-linked-filtering` - Can't filter by linked module fields - query from that entity directly instead
- `data-no-js-filter` - Don't use JavaScript `.filter()` on linked data - use database filters by querying the entity
- `data-same-module-ok` - Can filter by same-module relations (e.g., product.variants)
- `data-auth-middleware` - Trust `authenticate` middleware, don't manually check `req.auth_context`

### 6. File Organization (MEDIUM)

- `file-workflow-steps` - Recommended: Create steps in `src/workflows/steps/[name].ts`
- `file-workflow-composition` - Composition functions in `src/workflows/[name].ts`
- `file-middleware-exports` - Export schemas and types from middleware files
- `file-links-directory` - Define module links in `src/links/[name].ts`

## Workflow Composition Rules

**The workflow function has critical constraints:**

```typescript
// ✅ CORRECT
const myWorkflow = createWorkflow(
  "name",
  function (input) { // Regular function, not async, not arrow
    const result = myStep(input) // No await
    return new WorkflowResponse(result)
  }
)

// ❌ WRONG
const myWorkflow = createWorkflow(
  "name",
  async (input) => { // ❌ No async, no arrow functions
    const result = await myStep(input) // ❌ No await
    if (input.condition) { /* ... */ } // ❌ No conditionals
    return new WorkflowResponse(result)
  }
)
```

**Constraints:**
- No async/await (runs at load time)
- No arrow functions (use `function`)
- No conditionals/ternaries (use `when()`)
- No variable manipulation (use `transform()`)
- No date creation (use `transform()`)
- Multiple step calls need `.config({ name: "unique-name" })` to avoid conflicts

## Common Mistakes Checklist

Before implementing, verify you're NOT doing these:

**Architecture:**
- [ ] Calling module services directly from API routes
- [ ] Using PUT or PATCH methods
- [ ] Bypassing workflows for mutations
- [ ] Setting `fields` explicitly with `req.queryConfig`
- [ ] Skipping migrations after creating module links

**Type Safety:**
- [ ] Forgetting `MedusaRequest<SchemaType>` type argument
- [ ] Using `MedusaRequest` instead of `AuthenticatedMedusaRequest` for protected routes
- [ ] Not exporting Zod inferred type from middlewares
- [ ] Adding `.linkable()` to data models
- [ ] Using dashes in module names (must be camelCase)

**Business Logic:**
- [ ] Validating business rules in API routes
- [ ] Checking ownership in routes instead of workflows
- [ ] Manually checking `req.auth_context?.actor_id` when middleware already applied

**Imports:**
- [ ] Using `await import()` in route handler bodies
- [ ] Dynamic imports for workflows or modules

**Data Access:**
- [ ] Filtering by linked module fields (query from other side instead)
- [ ] Using JavaScript `.filter()` on linked data (query the linked entity directly)
- [ ] Not using query.graph() for cross-module queries

## Validating Implementation

**CRITICAL: Always run the build command after completing implementation to catch type errors and runtime issues.**

### When to Validate
- After implementing any new feature
- After making changes to modules, workflows, or API routes
- Before marking tasks as complete
- Proactively, without waiting for the user to ask

### How to Run Build

Detect the package manager and run the appropriate command:

```bash
npm run build      # or pnpm build / yarn build
```

### Handling Build Errors

If the build fails:
1. Read the error messages carefully
2. Fix type errors, import issues, and syntax errors
3. Run the build again to verify the fix
4. Do NOT mark implementation as complete until build succeeds

**Common build errors:**
- Missing imports or exports
- Type mismatches (e.g., missing `MedusaRequest<T>` type argument)
- Incorrect workflow composition (async functions, conditionals)

## Next Steps - Testing Your Implementation

**After successfully implementing a feature, always provide these next steps to the user:**

### 1. Start the Development Server

If the server isn't already running, start it:

```bash
npm run dev      # or pnpm dev / yarn dev
```

### 2. Access the Admin Dashboard

Open your browser and navigate to:
- **Admin Dashboard:** http://localhost:9000/app

Log in with your admin credentials to test any admin-related features.

### 3. Test API Routes

If you implemented custom API routes, list them for the user to test:

**Admin Routes (require authentication):**
- `POST http://localhost:9000/admin/[your-route]` - Description of what it does
- `GET http://localhost:9000/admin/[your-route]` - Description of what it does

**Store Routes (public or customer-authenticated):**
- `POST http://localhost:9000/store/[your-route]` - Description of what it does
- `GET http://localhost:9000/store/[your-route]` - Description of what it does

**Testing with cURL example:**
```bash
# Admin route (requires authentication)
curl -X POST http://localhost:9000/admin/reviews/123/approve \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  --cookie "connect.sid=YOUR_SESSION_COOKIE"

# Store route
curl -X POST http://localhost:9000/store/reviews \
  -H "Content-Type: application/json" \
  -d '{"product_id": "prod_123", "rating": 5, "comment": "Great product!"}'
```

### 4. Additional Testing Steps

Depending on what was implemented, mention:
- **Workflows:** Test mutation operations and verify rollback on errors
- **Subscribers:** Trigger events and check logs for subscriber execution
- **Scheduled jobs:** Wait for job execution or check logs for cron output

### Format for Presenting Next Steps

Always present next steps in a clear, actionable format after implementation:

```markdown
## Implementation Complete

The [feature name] has been successfully implemented. Here's how to test it:

### Start the Development Server
[server start command based on package manager]

### Access the Admin Dashboard
Open http://localhost:9000/app in your browser

### Test the API Routes
I've added the following routes:

**Admin Routes:**
- POST /admin/[route] - [description]
- GET /admin/[route] - [description]

**Store Routes:**
- POST /store/[route] - [description]

### What to Test
1. [Specific test case 1]
2. [Specific test case 2]
3. [Specific test case 3]
```

## How to Use

**For detailed patterns and examples, load reference files:**

```
reference/custom-modules.md    - Creating modules with data models
reference/workflows.md          - Workflow creation and step patterns
reference/api-routes.md         - API route structure and validation
reference/module-links.md       - Linking entities across modules
reference/querying-data.md      - Query patterns and filtering rules
reference/authentication.md     - Protecting routes and accessing users
reference/error-handling.md     - MedusaError types and patterns
reference/scheduled-jobs.md     - Cron jobs and periodic tasks
reference/subscribers-and-events.md - Event handling
reference/troubleshooting.md    - Common errors and solutions
```

Each reference file contains:
- Step-by-step implementation checklists
- Correct vs incorrect code examples
- TypeScript patterns and type safety
- Common pitfalls and solutions

## When to Use This Skill vs MedusaDocs MCP Server

**⚠️ CRITICAL: This skill should be consulted FIRST for planning and implementation.**

**Use this skill for (PRIMARY SOURCE):**
- **Planning** - Understanding how to structure Medusa backend features
- **Architecture** - Module → Workflow → API Route patterns
- **Best practices** - Correct vs incorrect code patterns
- **Critical rules** - What NOT to do (common mistakes and anti-patterns)
- **Implementation patterns** - Step-by-step guides with checklists

**Use MedusaDocs MCP server for (SECONDARY SOURCE):**
- Specific method signatures after you know which method to use
- Built-in module configuration options
- Official type definitions
- Framework-level configuration details

**Why skills come first:**
- Skills contain opinionated guidance and anti-patterns MCP doesn't have
- Skills show architectural patterns needed for planning
- MCP is reference material; skills are prescriptive guidance

## Integration with Frontend Applications

When building features that span backend and frontend:

**For Admin Dashboard:**
1. **Backend (this skill):** Module → Workflow → API Route
2. **Frontend:** Load `building-admin-dashboard-customizations` skill
3. **Connection:** Admin widgets call custom API routes via `sdk.client.fetch()`

**For Storefronts:**
1. **Backend (this skill):** Module → Workflow → API Route
2. **Frontend:** Load `building-storefronts` skill
3. **Connection:** Storefront calls custom API routes via `sdk.client.fetch()`

See respective frontend skills for complete integration patterns.
