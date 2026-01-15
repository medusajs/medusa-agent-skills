# Data Loading Principles and Patterns

## Contents
- [Fundamental Rules](#fundamental-rules)
- [Think Before You Code Checklist](#think-before-you-code-checklist)
- [Common Mistake vs Correct Pattern](#common-mistake-vs-correct-pattern)
- [Working with Tanstack Query](#working-with-tanstack-query)
- [Fetching Data with useQuery](#fetching-data-with-usequery)
  - [Basic Query](#basic-query)
  - [Paginated Query](#paginated-query)
  - [Query with Dependencies](#query-with-dependencies)
  - [Fetching Multiple Items by IDs](#fetching-multiple-items-by-ids)
- [Updating Data with useMutation](#updating-data-with-usemutation)
  - [Basic Mutation](#basic-mutation)
  - [Mutation with Loading State](#mutation-with-loading-state)
  - [Create Mutation](#create-mutation)
  - [Delete Mutation](#delete-mutation)
- [Cache Invalidation Guidelines](#cache-invalidation-guidelines)
- [Important Notes about Metadata](#important-notes-about-metadata)
- [Common Patterns](#common-patterns)
  - [Pattern: Fetching Data with Pagination](#pattern-fetching-data-with-pagination)
  - [Pattern: Search with Debounce](#pattern-search-with-debounce)
  - [Pattern: Updating Metadata with useMutation](#pattern-updating-metadata-with-usemutation)
- [Common Issues & Solutions](#common-issues--solutions)
- [Complete Example: Widget with Separate Queries](#complete-example-widget-with-separate-queries)

## Fundamental Rules

1. **Display data must load on mount** - Any data shown in the widget's main UI must be fetched when the component mounts, not conditionally
2. **Separate concerns** - Modal/form data queries should be independent from display data queries
3. **Handle reference data properly** - When storing IDs/references (in metadata or elsewhere), you must fetch the full entities to display them
4. **Always show loading states** - Users should see loading indicators, not empty states, while data is being fetched
5. **Invalidate the right queries** - After mutations, invalidate the queries that provide display data, not just the modal queries

## Think Before You Code Checklist

Before implementing any widget that displays data:

- [ ] What data needs to be visible immediately?
- [ ] Where is this data stored? (metadata, separate endpoint, related entities)
- [ ] If storing IDs, how will I fetch the full entities for display?
- [ ] Are my display queries separate from interaction queries?
- [ ] Have I added loading states for all data fetches?
- [ ] Which queries need invalidation after updates to refresh the display?

## Common Mistake vs Correct Pattern

### ❌ WRONG - Single query for both display and modal:

```tsx
// This breaks on page refresh!
const { data } = useQuery({
  queryFn: () => sdk.admin.product.list(),
  enabled: modalOpen, // Display won't work on mount!
})

// Trying to display filtered data from modal query
const displayItems = data?.filter((item) => ids.includes(item.id)) // No data until modal opens
```

**Why this is wrong:**
- On page refresh, modal is closed, so query doesn't run
- User sees empty state instead of their data
- Display depends on modal interaction

### ✅ CORRECT - Separate queries with proper invalidation:

```tsx
// Display data - loads immediately
const { data: displayData } = useQuery({
  queryFn: () => fetchDisplayData(),
  queryKey: ["display-data", product.id],
  // No 'enabled' condition - loads on mount
})

// Modal data - loads when needed
const { data: modalData } = useQuery({
  queryFn: () => fetchModalData(),
  queryKey: ["modal-data"],
  enabled: modalOpen, // OK for modal-only data
})

// Mutation with proper cache invalidation
const updateMutation = useMutation({
  mutationFn: updateFunction,
  onSuccess: () => {
    // Invalidate display data query to refresh UI
    queryClient.invalidateQueries({ queryKey: ["display-data", product.id] })
    // Also invalidate the entity if it caches the data
    queryClient.invalidateQueries({ queryKey: ["product", product.id] })
  },
})
```

**Why this is correct:**
- Display query runs immediately on component mount
- Modal query only runs when needed
- Proper invalidation ensures UI updates after changes
- Each query has a clear, separate responsibility

## Working with Tanstack Query

Admin widgets and routes have Tanstack Query pre-configured.

**⚠️ pnpm Users**: You MUST install `@tanstack/react-query` BEFORE using `useQuery` or `useMutation`. Install with exact version from dashboard:

```bash
pnpm list @tanstack/react-query --depth=10 | grep @medusajs/dashboard
pnpm add @tanstack/react-query@[exact-version]
```

**npm/yarn Users**: DO NOT install `@tanstack/react-query` - it's already available through dashboard dependencies.

## Fetching Data with useQuery

### Basic Query

```tsx
import { useQuery } from "@tanstack/react-query"
import { sdk } from "../lib/client"

const { data, isLoading, error } = useQuery({
  queryFn: () => sdk.admin.product.retrieve(productId, {
    fields: "+metadata,+variants.*",
  }),
  queryKey: ["product", productId],
})
```

### Paginated Query

```tsx
const limit = 15
const offset = pagination.pageIndex * limit

const { data: products } = useQuery({
  queryFn: () =>
    sdk.admin.product.list({
      limit,
      offset,
      q: searchTerm, // for search
    }),
  queryKey: ["products", limit, offset, searchTerm],
  keepPreviousData: true, // Prevents UI flicker during pagination
})
```

### Query with Dependencies

```tsx
// Only fetch if productId exists
const { data } = useQuery({
  queryFn: () => sdk.admin.product.retrieve(productId),
  queryKey: ["product", productId],
  enabled: !!productId, // Only run when productId is truthy
})
```

### Fetching Multiple Items by IDs

```tsx
// For display - fetch specific items by IDs
const { data: displayProducts } = useQuery({
  queryFn: async () => {
    if (selectedIds.length === 0) return { products: [] }

    const response = await sdk.admin.product.list({
      id: selectedIds, // Fetch only the selected products
      limit: selectedIds.length,
    })
    return response
  },
  queryKey: ["related-products-display", selectedIds],
  enabled: selectedIds.length > 0, // Only fetch if there are IDs
})
```

## Updating Data with useMutation

### Basic Mutation

```tsx
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "@medusajs/ui"

const queryClient = useQueryClient()

const updateProduct = useMutation({
  mutationFn: (payload) => sdk.admin.product.update(productId, payload),
  onSuccess: () => {
    // Invalidate and refetch
    queryClient.invalidateQueries({ queryKey: ["product", productId] })
    toast.success("Product updated successfully")
  },
  onError: (error) => {
    toast.error(error.message || "Failed to update product")
  },
})

// Usage
const handleSave = () => {
  updateProduct.mutate({
    metadata: {
      ...existingMetadata,
      new_field: "value",
    },
  })
}
```

### Mutation with Loading State

```tsx
<Button
  onClick={handleSave}
  isLoading={updateProduct.isPending}
>
  Save
</Button>
```

### Create Mutation

```tsx
const createProduct = useMutation({
  mutationFn: (data) => sdk.admin.product.create(data),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ["products"] })
    toast.success("Product created successfully")
    setOpen(false)
  },
})
```

### Delete Mutation

```tsx
const deleteProduct = useMutation({
  mutationFn: (id) => sdk.admin.product.delete(id),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ["products"] })
    toast.success("Product deleted")
  },
})
```

## Cache Invalidation Guidelines

After mutations, invalidate the queries that affect what the user sees:

```tsx
onSuccess: () => {
  // Invalidate the entity itself if it stores the data
  queryClient.invalidateQueries({ queryKey: ["product", productId] })

  // Invalidate display-specific queries
  queryClient.invalidateQueries({ queryKey: ["related-products", productId] })

  // Don't need to invalidate modal selection queries
  // queryClient.invalidateQueries({ queryKey: ["products-list"] }) // Not needed
}
```

**Key Points:**

- Use specific query keys with IDs for targeted invalidation
- Invalidate both the entity and display data queries when needed
- Consider what the user sees and ensure those queries refresh
- Modal/selection queries typically don't need invalidation

## Important Notes about Metadata

- When updating nested objects in metadata, pass the entire object (Medusa doesn't merge nested objects)
- To remove a metadata property, set it to an empty string
- Metadata is stored as JSONB in the database

**Example: Updating Metadata**

```tsx
// ✅ CORRECT - Spread existing metadata
updateProduct.mutate({
  metadata: {
    ...product.metadata,
    new_field: "value",
  },
})

// ❌ WRONG - Overwrites all metadata
updateProduct.mutate({
  metadata: {
    new_field: "value", // All other fields lost!
  },
})
```

## Common Patterns

### Pattern: Fetching Data with Pagination

```tsx
const limit = 15
const offset = pagination.pageIndex * limit

const { data } = useQuery({
  queryFn: () => sdk.admin.product.list({ limit, offset }),
  queryKey: ["products", limit, offset],
  keepPreviousData: true, // Prevents UI flicker during pagination
})
```

### Pattern: Search with Debounce

```tsx
import { useDebouncedValue } from "@mantine/hooks" // or implement your own

const [search, setSearch] = useState("")
const [debouncedSearch] = useDebouncedValue(search, 300)

const { data } = useQuery({
  queryFn: () => sdk.admin.product.list({ q: debouncedSearch }),
  queryKey: ["products", debouncedSearch],
})
```

### Pattern: Updating Metadata with useMutation

```tsx
const updateMetadata = useMutation({
  mutationFn: (metadata) => sdk.admin.product.update(productId, { metadata }),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ["product", productId] })
    toast.success("Updated successfully")
  },
})
```

## Common Issues & Solutions

### "No QueryClient set, use QueryClientProvider to set one"

- **pnpm users**: You forgot to install `@tanstack/react-query` before implementing. Install it now with the exact version from dashboard
- **npm/yarn users**: You incorrectly installed `@tanstack/react-query` - remove it from package.json
- Never wrap your component in QueryClientProvider - it's already provided

### Search not filtering results

- The search happens server-side via the `q` parameter
- Make sure to pass the search value in your queryFn:

```tsx
queryFn: () => sdk.admin.product.list({ q: searchValue })
```

### Metadata updates not working

- Always pass the complete metadata object (partial updates aren't merged)
- To remove a field, set it to an empty string, not null or undefined

### Widget not refreshing after mutation

- Use queryClient.invalidateQueries() with the correct query key
- Ensure your query key includes all dependencies (search, pagination, etc.)

### Data shows empty on page refresh

- Your query has `enabled: modalOpen` or similar condition
- Display data should NEVER be conditionally enabled based on UI state
- Move conditional queries to modals/forms only

## Complete Example: Widget with Separate Queries

```tsx
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useState, useMemo } from "react"
import { Container, Heading, Button, FocusModal, toast } from "@medusajs/ui"
import { sdk } from "../lib/client"

const RelatedProductsWidget = ({ data: product }) => {
  const [open, setOpen] = useState(false)
  const queryClient = useQueryClient()

  // Parse existing related product IDs from metadata
  const relatedIds = useMemo(() => {
    if (product?.metadata?.related_product_ids) {
      try {
        const ids = JSON.parse(product.metadata.related_product_ids)
        return Array.isArray(ids) ? ids : []
      } catch {
        return []
      }
    }
    return []
  }, [product?.metadata?.related_product_ids])

  // Query 1: Fetch selected products for display (loads on mount)
  const { data: displayProducts } = useQuery({
    queryFn: async () => {
      if (relatedIds.length === 0) return { products: [] }
      const response = await sdk.admin.product.list({
        id: relatedIds,
        limit: relatedIds.length,
      })
      return response
    },
    queryKey: ["related-products-display", relatedIds],
    enabled: relatedIds.length > 0,
  })

  // Query 2: Fetch products for modal selection (only when modal is open)
  const { data: modalProducts, isLoading } = useQuery({
    queryFn: () => sdk.admin.product.list({ limit: 10, offset: 0 }),
    queryKey: ["products-selection"],
    enabled: open, // Only load when modal is open
  })

  // Mutation to update the product metadata
  const updateProduct = useMutation({
    mutationFn: (relatedProductIds) => {
      return sdk.admin.product.update(product.id, {
        metadata: {
          ...product.metadata,
          related_product_ids: JSON.stringify(relatedProductIds),
        },
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["product", product.id] })
      queryClient.invalidateQueries({ queryKey: ["related-products-display"] })
      toast.success("Related products updated")
      setOpen(false)
    },
  })

  return (
    <Container>
      <div className="flex items-center justify-between">
        <Heading>Related Products</Heading>
        <Button onClick={() => setOpen(true)}>Edit</Button>
      </div>

      {/* Display current selection */}
      <div>
        {displayProducts?.products.map((p) => (
          <div key={p.id}>{p.title}</div>
        ))}
      </div>

      {/* Modal for selection */}
      <FocusModal open={open} onOpenChange={setOpen}>
        {/* Modal content with selection UI */}
      </FocusModal>
    </Container>
  )
}
```
