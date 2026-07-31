# Architecture Deep Dive: Admin Dashboard Integration

The Medusa Admin dashboard is a React application that connects to your backend API. Understanding how to extend it with widgets and UI routes is essential for building complete features.

## Admin Dashboard Architecture

```
┌─────────────────────────────────────────────────┐
│  Admin Dashboard (React + Vite)                 │
│  Running at: http://localhost:9000/app          │
│                                                 │
│  ┌──────────────┐    ┌──────────────┐          │
│  │   Widgets    │    │  UI Routes   │          │
│  │  (Inject)    │    │  (New Pages) │          │
│  └───────┬──────┘    └───────┬──────┘          │
│          │                   │                  │
│          └────────┬──────────┘                  │
│                   │                             │
│                   ▼                             │
│           ┌──────────────┐                      │
│           │   JS SDK     │                      │
│           └──────┬───────┘                      │
└──────────────────┼─────────────────────────────┘
                   │ HTTP Requests
                   ▼
┌─────────────────────────────────────────────────┐
│  Backend API (Node.js)                          │
│  Running at: http://localhost:9000              │
│                                                 │
│  ┌──────────────┐    ┌──────────────┐          │
│  │  API Routes  │    │  Workflows   │          │
│  └──────┬───────┘    └───────┬──────┘          │
│         │                    │                  │
│         └──────────┬─────────┘                  │
│                    ▼                            │
│           ┌──────────────┐                      │
│           │   Modules    │                      │
│           └──────────────┘                      │
└─────────────────────────────────────────────────┘
```

## Widgets vs. UI Routes

### Widgets: Extend Existing Pages

**What**: React components injected into existing admin pages at predefined zones

**When to use**:
- Adding information to existing pages
- Displaying related data
- Extending core entities (products, orders, customers)

**Examples**:
- Show brand on product detail page
- Show reviews on product detail page
- Show shipping status on order detail page

```typescript
// Widget Example
import { defineWidgetConfig } from "@medusajs/admin-sdk"

const ProductBrandWidget = ({ data: product }) => {
  return <Container>Brand: {product.brand?.name}</Container>
}

export const config = defineWidgetConfig({
  zone: "product.details",  // Where to inject
})

export default ProductBrandWidget
```

### UI Routes: Create New Pages

**What**: Completely new pages in the admin dashboard

**When to use**:
- Managing custom entities
- Custom dashboards or reports
- Standalone administrative interfaces

**Examples**:
- Brands management page
- Reviews management page
- Custom analytics dashboard

```typescript
// UI Route Example
import { defineRouteConfig } from "@medusajs/admin-sdk"

const BrandsPage = () => {
  return (
    <Container>
      <Heading>Brands</Heading>
      <DataTable data={brands} />
    </Container>
  )
}

export const config = defineRouteConfig({
  label: "Brands",
  icon: TagSolid,
})

export default BrandsPage
```

## Key Differences

| Aspect | Widgets | UI Routes |
|--------|---------|-----------|
| Purpose | Extend existing pages | Create new pages |
| Location | Injected into zones | New URLs |
| Navigation | No sidebar entry | Sidebar menu item |
| File path | `src/admin/widgets/` | `src/admin/routes/` |
| Configuration | `defineWidgetConfig()` | `defineRouteConfig()` |
| Props | Receive page entity | No special props |

## Widget Integration Patterns

### Pattern 1: Display Widget (Read-Only)

Show information from linked entities:

```typescript
// Product Brand Widget - Display Only
const ProductBrandWidget = ({ data: product }: DetailWidgetProps<AdminProduct>) => {
  const { data: queryResult } = useQuery({
    queryFn: () => sdk.admin.product.retrieve(product.id, {
      fields: "+brand.*",  // Include brand relation
    }),
    queryKey: ["product", product.id, "brand"],
  })

  const brand = (queryResult?.product as ProductWithBrand)?.brand

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading level="h2">Brand</Heading>
      </div>
      <div className="px-6 py-4">
        <Text>{brand?.name || "-"}</Text>
      </div>
    </Container>
  )
}

export const config = defineWidgetConfig({
  zone: "product.details",
})
```

**Key points**:
- Uses `DetailWidgetProps<T>` for type safety
- Receives entity as `data` prop
- Uses React Query for data fetching
- Uses `fields` parameter to include relations

### Pattern 2: Interactive Widget (with Actions)

Widget with buttons and user actions:

```typescript
// Product Brand Widget - With Actions
const ProductBrandWidget = ({ data: product }: DetailWidgetProps<AdminProduct>) => {
  const [isEditing, setIsEditing] = useState(false)

  const { data: queryResult } = useQuery({
    queryFn: () => sdk.admin.product.retrieve(product.id, {
      fields: "+brand.*",
    }),
    queryKey: ["product", product.id, "brand"],
  })

  const updateMutation = useMutation({
    mutationFn: (brandId: string) => {
      return sdk.client.fetch(`/admin/products/${product.id}/brand`, {
        method: "POST",
        body: JSON.stringify({ brand_id: brandId }),
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["product", product.id, "brand"])
      setIsEditing(false)
    },
  })

  if (isEditing) {
    return (
      <Container>
        <BrandSelector
          onSelect={(brandId) => updateMutation.mutate(brandId)}
          onCancel={() => setIsEditing(false)}
        />
      </Container>
    )
  }

  return (
    <Container>
      <div className="flex items-center justify-between">
        <Heading level="h2">Brand</Heading>
        <Button onClick={() => setIsEditing(true)}>Edit</Button>
      </div>
      <Text>{brand?.name || "-"}</Text>
    </Container>
  )
}
```

**Key points**:
- Local state for edit mode
- Uses `useMutation` for updates
- Invalidates query cache after mutation
- Separate UI for view/edit modes

### Pattern 3: Widget with Modal

Complex forms in a modal:

```typescript
// Product Brand Widget - With Modal
const ProductBrandWidget = ({ data: product }: DetailWidgetProps<AdminProduct>) => {
  const [modalOpen, setModalOpen] = useState(false)

  const { data: queryResult } = useQuery({
    queryFn: () => sdk.admin.product.retrieve(product.id, {
      fields: "+brand.*",
    }),
    queryKey: ["product", product.id, "brand"],
  })

  return (
    <>
      <Container>
        <div className="flex items-center justify-between">
          <Heading level="h2">Brand</Heading>
          <Button onClick={() => setModalOpen(true)}>Change Brand</Button>
        </div>
        <Text>{brand?.name || "-"}</Text>
      </Container>

      {modalOpen && (
        <ChangeBrandModal
          product={product}
          currentBrand={brand}
          onClose={() => setModalOpen(false)}
        />
      )}
    </>
  )
}
```

## UI Route Integration Patterns

### Pattern 1: List Page with DataTable

Most common pattern for management pages:

```typescript
// Brands List Page
import { defineRouteConfig } from "@medusajs/admin-sdk"
import { TagSolid } from "@medusajs/icons"
import { Container, Heading, DataTable, useDataTable } from "@medusajs/ui"
import { useQuery } from "@tanstack/react-query"
import { sdk } from "../../lib/sdk"

const BrandsPage = () => {
  const [pagination, setPagination] = useState({
    pageSize: 15,
    pageIndex: 0,
  })

  const { data, isLoading } = useQuery({
    queryFn: () => sdk.client.fetch(`/admin/brands`, {
      query: {
        limit: pagination.pageSize,
        offset: pagination.pageIndex * pagination.pageSize,
      },
    }),
    queryKey: ["brands", pagination.pageSize, pagination.pageIndex],
  })

  const table = useDataTable({
    columns: [
      { accessor: "id", header: "ID" },
      { accessor: "name", header: "Name" },
      { accessor: "products", header: "Products", cell: (props) => props.getValue()?.length || 0 },
    ],
    data: data?.brands || [],
    rowCount: data?.count || 0,
    isLoading,
    pagination: {
      state: pagination,
      onPaginationChange: setPagination,
    },
  })

  return (
    <Container>
      <DataTable instance={table}>
        <DataTable.Toolbar>
          <Heading>Brands</Heading>
        </DataTable.Toolbar>
        <DataTable.Table />
        <DataTable.Pagination />
      </DataTable>
    </Container>
  )
}

export const config = defineRouteConfig({
  label: "Brands",
  icon: TagSolid,
})

export default BrandsPage
```

**Key points**:
- Uses `useDataTable` hook for table management
- Pagination state managed locally (or in URL for production)
- Uses `sdk.client.fetch()` for custom API endpoints
- DataTable components for consistent UI

### Pattern 2: Detail Page

For viewing/editing individual records:

```typescript
// Brand Detail Page - src/admin/routes/brands/[id]/page.tsx
import { useParams } from "react-router-dom"

const BrandDetailPage = () => {
  const { id } = useParams()

  const { data: brand, isLoading } = useQuery({
    queryFn: () => sdk.client.fetch(`/admin/brands/${id}`),
    queryKey: ["brand", id],
  })

  if (isLoading) return <Loading />

  return (
    <Container>
      <Heading>{brand.name}</Heading>

      <Section title="Details">
        <LabeledInput label="Name" value={brand.name} />
        <LabeledInput label="Created" value={brand.created_at} />
      </Section>

      <Section title="Products">
        <ProductsList products={brand.products} />
      </Section>
    </Container>
  )
}

export default BrandDetailPage
```

**File structure for nested routes**:
```
src/admin/routes/brands/
├── page.tsx              → /app/brands (list)
└── [id]/
    └── page.tsx          → /app/brands/:id (detail)
```

### Pattern 3: Create/Edit Form

For creating or editing records:

```typescript
// Create Brand Page - src/admin/routes/brands/create/page.tsx
const CreateBrandPage = () => {
  const navigate = useNavigate()

  const createMutation = useMutation({
    mutationFn: (data: { name: string }) => {
      return sdk.client.fetch(`/admin/brands`, {
        method: "POST",
        body: JSON.stringify(data),
      })
    },
    onSuccess: (result) => {
      toast.success("Brand created successfully")
      navigate(`/brands/${result.brand.id}`)
    },
    onError: (error) => {
      toast.error(`Failed to create brand: ${error.message}`)
    },
  })

  return (
    <Container>
      <Heading>Create Brand</Heading>

      <Form onSubmit={(data) => createMutation.mutate(data)}>
        <Input name="name" label="Name" required />
        <Button type="submit" isLoading={createMutation.isLoading}>
          Create
        </Button>
      </Form>
    </Container>
  )
}

export default CreateBrandPage
```

## React Query Patterns

### Pattern 1: Separate Queries for Display and Modal

**Problem**: Widget uses one query, modal uses a different query

**Solution**: Separate query keys

```typescript
// In widget - lightweight query for display
const { data: product } = useQuery({
  queryFn: () => sdk.admin.product.retrieve(productId, {
    fields: "id,title,brand.name",  // Only what we need
  }),
  queryKey: ["product", productId, "widget"],  // Different key
})

// In modal - full query for editing
const { data: fullProduct } = useQuery({
  queryFn: () => sdk.admin.product.retrieve(productId, {
    fields: "*,brand.*,variants.*",  // Everything
  }),
  queryKey: ["product", productId, "modal"],  // Different key
  enabled: modalOpen,  // Only fetch when modal opens
})
```

### Pattern 2: Optimistic Updates

Update UI immediately, revert on error:

```typescript
const updateMutation = useMutation({
  mutationFn: (updates) => sdk.client.fetch(`/admin/brands/${brandId}`, {
    method: "POST",
    body: JSON.stringify(updates),
  }),
  onMutate: async (updates) => {
    // Cancel outgoing queries
    await queryClient.cancelQueries(["brand", brandId])

    // Snapshot previous value
    const previous = queryClient.getQueryData(["brand", brandId])

    // Optimistically update
    queryClient.setQueryData(["brand", brandId], (old) => ({
      ...old,
      ...updates,
    }))

    return { previous }
  },
  onError: (err, updates, context) => {
    // Revert on error
    queryClient.setQueryData(["brand", brandId], context.previous)
  },
  onSettled: () => {
    // Refetch to sync
    queryClient.invalidateQueries(["brand", brandId])
  },
})
```

### Pattern 3: Invalidation After Mutations

Refresh queries after data changes:

```typescript
const createBrandMutation = useMutation({
  mutationFn: (data) => sdk.client.fetch(`/admin/brands`, {
    method: "POST",
    body: JSON.stringify(data),
  }),
  onSuccess: () => {
    // Invalidate brands list to refetch
    queryClient.invalidateQueries(["brands"])

    // Also invalidate if product pages show brand
    queryClient.invalidateQueries(["products"])
  },
})
```

## SDK Integration for Custom Routes

### SDK Client Fetch Pattern

For custom API endpoints, use `sdk.client.fetch()`:

```typescript
// Standard Medusa entities - use built-in methods
const product = await sdk.admin.product.retrieve(id)
const products = await sdk.admin.product.list()

// Custom entities - use client.fetch()
const brand = await sdk.client.fetch(`/admin/brands/${id}`)
const brands = await sdk.client.fetch(`/admin/brands`)

// Custom actions - use client.fetch() with method
const result = await sdk.client.fetch(`/admin/brands/${id}/approve`, {
  method: "POST",
  body: JSON.stringify({ approved: true }),
})
```

### SDK Configuration

Initialize once in `src/admin/lib/sdk.ts`:

```typescript
import Medusa from "@medusajs/js-sdk"

export const sdk = new Medusa({
  baseUrl: import.meta.env.VITE_BACKEND_URL || "/",
  debug: import.meta.env.DEV,
  auth: {
    type: "session",  // Important for admin!
  },
})
```

**Key points**:
- Use `import.meta.env` (Vite environment variables)
- Default to "/" for same-origin requests
- Use "session" auth type for admin
- Enable debug in development

## Medusa UI Components

Always use Medusa UI components for consistent styling:

```typescript
import {
  Container,
  Heading,
  Text,
  Button,
  Input,
  DataTable,
  useDataTable,
  createDataTableColumnHelper,
} from "@medusajs/ui"

import { TagSolid, PlusSolid } from "@medusajs/icons"
```

**Common components**:
- **Container**: Page/section wrapper
- **Heading**: Page titles
- **Text**: Body text
- **Button**: Actions
- **Input**: Form fields
- **DataTable**: Tables with pagination/sorting
- **IconButton**: Icon-only buttons
- **Badge**: Status indicators
- **Toast**: Notifications

## Zone Reference

Common widget zones:

**Product Pages**:
- `product.details`
- `product.details.side`
- `product.list`

**Order Pages**:
- `order.details`
- `order.details.side`
- `order.list`

**Customer Pages**:
- `customer.details`
- `customer.details.side`
- `customer.list`

**Deprecated suffixes**: `.before` and `.after` still resolve, but since Medusa v2.17.2 they no longer control where the widget lands — admin users arrange widgets in the dashboard's Editor view (Layout Composer). Prefer the unsuffixed zone name. Ask the MedusaDocs MCP server for the full, current zone list instead of guessing.

## Best Practices

### 1. Query Key Naming

Use consistent, hierarchical naming:

```typescript
// Good - hierarchical, specific
["product", productId, "brand"]
["brands", limit, offset]
["brand", brandId, "products"]

// Bad - flat, ambiguous
["productBrand"]
["getBrands"]
```

### 2. Loading States

Always handle loading and error states:

```typescript
const { data, isLoading, error } = useQuery({ ... })

if (isLoading) return <Spinner />
if (error) return <ErrorMessage error={error} />

return <Content data={data} />
```

### 3. Type Safety

Type your queries and mutations:

```typescript
type Brand = {
  id: string
  name: string
  products?: Product[]
}

const { data } = useQuery<{ brands: Brand[] }>({
  queryFn: () => sdk.client.fetch(`/admin/brands`),
  queryKey: ["brands"],
})

// Now data.brands is typed correctly
```

### 4. Separate Display and Modal Queries

Don't reuse the same query for different use cases:

```typescript
// Display query - lightweight
const displayQuery = useQuery({
  queryKey: ["entity", id, "display"],
  queryFn: () => fetch(`/api/entity/${id}?fields=id,name`),
})

// Modal query - comprehensive
const modalQuery = useQuery({
  queryKey: ["entity", id, "modal"],
  queryFn: () => fetch(`/api/entity/${id}?fields=*`),
  enabled: modalOpen,
})
```

## Summary

Admin dashboard integration extends Medusa's UI:

**Widgets**:
- ✅ Extend existing pages
- ✅ Inject at predefined zones
- ✅ Receive page entity as props
- ✅ Use for related information

**UI Routes**:
- ✅ Create new pages
- ✅ Add sidebar navigation
- ✅ Use for custom entities
- ✅ Full page control

**Key Technologies**:
- **React Query**: Data fetching and caching
- **JS SDK**: Backend API communication
- **Medusa UI**: Consistent styling
- **Vite**: Build tool and dev server

**Remember**: Admin is a separate React app that communicates with backend via HTTP. Use SDK for API calls, React Query for state management, and Medusa UI for consistent design.
