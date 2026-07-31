# Checkpoint 1.3: Brand API Route

This checkpoint verifies that you've successfully created the POST /admin/brands API route with validation and middleware.

## Verification Questions

Before proceeding, test your understanding:

1. **Why do we execute workflows from API routes instead of calling services directly?**
   <details>
   <summary>Answer</summary>

   Workflows provide orchestration, rollback, and transaction management. If you call services directly from routes, you have to manually handle rollback logic when errors occur. Workflows handle this automatically through compensation functions. This becomes crucial as your business logic grows more complex with multiple steps.
   </details>

2. **What does `validateAndTransformBody` middleware do?**
   <details>
   <summary>Answer</summary>

   It validates incoming request body against a Zod schema BEFORE your route handler runs. If validation fails, it automatically returns a 400 error with validation details. If validation succeeds, it transforms the data according to the schema and passes the validated data to your handler. This ensures your handler only receives valid data.
   </details>

3. **Why do we use `MedusaRequest` and `MedusaResponse` instead of Express types?**
   <details>
   <summary>Answer</summary>

   These are Medusa-specific types that extend Express types with additional properties like `scope` (for dependency injection) and `queryConfig` (for filtering/pagination). Using these types gives you type-safe access to Medusa-specific features.
   </details>

4. **What is the `scope` object and how does it work?**
   <details>
   <summary>Answer</summary>

   `scope` is Medusa's dependency injection container scoped to the current request. You pass it to workflows when executing them (e.g., `workflow(req.scope).run()`), and use it to resolve services (e.g., `scope.resolve("query")`). Each request gets its own scope, ensuring proper isolation and allowing request-specific configuration.
   </details>

## Implementation Check

Let me verify your implementation. Please share the following:

### 1. Schema File

Show me your `src/api/admin/brands/validators.ts` file.

**Key things to check**:
- [ ] Imports `z` from "@medusajs/framework/zod"
- [ ] Defines `CreateBrandSchema` with `z.object()`
- [ ] Has `name` field with `z.string()`
- [ ] Exports schema as named export

### 2. Route File

Show me your `src/api/admin/brands/route.ts` file.

**Key things to check**:
- [ ] Imports types: `MedusaRequest`, `MedusaResponse`
- [ ] Imports workflow: `import { createBrandWorkflow } from "..."`
- [ ] Imports workflow input type: `CreateBrandWorkflowInput`
- [ ] Defines `POST` function (must be named `POST` exactly)
- [ ] Uses type: `MedusaRequest<CreateBrandWorkflowInput>`
- [ ] Executes workflow: `await createBrandWorkflow(req.scope).run({ input: ... })`
- [ ] Extracts brand from result: `result.result` or `result.brand`
- [ ] Returns JSON: `res.json({ brand })`
- [ ] Handles errors with try/catch

### 3. Middleware File

Show me your `src/api/middlewares.ts` file.

**Key things to check**:
- [ ] Imports `defineMiddlewares`, `validateAndTransformBody`
- [ ] Imports `CreateBrandSchema`
- [ ] Exports `default defineMiddlewares()`
- [ ] Has `routes` array
- [ ] Route config has `matcher: "/admin/brands"`
- [ ] Route config has `method: "POST"`
- [ ] Route config has `middlewares` array with `validateAndTransformBody()`

### 4. Server Running

Start your dev server:

```bash
npm run dev
```

**Expected output**: Server should start without errors. Check that there are no errors about missing routes or middleware.

## Common Issues

### Middleware not running / validation not working

**Symptom**: Invalid data passes through without validation errors

**Cause**: Middleware not configured correctly

**Fix**:
1. Check that `matcher` exactly matches your route: `"/admin/brands"`
2. Check that `method` is uppercase: `"POST"`
3. Ensure `middlewares.ts` is in the correct location: `src/api/middlewares.ts`
4. Restart dev server after middleware changes

### "Empty array returned" or "brand is undefined"

**Symptom**: API returns empty response or undefined brand

**Cause**: Not extracting brand from workflow result correctly

**Fix**:
Workflow results are nested:
```typescript
const { result } = await workflow.run({ input: req.validatedBody })
const brand = result.result // Note: double .result

res.json({ brand })
```

The first `.result` is the workflow execution result, the second `.result` is from `WorkflowResponse(brand)`.

### Route not found / 404 error

**Symptom**: cURL returns 404

**Cause**: File not in correct location or not named correctly

**Fix**:
1. Ensure file is at: `src/api/admin/brands/route.ts`
2. Ensure function is exported as `POST` (not default export)
3. Restart dev server
4. Check URL is correct: `http://localhost:9000/admin/brands`

### "Workflow failed" with no specific error

**Symptom**: Generic workflow failure

**Cause**: Error in step execution (likely in createBrandStep)

**Fix**:
1. Check server logs for detailed error message
2. Verify brand service is accessible in the step
3. Verify database connection is working
4. Check that migrations ran successfully

### TypeScript error: "Property 'validatedBody' does not exist"

**Symptom**: Build fails with TS error

**Cause**: Missing type for validated body

**Fix**:
Use generic type parameter:
```typescript
export const POST = async (
  req: MedusaRequest<CreateBrandWorkflowInput>,
  res: MedusaResponse
) => {
  const input = req.validatedBody // TypeScript knows this is CreateBrandWorkflowInput
}
```

## Testing Checklist

Verify each of these steps:

- [ ] Server starts without errors
- [ ] POST request to `/admin/brands` succeeds
- [ ] Response contains brand object with id and name
- [ ] Invalid request (missing name) returns 400 error
- [ ] Brand is actually saved (check with GET request or database query)
- [ ] Build succeeds: `npm run build`

## Manual Database Verification (Optional)

If you want to verify the brand was actually saved:

```bash
# Connect to your database
psql your_database_name

# Query brands table
SELECT * FROM brand;
```

You should see the Nike brand you created.

## Architecture Understanding

At this point, you should understand the full three-layer pattern:

```
┌─────────────────────────────────────────────────┐
│  API Route (HTTP Interface)                     │
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
│  - Provides CRUD operations                     │
│  - Isolated from other modules                  │
└─────────────────────────────────────────────────┘
```

**Why this matters**:
- **Separation of concerns**: Each layer has a single responsibility
- **Reusability**: Workflow can be called from multiple routes (HTTP, GraphQL, CLI)
- **Testability**: Each layer can be tested independently
- **Maintainability**: Changes to one layer don't affect others

## Next Steps

Once this checkpoint passes:

1. **Lesson 1 Complete!** You've built a complete feature from scratch:
   - Brand Module (data layer)
   - createBrandWorkflow (business logic with rollback)
   - POST /admin/brands (HTTP interface with validation)

2. **Commit your work**:
   ```bash
   git add .
   git commit -m "Complete Lesson 1: Build custom brand feature"
   ```

3. **Next: Lesson 2** - Extend Medusa
   - Link brands to products using Module Links
   - Extend core workflows using Workflow Hooks
   - Query linked data across modules

**Ready for Lesson 2?** This is where it gets really interesting - you'll learn how to extend Medusa's core functionality without forking the codebase.
