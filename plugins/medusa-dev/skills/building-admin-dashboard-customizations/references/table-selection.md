# Table Selection Pattern

## Contents
- [Pre-Implementation Requirements for pnpm](#pre-implementation-requirements-for-pnpm)
- [Complete Widget Example: Related Products Selection](#complete-widget-example-related-products-selection)
- [Key Implementation Details](#key-implementation-details)
- [Pattern Variations](#pattern-variations)
- [Important Notes](#important-notes)

This is a complete reference implementation for selecting from large datasets (Products, Categories, Regions, etc.) in Medusa Admin customizations. This pattern uses FocusModal with DataTable for an optimal UX.

## Pre-Implementation Requirements for pnpm

**⚠️ pnpm Users**: This example requires the following packages. Install them BEFORE implementing:
- `@tanstack/react-query` - for useQuery and useMutation
- `react-router-dom` - for Link component (optional, can be removed if not needed)

Check and install with exact versions:
```bash
pnpm list @tanstack/react-query --depth=10 | grep @medusajs/dashboard
pnpm add @tanstack/react-query@[exact-version]

pnpm list react-router-dom --depth=10 | grep @medusajs/dashboard
pnpm add react-router-dom@[exact-version]
```

See the main SKILL.md for full pnpm setup instructions.

## Complete Widget Example: Related Products Selection

```tsx
import { defineWidgetConfig } from "@medusajs/admin-sdk"
import {
  Container,
  Heading,
  Button,
  toast,
  FocusModal,
  Text,
  DataTable,
  DataTableRowSelectionState,
  DataTablePaginationState,
  createDataTableColumnHelper,
  useDataTable,
} from "@medusajs/ui"
import { HttpTypes } from "@medusajs/types"
import { useMemo, useState } from "react"
import { DetailWidgetProps } from "@medusajs/framework/types"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { sdk } from "../lib/client"
import { PencilSquare } from "@medusajs/icons"

const ProductRelatedProductsWidget = ({
  data: product
}: DetailWidgetProps<HttpTypes.AdminProduct>) => {
  const [open, setOpen] = useState(false)
  const queryClient = useQueryClient()

  // Parse existing related products from metadata
  const initialIds = useMemo(() => {
    if (product?.metadata?.related_product_ids) {
      try {
        const ids = JSON.parse(product.metadata.related_product_ids as string)
        return Array.isArray(ids) ? ids : []
      } catch {
        return []
      }
    }
    return []
  }, [product?.metadata?.related_product_ids])

  // Initialize selection state with existing related products
  const initialState = useMemo(() => {
    return initialIds.reduce((acc, id) => {
      acc[id] = true
      return acc
    }, {} as DataTableRowSelectionState)
  }, [initialIds])

  const [rowSelection, setRowSelection] = useState<DataTableRowSelectionState>(initialState)
  const [searchValue, setSearchValue] = useState("")
  const [pagination, setPagination] = useState<DataTablePaginationState>({
    pageIndex: 0,
    pageSize: 10
  })

  // IMPORTANT: Separate queries for display and modal selection

  // Query 1: Fetch selected products for display (loads on mount)
  const { data: displayProducts } = useQuery({
    queryFn: async () => {
      if (initialIds.length === 0) return { products: [] }
      // Fetch specific products by IDs for display
      const response = await sdk.admin.product.list({
        id: initialIds, // Fetch only the selected products
        limit: initialIds.length,
      })
      return response
    },
    queryKey: ["related-products-display", initialIds],
    enabled: initialIds.length > 0, // Only fetch if there are IDs
  })

  // Query 2: Fetch products for modal selection (only when modal is open)
  const limit = pagination.pageSize
  const offset = pagination.pageIndex * limit

  const { data: modalProducts, isLoading } = useQuery({
    queryFn: () => sdk.admin.product.list({
      limit,
      offset,
      q: searchValue || undefined,
    }),
    queryKey: ["products-selection", limit, offset, searchValue],
    keepPreviousData: true, // Smooth pagination
    enabled: open, // Only load when modal is open
  })

  // Mutation to update the product metadata
  const updateProduct = useMutation({
    mutationFn: (relatedProductIds: string[]) => {
      return sdk.admin.product.update(product.id, {
        metadata: {
          ...product.metadata,
          related_product_ids: JSON.stringify(relatedProductIds),
        },
      })
    },
    onSuccess: () => {
      // Invalidate queries to refresh the display
      queryClient.invalidateQueries({ queryKey: ["product", product.id] })
      queryClient.invalidateQueries({ queryKey: ["related-products-display"] })
      toast.success("Success", {
        description: "Related products updated successfully",
        dismissLabel: "Close",
      })
      setOpen(false)
    },
    onError: (error) => {
      console.error("Error saving related products:", error)
      toast.error("Error", {
        description: "Failed to update related products",
        dismissLabel: "Close",
      })
    },
  })

  // Get selected product IDs
  const selectedProductIds = useMemo(() => Object.keys(rowSelection), [rowSelection])

  // Use display query for showing selected products
  const selectedProducts = displayProducts?.products || []

  const handleSubmit = () => {
    updateProduct.mutate(selectedProductIds)
  }

  const columns = useColumns()

  // Use modalProducts for the selection table
  const availableProducts = useMemo(() => {
    if (!modalProducts?.products) return []
    return modalProducts.products.filter(p => p.id !== product.id)
  }, [modalProducts?.products, product.id])

  const table = useDataTable({
    data: availableProducts,
    columns,
    getRowId: (row) => row.id,
    rowCount: modalProducts?.count || 0,
    isLoading,
    rowSelection: {
      state: rowSelection,
      onRowSelectionChange: setRowSelection,
    },
    search: {
      state: searchValue,
      onSearchChange: setSearchValue,
    },
    pagination: {
      state: pagination,
      onPaginationChange: setPagination,
    },
  })

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading level="h2">Related Products</Heading>
        <Button
          size="small"
          variant="secondary"
          onClick={() => setOpen(true)}
        >
          <PencilSquare />
        </Button>
      </div>
      <div className="px-6 py-4">
        {selectedProducts.length === 0 ? (
          <Text size="small" leading="compact" className="text-ui-fg-subtle">
            No related products selected
          </Text>
        ) : (
          <div className="flex flex-col gap-y-2">
            {selectedProducts.map((p) => (
              <div key={p.id} className="flex items-center justify-between">
                <Text size="small" leading="compact" weight="plus">
                  {p.title}
                </Text>
              </div>
            ))}
          </div>
        )}
      </div>

      <FocusModal open={open} onOpenChange={setOpen}>
        <FocusModal.Content>
          <div className="flex h-full flex-col overflow-hidden">
            <FocusModal.Header />
            <FocusModal.Body className="flex items-start justify-center">
              <div className="w-full max-w-3xl">
                <div className="flex flex-col gap-y-6">
                  <DataTable instance={table}>
                    <DataTable.Toolbar>
                      <div className="flex gap-2">
                        <DataTable.Search placeholder="Search products..." />
                      </div>
                    </DataTable.Toolbar>
                    <DataTable.Table />
                    <DataTable.Pagination />
                  </DataTable>
                </div>
              </div>
            </FocusModal.Body>
            <FocusModal.Footer>
              <div className="flex items-center justify-end gap-x-2">
                <FocusModal.Close asChild>
                  <Button size="small" variant="secondary">
                    Cancel
                  </Button>
                </FocusModal.Close>
                <Button
                  size="small"
                  onClick={handleSubmit}
                  isLoading={updateProduct.isPending}
                >
                  Save
                </Button>
              </div>
            </FocusModal.Footer>
          </div>
        </FocusModal.Content>
      </FocusModal>
    </Container>
  )
}

const columnHelper = createDataTableColumnHelper<HttpTypes.AdminProduct>()

const useColumns = () => {
  return useMemo(() => [
    columnHelper.select(),
    columnHelper.accessor("title", {
      header: "Title",
    }),
    columnHelper.accessor("status", {
      header: "Status",
    }),
    columnHelper.accessor("created_at", {
      header: "Created",
      cell: ({ getValue }) => new Date(getValue()).toLocaleDateString(),
    }),
  ], [])
}

export const config = defineWidgetConfig({
  zone: "product.details.after",
})

export default ProductRelatedProductsWidget
```

## Key Implementation Details

### 1. Typography
- Use `<Text size="small" leading="compact" weight="plus">` for product titles and labels
- Use `<Text size="small" leading="compact" className="text-ui-fg-subtle">` for descriptions
- Container headers can use `<Heading>` component
- See [typography.md](typography.md) for complete typography guidelines

### 2. State Management
- Use `DataTableRowSelectionState` for tracking selected rows
- Initialize with existing selections from metadata
- Use `DataTablePaginationState` with both `pageIndex` and `pageSize`

### 3. Data Loading Pattern - CRITICAL
**Always use separate queries for display vs modal selection:**

```tsx
// Display query - loads on mount, fetches specific items
const { data: displayProducts } = useQuery({
  queryFn: () => sdk.admin.product.list({
    id: initialIds, // Fetch specific products by IDs
  }),
  queryKey: ["related-products-display", initialIds],
  enabled: initialIds.length > 0,
})

// Modal query - loads when modal opens, paginated
const { data: modalProducts } = useQuery({
  queryFn: () => sdk.admin.product.list({
    limit, offset, q: searchValue,
  }),
  queryKey: ["products-selection", limit, offset, searchValue],
  enabled: open, // Only when modal is open
  keepPreviousData: true,
})
```

**Why this pattern?**
- Display data loads immediately on mount
- Modal data only loads when needed
- Prevents "No data" on page refresh
- Handles ID-based references properly

### 4. Updating with useMutation and Cache Invalidation
```tsx
const updateProduct = useMutation({
  mutationFn: (payload) => sdk.admin.product.update(id, payload),
  onSuccess: () => {
    // Invalidate BOTH the product and display queries
    queryClient.invalidateQueries({ queryKey: ["product", id] })
    queryClient.invalidateQueries({ queryKey: ["related-products-display"] })
    toast.success("Updated successfully")

    // Note: No need to invalidate ["products-selection"] - that's modal data
  },
})
```

### 5. DataTable Configuration
Always provide all required configurations:
```tsx
const table = useDataTable({
  data: data?.products || [],
  columns,
  getRowId: (row) => row.id,
  rowCount: data?.count || 0,
  isLoading,
  rowSelection: { /* config */ },
  search: { /* config */ },
  pagination: { /* config */ },
})
```

### 6. Component Structure
```tsx
<DataTable instance={table}>
  <DataTable.Toolbar>
    <div className="flex gap-2">
      <DataTable.Search placeholder="Search..." />
    </div>
  </DataTable.Toolbar>
  <DataTable.Table />
  <DataTable.Pagination />
</DataTable>
```

## Pattern Variations

### For Categories Selection
```tsx
const { data, isLoading } = useQuery({
  queryFn: () => sdk.admin.productCategory.list({ limit, offset }),
  queryKey: ["categories", limit, offset],
})
```

### For Regions Selection
```tsx
const { data, isLoading } = useQuery({
  queryFn: () => sdk.admin.region.list({ limit, offset }),
  queryKey: ["regions", limit, offset],
})
```

### For Custom Endpoints
```tsx
const { data, isLoading } = useQuery({
  queryFn: () => sdk.client.fetch("/admin/custom-endpoint", {
    query: { limit, offset, search: searchValue }
  }),
  queryKey: ["custom-data", limit, offset, searchValue],
})
```

## Important Notes

1. **Package Manager Considerations**:
   - **pnpm users**: MUST install `@tanstack/react-query` and `react-router-dom` BEFORE implementing (see Pre-Implementation Requirements above)
   - **npm/yarn users**: DO NOT install these packages - they're already available through dashboard
2. **Always use keepPreviousData: true** for pagination to prevent UI flicker
3. **Search is server-side** - Pass the search value in the query function
4. **Metadata updates replace the entire object** - Spread existing metadata when updating
5. **Use proper query key dependencies** - Include all parameters that affect the data

This pattern provides a consistent, performant way to handle selection from large datasets in Medusa Admin customizations.