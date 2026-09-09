# Checkpoint 2.2: Workflow Hooks

This checkpoint verifies that you've successfully consumed the productsCreated workflow hook to link brands to products and configured additional_data validation.

## Verification Questions

Before proceeding, test your understanding:

1. **What are workflow hooks and why are they useful?**
   <details>
   <summary>Answer</summary>

   Workflow hooks are injection points in Medusa's core workflows where you can add custom logic. They allow you to extend core functionality (like product creation) without forking Medusa's code. When a core workflow reaches a hook point, it executes all registered hook subscribers, allowing your custom code to run as part of the standard flow.
   </details>

2. **Why do we need both a step function AND a compensation function in the hook?**
   <details>
   <summary>Answer</summary>

   Hook subscribers are treated as workflow steps, which means they need compensation for rollback. If product creation succeeds and the link is created, but a later step fails (e.g., inventory allocation), the compensation function removes the link to maintain data consistency. This ensures links are only persisted when the entire product creation succeeds.
   </details>

3. **What is `additional_data` and why do we use it?**
   <details>
   <summary>Answer</summary>

   `additional_data` is a flexible object in Medusa's core workflows that allows you to pass custom data without modifying core workflow types. For product creation, we use it to pass `brand_id` from the API request to our hook subscriber. This is the standard pattern for extending core workflows with custom parameters.
   </details>

4. **Why do we need to configure `additional_data` validation in middleware?**
   <details>
   <summary>Answer</summary>

   Without validation configuration, Medusa won't allow `brand_id` in the request body - it would be filtered out or cause validation errors. The `additionalDataValidator` in middleware tells Medusa "it's okay to accept brand_id in additional_data" and validates it against your schema before the request reaches the workflow.
   </details>

## Implementation Check

Let me verify your implementation. Please share the following:

### 1. Hook Subscriber File

Show me your `src/workflows/hooks/product-brand-link.ts` file (or wherever you defined the hook).

**Key things to check**:
- [ ] Imports `createProductsWorkflow` from "@medusajs/medusa/core-flows"
- [ ] Imports `StepResponse` from "@medusajs/framework/workflows-sdk"
- [ ] Calls `createProductsWorkflow.hooks.productsCreated()`
- [ ] Hook has async step function: `async ({ products, additional_data }, { container }) => { ... }`
- [ ] Hook has async compensation function: `async (links, { container }) => { ... }`
- [ ] Step function:
  - Resolves link service: `container.resolve("link")`
  - Extracts brand_id from additional_data
  - Creates links using `link.create()`
  - Returns `new StepResponse(links, links)`
- [ ] Compensation function:
  - Checks if links exist: `if (!links?.length) return`
  - Resolves link service
  - Dismisses links: `link.dismiss(links)`

### 2. Middleware Configuration

Show me your `src/api/middlewares.ts` file (specifically the POST /admin/products configuration).

**Key things to check**:
- [ ] Imports `createFindParams`, `createOperatorMap` from "@medusajs/medusa/api/utils/validators"
- [ ] Defines `CreateProductSchema` or similar with Zod
- [ ] Schema includes `additional_data` field:
  ```typescript
  additional_data: z.object({
    brand_id: z.string().optional(),
  }).optional()
  ```
- [ ] Route configuration:
  - Matcher: `"/admin/products"`
  - Method: `"POST"`
  - Uses `validateAndTransformBody()` with schema and `additionalDataValidator`
  - Example:
  ```typescript
  validateAndTransformBody(CreateProductSchema, {
    additionalDataValidator: {
      brand_id: z.string(),
    },
  })
  ```

### 3. Test: Create Product with Brand

With dev server running, test creating a product with brand_id:

```bash
curl -X POST http://localhost:9000/admin/products \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Air Max 90",
    "additional_data": {
      "brand_id": "brand_..."
    }
  }'
```

**Replace `brand_...` with an actual brand ID** from your database (use the Nike brand you created in Lesson 1).

**Expected output**: Product should be created successfully with a product ID.

## Common Issues

### "Hook not executing" / Link not created

**Symptom**: Product is created but link doesn't exist

**Causes and Fixes**:

**Cause 1**: Hook file not in the right location
- **Fix**: Ensure file is in `src/workflows/` directory (Medusa auto-discovers hooks here)
- **Fix**: Restart dev server after creating hook file

**Cause 2**: brand_id not passed in request
- **Fix**: Include `additional_data: { brand_id: "..." }` in POST body

**Cause 3**: additional_data validation not configured
- **Fix**: Check middleware configuration (see below)

**Cause 4**: Hook has syntax errors
- **Fix**: Check server logs for errors

### "Validation error: additional_data not allowed"

**Symptom**: 400 error when posting with additional_data

**Cause**: Middleware not configured to accept additional_data

**Fix**:
In `src/api/middlewares.ts`, add configuration for POST /admin/products:
```typescript
{
  matcher: "/admin/products",
  method: "POST",
  middlewares: [
    validateAndTransformBody(
      CreateProductSchema,
      {
        additionalDataValidator: {
          brand_id: z.string(),
        },
      }
    ),
  ],
}
```

## Testing Checklist

Verify each of these steps:

- [ ] Hook file created in `src/workflows/` directory
- [ ] Server starts without hook-related errors
- [ ] Middleware configured for POST /admin/products with additionalDataValidator
- [ ] Build succeeds: `npm run build`

## Architecture Understanding

At this point, you should understand:

**How hooks extend core workflows**:

```
Core Workflow: createProductsWorkflow
┌─────────────────────────────────────┐
│ 1. Validate input                   │
│ 2. Create products                  │
│ 3. → HOOK: productsCreated ←        │ ← Your custom logic runs here
│    ↳ Your hook: Link to brand       │
│ 4. Handle inventory                 │
│ 5. Publish events                   │
└─────────────────────────────────────┘
```

**Why this matters**:
- **No forking**: You don't modify Medusa's code
- **Upgrade safe**: Your hooks continue to work when Medusa updates
- **Composable**: Multiple hooks can subscribe to the same point
- **Rollback included**: Your hook gets automatic compensation

**Example**: If inventory allocation (step 4) fails:
1. Medusa calls your hook's compensation function
2. Your hook removes the brand-product link
3. Medusa calls product creation compensation
4. Product is deleted from database
5. Everything is rolled back - all or nothing

## Next Steps

Once this checkpoint passes:

1. **Module Link** defined
2. **Workflow Hook** consuming productsCreated
3. **Next**: Query Linked Records (Part 3 of Lesson 2)

The link is now created automatically when products are created. Next, we'll learn how to query linked data to retrieve brands with their products and vice versa.

**Ready to continue?** Let me know when all checks pass, and we'll move on to querying linked records.
