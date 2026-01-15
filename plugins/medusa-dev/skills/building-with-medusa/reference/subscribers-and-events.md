# Subscribers and Events

Subscribers are asynchronous functions that execute when specific events are emitted. Use them to perform actions after commerce operations, like sending confirmation emails when an order is placed.

## Contents
- [When to Use Subscribers](#when-to-use-subscribers)
- [Creating a Subscriber](#creating-a-subscriber)
- [Common Commerce Events](#common-commerce-events)
- [Accessing Event Data](#accessing-event-data)
- [Triggering Custom Events](#triggering-custom-events)
- [Best Practices](#best-practices)

## When to Use Subscribers

Use subscribers when you need to **react to events** that happen in your application:

- ✅ Send confirmation emails when orders are placed
- ✅ Sync data to external systems when products are updated
- ✅ Trigger webhooks when entities change
- ✅ Update analytics when customers are created
- ✅ Perform non-blocking side effects

**Don't use subscribers for:**
- ❌ Periodic tasks (use [scheduled jobs](scheduled-jobs.md) instead)
- ❌ Operations that must block the main flow (use workflows instead)
- ❌ Scheduling future tasks (subscribers execute immediately)

**Subscribers vs Scheduled Jobs:**
- **Subscriber**: Reacts to `order.placed` event and sends confirmation email (event-driven)
- **Scheduled Job**: Finds abandoned carts every 6 hours and sends emails (polling pattern)

## Creating a Subscriber

Create a TypeScript file in the `src/subscribers/` directory:

```typescript
// src/subscribers/order-placed.ts
import { SubscriberArgs, type SubscriberConfig } from "@medusajs/framework"

export default async function orderPlacedHandler({
  event: { eventName, data },
  container,
}: SubscriberArgs<{ id: string }>) {
  const logger = container.resolve("logger")

  logger.info(`Order ${data.id} was placed`)

  // Resolve services
  const orderService = container.resolve("order")
  const notificationService = container.resolve("notification")

  // Retrieve full order data
  const order = await orderService.retrieveOrder(data.id, {
    relations: ["customer", "items"],
  })

  // Send confirmation email
  await notificationService.createNotifications({
    to: order.customer.email,
    template: "order-confirmation",
    channel: "email",
    data: { order },
  })

  logger.info(`Confirmation email sent for order ${data.id}`)
}

export const config: SubscriberConfig = {
  event: "order.placed", // Single event
}
```

### Listening to Multiple Events

```typescript
// src/subscribers/product-changes.ts
import { SubscriberArgs, type SubscriberConfig } from "@medusajs/framework"

export default async function productChangesHandler({
  event: { eventName, data },
  container,
}: SubscriberArgs<{ id: string }>) {
  const logger = container.resolve("logger")

  logger.info(`Product event: ${eventName} for product ${data.id}`)

  // Handle different events
  switch (eventName) {
    case "product.created":
      // Handle product creation
      break
    case "product.updated":
      // Handle product update
      break
    case "product.deleted":
      // Handle product deletion
      break
  }
}

export const config: SubscriberConfig = {
  event: ["product.created", "product.updated", "product.deleted"],
}
```

## Common Commerce Events

**⚠️ IMPORTANT**: Event data typically contains only the ID of the affected entity. You must retrieve the full data if needed.

### Order Events

```typescript
"order.placed" // Order was placed
"order.updated" // Order was updated
"order.canceled" // Order was canceled
"order.completed" // Order was completed
"order.shipment_created" // Shipment was created for order
```

### Product Events

```typescript
"product.created" // Product was created
"product.updated" // Product was updated
"product.deleted" // Product was deleted
```

### Customer Events

```typescript
"customer.created" // Customer was created
"customer.updated" // Customer was updated
```

### Cart Events

```typescript
"cart.created" // Cart was created
"cart.updated" // Cart was updated
```

### Auth Events

```typescript
"auth.password_reset" // Password reset was requested
```

### Invite Events

```typescript
"invite.created" // Invite was created (for admin users)
```

**For a complete list of events**, ask MedusaDocs for the specific module's events.

## Accessing Event Data

### Event Data Structure

```typescript
interface SubscriberArgs<T> {
  event: {
    eventName: string // e.g., "order.placed"
    data: T // Event payload (usually contains { id: string })
  }
  container: MedusaContainer // DI container
}
```

### Retrieving Full Entity Data

**⚠️ IMPORTANT**: The `data` object typically only contains the entity ID. Retrieve the full entity data using services or query:

```typescript
// src/subscribers/order-placed.ts
import { SubscriberArgs, type SubscriberConfig } from "@medusajs/framework"

export default async function orderPlacedHandler({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  const logger = container.resolve("logger")
  const query = container.resolve("query")

  // data.id contains the order ID
  logger.info(`Handling order.placed event for order: ${data.id}`)

  // Retrieve full order data with relations
  const { data: orders } = await query.graph({
    entity: "order",
    fields: [
      "id",
      "email",
      "total",
      "customer.*",
      "items.*",
      "items.product.*",
    ],
    filters: {
      id: data.id,
    },
  })

  const order = orders[0]

  // Now you have the full order data
  logger.info(`Order total: ${order.total}`)
  logger.info(`Customer email: ${order.customer.email}`)
}

export const config: SubscriberConfig = {
  event: "order.placed",
}
```

### Using Module Services

```typescript
export default async function productUpdatedHandler({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  const productService = container.resolve("product")

  // Retrieve product using service
  const product = await productService.retrieveProduct(data.id, {
    select: ["id", "title", "status"],
    relations: ["variants"],
  })

  // Process product
}
```

## Triggering Custom Events

Emit custom events from workflows using the `emitEventStep`:

```typescript
// src/workflows/create-review.ts
import { createWorkflow, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import { emitEventStep } from "@medusajs/medusa/core-flows"

const createReviewWorkflow = createWorkflow(
  "create-review",
  function (input: { product_id: string; rating: number }) {
    // Create review step
    const review = createReviewStep(input)

    // Emit custom event
    emitEventStep({
      eventName: "review.created",
      data: {
        id: review.id,
        product_id: input.product_id,
        rating: input.rating,
      },
    })

    return new WorkflowResponse({ review })
  }
)

export default createReviewWorkflow
```

Then create a subscriber for the custom event:

```typescript
// src/subscribers/review-created.ts
import { SubscriberArgs, type SubscriberConfig } from "@medusajs/framework"

export default async function reviewCreatedHandler({
  event: { data },
  container,
}: SubscriberArgs<{ id: string; product_id: string; rating: number }>) {
  const logger = container.resolve("logger")
  const query = container.resolve("query")

  logger.info(`Review ${data.id} created for product ${data.product_id}`)

  // If rating is low, notify support
  if (data.rating <= 2) {
    const notificationService = container.resolve("notification")
    await notificationService.createNotifications({
      to: "support@example.com",
      template: "low-rating-alert",
      channel: "email",
      data: {
        review_id: data.id,
        product_id: data.product_id,
        rating: data.rating,
      },
    })
  }
}

export const config: SubscriberConfig = {
  event: "review.created",
}
```

## Best Practices

### 1. Always Use Logging

```typescript
export default async function mySubscriber({
  event: { eventName, data },
  container,
}: SubscriberArgs<{ id: string }>) {
  const logger = container.resolve("logger")

  logger.info(`Handling ${eventName} for ${data.id}`)

  try {
    // Subscriber logic
    logger.info(`Successfully handled ${eventName}`)
  } catch (error) {
    logger.error(`Failed to handle ${eventName}: ${error.message}`)
  }
}
```

### 2. Handle Errors Gracefully

Subscribers run asynchronously and don't block the main flow. Log errors but don't throw:

```typescript
// ✅ GOOD: Catches errors and logs
export default async function mySubscriber({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  const logger = container.resolve("logger")

  try {
    // Subscriber logic that might fail
    await sendEmail(data.id)
  } catch (error) {
    logger.error(`Failed to send email: ${error.message}`)
    // Don't throw - subscriber completes gracefully
  }
}
```

### 3. Keep Subscribers Fast and Non-Blocking

Subscribers should perform quick operations. For long-running tasks, consider:
- Queuing the task for background processing
- Using scheduled jobs instead
- Breaking the work into smaller steps

```typescript
// ✅ GOOD: Quick operation
export default async function orderPlacedHandler({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  const notificationService = container.resolve("notification")

  // Quick: Queue email for sending
  await notificationService.createNotifications({
    to: "customer@example.com",
    template: "order-confirmation",
      channel: "email",
    data: { order_id: data.id },
  })
}
```

### 4. Use Workflows for Mutations

If your subscriber needs to perform mutations, use workflows:

```typescript
// ✅ GOOD: Uses workflow for mutations
import { syncProductWorkflow } from "../workflows/sync-product"

export default async function productCreatedHandler({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  const logger = container.resolve("logger")

  // Execute workflow to sync to external system
  try {
    await syncProductWorkflow(container).run({
      input: { product_id: data.id },
    })
    logger.info(`Product ${data.id} synced successfully`)
  } catch (error) {
    logger.error(`Failed to sync product ${data.id}: ${error.message}`)
  }
}
```

### 5. Avoid Infinite Event Loops

Be careful when subscribing to events that trigger more events:

```typescript
// ❌ BAD: Can cause infinite loop
export default async function productUpdatedHandler({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  const productService = container.resolve("product")

  // This triggers another product.updated event!
  await productService.updateProducts({
    id: data.id,
    metadata: { last_updated: new Date() },
  })
}

// ✅ GOOD: Add guard condition
export default async function productUpdatedHandler({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  const logger = container.resolve("logger")
  const query = container.resolve("query")

  // Retrieve product to check if we should update
  const { data: products } = await query.graph({
    entity: "product",
    fields: ["id", "metadata"],
    filters: { id: data.id },
  })

  const product = products[0]

  // Guard: Only update if not already processed
  if (!product.metadata?.processed) {
    const productService = container.resolve("product")
    await productService.updateProducts({
      id: data.id,
      metadata: { processed: true },
    })
  }
}
```

### 6. Make Subscribers Idempotent

Subscribers might be called multiple times for the same event. Design them to handle this:

```typescript
export default async function orderPlacedHandler({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  const logger = container.resolve("logger")
  const myService = container.resolve("my-service")

  // Check if we've already processed this order
  const processed = await myService.isOrderProcessed(data.id)

  if (processed) {
    logger.info(`Order ${data.id} already processed, skipping`)
    return
  }

  // Process order
  await myService.processOrder(data.id)

  // Mark as processed
  await myService.markOrderAsProcessed(data.id)
}
```

## Complete Example: Order Confirmation Email

```typescript
// src/subscribers/order-placed.ts
import { SubscriberArgs, type SubscriberConfig } from "@medusajs/framework"

export default async function sendOrderConfirmationEmail({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  const logger = container.resolve("logger")

  logger.info(`Sending order confirmation for order: ${data.id}`)

  try {
    const query = container.resolve("query")

    // Retrieve full order data
    const { data: orders } = await query.graph({
      entity: "order",
      fields: [
        "id",
        "display_id",
        "email",
        "total",
        "currency_code",
        "customer.first_name",
        "customer.last_name",
        "items.*",
        "items.product.title",
        "shipping_address.*",
      ],
      filters: {
        id: data.id,
      },
    })

    if (!orders || orders.length === 0) {
      logger.error(`Order ${data.id} not found`)
      return
    }

    const order = orders[0]

    // Send confirmation email
    const notificationService = container.resolve("notification")
    await notificationService.createNotifications({
      to: order.email,
      template: "order-confirmation",
      channel: "email",
      data: {
        order_id: order.display_id,
        customer_name: `${order.customer.first_name} ${order.customer.last_name}`,
        items: order.items,
        total: order.total,
        currency: order.currency_code,
        shipping_address: order.shipping_address,
      },
    })

    logger.info(`Order confirmation email sent to ${order.email}`)
  } catch (error) {
    logger.error(
      `Failed to send order confirmation for ${data.id}: ${error.message}`
    )
  }
}

export const config: SubscriberConfig = {
  event: "order.placed",
}
```