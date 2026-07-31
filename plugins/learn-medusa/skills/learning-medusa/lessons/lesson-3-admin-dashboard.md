# Lesson 3: Customize the Medusa Admin Dashboard

## Learning Objectives

By the end of this lesson, you will:

- **Create** admin widgets to extend existing pages
- **Build** UI routes for new admin pages
- **Use** React Query for data fetching
- **Integrate** Medusa UI components

**Time**: 45-60 minutes

**Prerequisites**: Completed Lessons 1-2 (Brand Module, links, workflow hooks)

## What We're Building

Now that brands exist in the backend, let's build the admin UI:

1. **Product Brand Widget**: Show brand name on product detail pages
2. **Brands Management Page**: List all brands with their products

**By the end**, admins will be able to:
- See which brand a product belongs to
- Navigate to a brands management page
- View all brands and their products in a table

**Documentation**: [Admin Widgets](https://docs.medusajs.com/learn/fundamentals/admin/widgets) | [Admin UI Routes](https://docs.medusajs.com/learn/fundamentals/admin/ui-routes)

---

## Part 1: Initialize JS SDK

The **JS SDK** simplifies sending requests to Medusa's API routes.

Create `src/admin/lib/sdk.ts`:

```typescript
import Medusa from "@medusajs/js-sdk"

export const sdk = new Medusa({
  baseUrl: import.meta.env.VITE_BACKEND_URL || "/",
  debug: import.meta.env.DEV,
  auth: {
    type: "session",
  },
})
```

**Configuration**:
- `baseUrl`: Medusa server URL (use environment variable or default to "/")
- `debug`: Enable logging in development
- `auth.type`: "session" for admin dashboard

**Important**: Admin uses Vite, so environment variables are `import.meta.env.*`

**Documentation**: [JS SDK Reference](https://docs.medusajs.com/resources/js-sdk)

---

## Part 2: Create Product Brand Widget

### What is a Widget?

A **widget** is a React component injected into existing admin pages at predefined zones.

**Common zones**:
- `product.details` - Main section of the product details page
- `product.details.side` - Side column of the product details page
- `order.details` - Main section of the order details page

**Note**: Since Medusa v2.17.2, the `.before` and `.after` zone suffixes are deprecated. Widgets in a zone are ordered by the admin user in the dashboard's Editor view (the Layout Composer), and the arrangement is saved. Use the unsuffixed zone name and let the user position the widget.

Create `src/admin/widgets/product-brand.tsx`:

```tsx
import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { DetailWidgetProps, AdminProduct } from "@medusajs/framework/types"
import { Container, Heading, Text } from "@medusajs/ui"
import { useQuery } from "@tanstack/react-query"
import { sdk } from "../lib/sdk"

type AdminProductBrand = AdminProduct & {
  brand?: {
    id: string
    name: string
  }
}

const ProductBrandWidget = ({
  data: product,
}: DetailWidgetProps<AdminProduct>) => {
  const { data: queryResult, isLoading } = useQuery({
    queryFn: () => sdk.admin.product.retrieve(product.id, {
      fields: "+brand.*",
    }),
    queryKey: ["product", product.id, "brand"],
  })

  const brandName = (queryResult?.product as AdminProductBrand)?.brand?.name

  if (isLoading) {
    return (
      <Container className="divide-y p-0">
        <div className="px-6 py-4">
          <Text size="small">Loading brand...</Text>
        </div>
      </Container>
    )
  }

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading level="h2">Brand</Heading>
      </div>
      <div className="grid grid-cols-2 items-center px-6 py-4">
        <Text size="small" weight="plus" leading="compact">
          Name
        </Text>
        <Text size="small" leading="compact">
          {brandName || "-"}
        </Text>
      </div>
    </Container>
  )
}

export const config = defineWidgetConfig({
  zone: "product.details",
})

export default ProductBrandWidget
```

**Key concepts**:

**1. Widget Props**:
```tsx
DetailWidgetProps<AdminProduct>
```
- Widgets on detail pages receive the entity as `data` prop
- Type it with the appropriate entity type

**2. Data Fetching**:
```tsx
useQuery({
  queryFn: () => sdk.admin.product.retrieve(product.id, {
    fields: "+brand.*",
  }),
  queryKey: ["product", product.id, "brand"],
})
```
- Use React Query (`useQuery`) for data fetching
- Query key should include dependencies
- Use `fields` parameter to get linked brand

**3. Medusa UI Components**:
- Always use components from `@medusajs/ui`
- Common: `Container`, `Heading`, `Text`, `Button`
- Maintains consistent design

**4. Widget Configuration**:
```tsx
export const config = defineWidgetConfig({
  zone: "product.details",
})
```
- Defines where widget appears
- Must be exported as `config`

**Documentation**: [Widgets Guide](https://docs.medusajs.com/learn/fundamentals/admin/widgets) | [Medusa UI Components](https://docs.medusajs.com/ui)

---

## Checkpoint 3.1: Test Product Brand Widget

### Test Steps

1. **Start dev server**:
   ```bash
   npm run dev
   ```

2. **Open admin**: http://localhost:9000/app

3. **Navigate to product**: Go to Products → Select a product with a brand

4. **Verify widget**: See brand widget in the page's main section (drag it where you want it in the Editor view)

### Common Issues

**Widget not showing**:
- Check zone name is correct
- Ensure `config` is exported
- Restart dev server

**"Cannot find module '@tanstack/react-query'" (pnpm users only)**:
```bash
pnpm list @tanstack/react-query --depth=10 | grep @medusajs/dashboard
pnpm add @tanstack/react-query@[exact-version]
```

---

## Part 3: Create Brands UI Route

### What is a UI Route?

A **UI Route** is a new page in the admin dashboard.

**File path determines URL**:
- `src/admin/routes/brands/page.tsx` → `/app/brands`
- `src/admin/routes/settings/team/page.tsx` → `/app/settings/team`

### Step 3.1: Create GET Brands API Route

First, update the backend to support pagination.

Update `src/api/admin/brands/route.ts`:

```typescript
// Add this after your existing POST handler

export const GET = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  const query = req.scope.resolve("query")

  const {
    data: brands,
    metadata: { count, take, skip } = {},
  } = await query.graph({
    entity: "brand",
    ...req.queryConfig,
  })

  res.json({
    brands,
    count,
    limit: take,
    offset: skip,
  })
}
```

Then configure query middleware in `src/api/middlewares.ts`:

```typescript
import {
  defineMiddlewares,
  validateAndTransformBody,
  validateAndTransformQuery,
} from "@medusajs/framework/http"
import { createFindParams } from "@medusajs/medusa/api/utils/validators"
// ... other imports

export const GetBrandsSchema = createFindParams()

export default defineMiddlewares({
  routes: [
    // ... existing routes ...
    {
      matcher: "/admin/brands",
      method: "GET",
      middlewares: [
        validateAndTransformQuery(
          GetBrandsSchema,
          {
            defaults: ["id", "name", "products.*"],
            isList: true,
          }
        ),
      ],
    },
  ],
})
```

**Documentation**: [Request Query Config Middleware](https://docs.medusajs.com/learn/fundamentals/module-links/query#request-query-configurations)

### Step 3.2: Create Brands UI Route

Create `src/admin/routes/brands/page.tsx`:

```tsx
import { defineRouteConfig } from "@medusajs/admin-sdk"
import { TagSolid } from "@medusajs/icons"
import {
  Container,
  Heading,
  createDataTableColumnHelper,
  DataTable,
  useDataTable,
} from "@medusajs/ui"
import { useQuery } from "@tanstack/react-query"
import { sdk } from "../../lib/sdk"
import { useState, useMemo } from "react"

type Brand = {
  id: string
  name: string
  products?: { id: string; title: string }[]
}

type BrandsResponse = {
  brands: Brand[]
  count: number
  limit: number
  offset: number
}

const columnHelper = createDataTableColumnHelper<Brand>()

const columns = [
  columnHelper.accessor("id", {
    header: "ID",
  }),
  columnHelper.accessor("name", {
    header: "Name",
  }),
  columnHelper.accessor("products", {
    header: "Products",
    cell: ({ getValue }) => {
      const products = getValue()
      return products?.length || 0
    },
  }),
]

const BrandsPage = () => {
  const limit = 15
  const [pagination, setPagination] = useState({
    pageSize: limit,
    pageIndex: 0,
  })

  const offset = useMemo(() => {
    return pagination.pageIndex * limit
  }, [pagination])

  const { data, isLoading } = useQuery<BrandsResponse>({
    queryFn: () => sdk.client.fetch(`/admin/brands`, {
      query: { limit, offset },
    }),
    queryKey: ["brands", limit, offset],
  })

  const table = useDataTable({
    columns,
    data: data?.brands || [],
    getRowId: (row) => row.id,
    rowCount: data?.count || 0,
    isLoading,
    pagination: {
      state: pagination,
      onPaginationChange: setPagination,
    },
  })

  return (
    <Container className="divide-y p-0">
      <DataTable instance={table}>
        <DataTable.Toolbar className="flex flex-col items-start justify-between gap-2 md:flex-row md:items-center">
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

**Key concepts**:

**1. Route Configuration**:
```tsx
export const config = defineRouteConfig({
  label: "Brands",
  icon: TagSolid,
})
```
- Adds link in sidebar
- `label`: Display name
- `icon`: From `@medusajs/icons`

**2. Data Table Setup**:
```tsx
const columns = [
  columnHelper.accessor("id", { header: "ID" }),
  columnHelper.accessor("name", { header: "Name" }),
]

const table = useDataTable({
  columns,
  data: data?.brands || [],
  rowCount: data?.count || 0,
  pagination: { state, onPaginationChange },
})
```

**3. Custom API Fetch**:
```tsx
sdk.client.fetch(`/admin/brands`, {
  query: { limit, offset },
})
```
- Use `sdk.client.fetch()` for custom routes
- Pass query parameters in `query` object

**Documentation**: [UI Routes Guide](https://docs.medusajs.com/learn/fundamentals/admin/ui-routes) | [DataTable Component](https://docs.medusajs.com/ui/components/data-table)

---

## Checkpoint 3.2: Test Brands UI Route

### Test Steps

1. **Restart dev server** (to pick up new files)
2. **Open admin**: http://localhost:9000/app
3. **Find "Brands" in sidebar**: Should see new menu item
4. **Click Brands**: See table of brands with product counts
5. **Test pagination**: If you have >15 brands, pagination should work

### Common Issues

**Route not showing**:
- Check file name is `page.tsx` (not `route.tsx`)
- Ensure `config` is exported
- Restart dev server

**Table empty**:
- Check API route is working: `curl http://localhost:9000/admin/brands`
- Check query middleware is configured
- Verify brands exist in database

---

## Lesson 3 Complete! 🎉

### What You Built

Fantastic! You've customized the Medusa Admin:

- ✅ **JS SDK**: Configured for making API requests
- ✅ **Product Brand Widget**: Shows brand on product pages
- ✅ **Brands UI Route**: Full page with brands table and pagination

### What You Learned

**Admin Widgets**:
- Extend existing pages without modifying core
- Use React Query for data fetching
- Maintain consistent design with Medusa UI

**UI Routes**:
- Create new admin pages
- Use DataTable for lists
- Implement pagination
- Add navigation links

**React Query**:
- `useQuery` for fetching
- Query keys for caching
- Loading states

**Medusa UI**:
- Consistent components
- Design system integration

### Full Tutorial Complete! 🎊

You've completed all 3 lessons and built a complete feature:

**Backend**:
- Brand Module (data model, service)
- createBrandWorkflow (with rollback)
- POST /admin/brands (create brand)
- Module Link (brand ↔ product)
- Workflow Hook (link on product creation)
- GET /admin/brands (list brands with products)

**Frontend**:
- Product Brand Widget (show brand on product page)
- Brands UI Route (manage brands)

### Commit Your Work

```bash
git add .
git commit -m "Complete Lesson 3: Admin Dashboard customization"
```

### Next Steps

**Deploy your feature**:
1. Run tests (if you have them)
2. Build for production: `npm run build`
3. Deploy to [Medusa Cloud](https://cloud.medusajs.com)

**Build more features**:
- Categories Module
- Product Reviews
- Wishlists
- Custom Shipping Methods

Congratulations on completing the Medusa learning tutorial! You now understand the architecture and can build custom features confidently.
