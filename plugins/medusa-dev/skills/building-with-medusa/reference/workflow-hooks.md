# Workflow Hooks (Advanced)

Workflow hooks let you inject custom logic into existing Medusa workflows without recreating them. Use them to extend core commerce flows.

**Note:** Hooks run in-band (synchronously within the workflow). If your task can run in the background, use a subscriber instead for better performance.

## Basic Hook Pattern

```typescript
// src/workflows/hooks/product-created.ts
import { createProductsWorkflow } from "@medusajs/medusa/core-flows"
import { StepResponse } from "@medusajs/framework/workflows-sdk"

createProductsWorkflow.hooks.productsCreated(
  // Hook handler
  async ({ products, additional_data }, { container }) => {
    if (!additional_data?.brand_id) {
      return new StepResponse([], [])
    }

    const link = container.resolve("link")

    // Link products to brand
    const linkData = products.map((product) => ({
      product: { product_id: product.id },
      brand: { brand_id: additional_data.brand_id },
    }))

    await link.create(linkData)
    return new StepResponse(linkData, linkData)
  },
  // Compensation (runs if workflow fails after this point)
  async (linkData, { container }) => {
    const link = container.resolve("link")
    await link.dismiss(linkData)
  }
)
```

## Common Workflow Hooks

- `createProductsWorkflow.hooks.productsCreated` - After products are created
- `createOrderWorkflow.hooks.orderCreated` - After an order is created
- Ask MedusaDocs for specific workflow hooks and their input parameters

## When to Use Hooks vs Subscribers

**Use workflow hooks when:**
- The logic must complete before the workflow finishes
- You need rollback/compensation capabilities
- The operation is critical to the workflow's success

**Use subscribers when:**
- The logic can run asynchronously in the background
- You don't need to block the main workflow
- Better performance is needed (hooks are synchronous)

## Hook Best Practices

1. **Return StepResponse**: Always wrap your return value
2. **Implement compensation**: Provide rollback logic for the compensation function
3. **Handle missing data gracefully**: Check for optional data and return early if not present
4. **Keep hooks lightweight**: For heavy operations, consider using subscribers instead
