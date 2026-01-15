# Frontend SDK Integration

## Contents
- [Frontend SDK Pattern](#frontend-sdk-pattern)
  - [Locating the SDK](#locating-the-sdk)
  - [Using sdk.client.fetch()](#using-sdkclientfetch)
- [React Query Pattern](#react-query-pattern)
- [Query Key Best Practices](#query-key-best-practices)
- [Error Handling](#error-handling)
- [Optimistic Updates](#optimistic-updates)

This guide covers how to integrate Medusa custom API routes with frontend applications using the Medusa SDK and React Query.

**Note:** API routes are also referred to as "endpoints" - these terms are interchangeable.

## Frontend SDK Pattern

### Locating the SDK

**IMPORTANT:** Never hardcode SDK import paths. Always locate where the SDK is instantiated in the project first.

Look for `@medusajs/js-sdk`

The SDK instance is typically exported as `sdk`:

```typescript
import { sdk } from "[LOCATE IN PROJECT]"
```

### Using sdk.client.fetch()

**⚠️ CRITICAL: The SDK handles JSON serialization automatically. NEVER use JSON.stringify() on the body.**

Call custom API routes using the SDK:

```typescript
import { sdk } from "[LOCATE SDK INSTANCE IN PROJECT]"

// ✅ CORRECT - Pass object directly
const result = await sdk.client.fetch("/store/my-route", {
  method: "POST",
  body: {
    email: "user@example.com",
    name: "John Doe",
  },
})

// ❌ WRONG - Don't use JSON.stringify
const result = await sdk.client.fetch("/store/my-route", {
  method: "POST",
  body: JSON.stringify({  // ❌ DON'T DO THIS!
    email: "user@example.com",
  }),
})
```

**Key points:**

- **The SDK handles JSON serialization automatically** - just pass plain objects
- **NEVER use JSON.stringify()** - this will break the request
- No need to set Content-Type headers - SDK adds them
- Session/JWT authentication is handled automatically
- Publishable API key is automatically added

## React Query Pattern

Use `useQuery` for GET requests and `useMutation` for POST/DELETE:

```typescript
import { sdk } from "[LOCATE SDK INSTANCE IN PROJECT]"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"

function MyComponent({ userId }: { userId: string }) {
  const queryClient = useQueryClient()

  // GET request - fetching data
  const { data, isLoading } = useQuery({
    queryKey: ["my-data", userId],
    queryFn: () => sdk.client.fetch(`/store/my-route?userId=${userId}`),
    enabled: !!userId,
  })

  // POST request - mutation with cache invalidation
  const mutation = useMutation({
    mutationFn: (input: { email: string }) =>
      sdk.client.fetch("/store/my-route", { method: "POST", body: input }),
    onSuccess: () => {
      // Invalidate and refetch related queries
      queryClient.invalidateQueries({ queryKey: ["my-data"] })
    },
  })

  if (isLoading) return <p>Loading...</p>

  return (
    <div>
      <p>{data?.title}</p>
      <button
        onClick={() => mutation.mutate({ email: "test@example.com" })}
        disabled={mutation.isPending}
      >
        {mutation.isPending ? "Loading..." : "Submit"}
      </button>
      {mutation.isError && <p>Error occurred</p>}
    </div>
  )
}
```

**Key states:** `isLoading`, `isPending`, `isSuccess`, `isError`, `error`

## Query Key Best Practices

Structure query keys for effective cache management:

```typescript
// Good: Hierarchical structure
queryKey: ["products", productId]
queryKey: ["products", "list", { page, filters }]

// Invalidate all product queries
queryClient.invalidateQueries({ queryKey: ["products"] })

// Invalidate specific product
queryClient.invalidateQueries({ queryKey: ["products", productId] })
```

## Error Handling

Handle API errors gracefully:

```typescript
const mutation = useMutation({
  mutationFn: (input) => sdk.client.fetch("/store/my-route", {
    method: "POST",
    body: input
  }),
  onError: (error) => {
    console.error("Mutation failed:", error)
    // Show error message to user
  },
})

// In component
{mutation.isError && (
  <p className="error">
    {mutation.error?.message || "An error occurred"}
  </p>
)}
```

## Optimistic Updates

Update UI immediately before server confirms:

```typescript
const mutation = useMutation({
  mutationFn: (newItem) =>
    sdk.client.fetch("/store/items", { method: "POST", body: newItem }),
  onMutate: async (newItem) => {
    // Cancel outgoing refetches
    await queryClient.cancelQueries({ queryKey: ["items"] })

    // Snapshot previous value
    const previousItems = queryClient.getQueryData(["items"])

    // Optimistically update
    queryClient.setQueryData(["items"], (old) => [...old, newItem])

    // Return context with snapshot
    return { previousItems }
  },
  onError: (err, newItem, context) => {
    // Rollback on error
    queryClient.setQueryData(["items"], context.previousItems)
  },
  onSettled: () => {
    // Refetch after mutation
    queryClient.invalidateQueries({ queryKey: ["items"] })
  },
})
```
