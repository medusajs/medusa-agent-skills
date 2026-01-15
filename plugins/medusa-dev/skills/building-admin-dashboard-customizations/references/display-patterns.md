# Displaying Entities - Patterns and Components

## Contents
- [When to Use Each Pattern](#when-to-use-each-pattern)
- [DataTable Pattern](#datatable-pattern)
  - [Complete DataTable Implementation](#complete-datatable-implementation)
  - [DataTable Troubleshooting](#datatable-troubleshooting)
- [Simple List Patterns](#simple-list-patterns)
  - [Product/Variant List Item](#productvariant-list-item)
  - [Simple Text List (No Thumbnails)](#simple-text-list-no-thumbnails)
  - [Compact List (No Cards)](#compact-list-no-cards)
  - [Grid Display](#grid-display)
- [Key Design Elements](#key-design-elements)
- [Empty States](#empty-states)
- [Loading States](#loading-states)
- [Conditional Rendering Based on Count](#conditional-rendering-based-on-count)
- [Common Class Patterns](#common-class-patterns)

## When to Use Each Pattern

**Use DataTable when:**

- Displaying potentially many entries (>5-10 items)
- Users need to search, filter, or paginate
- Bulk actions are needed (select multiple, delete, etc.)
- Displaying in a main list view

**Use simple list components when:**

- Displaying a few entries (<5-10 items)
- In a widget or sidebar context
- As a preview or summary
- Space is limited

## DataTable Pattern

**⚠️ pnpm Users**: DataTable examples may use `react-router-dom` for navigation. Install it BEFORE implementing if needed.

### Complete DataTable Implementation

```tsx
import {
  DataTable,
  DataTableRowSelectionState,
  DataTablePaginationState,
  createDataTableColumnHelper,
  useDataTable,
} from "@medusajs/ui"
import { useState, useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import { sdk } from "../lib/client"

const columnHelper = createDataTableColumnHelper<HttpTypes.AdminProduct>()

const columns = [
  columnHelper.select(), // For row selection
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
]

export function ProductTable() {
  const [rowSelection, setRowSelection] = useState<DataTableRowSelectionState>(
    {}
  )
  const [searchValue, setSearchValue] = useState("")
  const [pagination, setPagination] = useState<DataTablePaginationState>({
    pageIndex: 0,
    pageSize: 15,
  })

  const limit = pagination.pageSize
  const offset = pagination.pageIndex * limit

  // Fetch products with search and pagination
  const { data, isLoading } = useQuery({
    queryFn: () =>
      sdk.admin.product.list({
        limit,
        offset,
        q: searchValue || undefined, // Search query
      }),
    queryKey: ["products", limit, offset, searchValue],
    keepPreviousData: true, // Smooth pagination
  })

  const table = useDataTable({
    data: data?.products || [],
    columns,
    getRowId: (product) => product.id,
    rowCount: data?.count || 0,
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
    <DataTable instance={table}>
      <DataTable.Toolbar>
        <div className="flex gap-2">
          <DataTable.Search placeholder="Search products..." />
        </div>
      </DataTable.Toolbar>
      <DataTable.Table />
      <DataTable.Pagination />
    </DataTable>
  )
}
```

### DataTable Troubleshooting

**"DataTable.Search was rendered but search is not enabled"**

You must pass search state configuration to useDataTable:

```tsx
search: {
  state: searchValue,
  onSearchChange: setSearchValue,
}
```

**"Cannot destructure property 'pageIndex' of pagination as it is undefined"**

Always initialize pagination state with both properties:

```tsx
const [pagination, setPagination] = useState({
  pageIndex: 0,
  pageSize: 15,
})
```

## Simple List Patterns

### Product/Variant List Item

For displaying a small list of products or variants with thumbnails:

```tsx
import { Thumbnail, Text } from "@medusajs/ui"
import { TriangleRightMini } from "@medusajs/icons"
import { Link } from "react-router-dom"

// Component for displaying a product variant
const ProductVariantItem = ({ variant, link }) => {
  const Inner = (
    <div className="shadow-elevation-card-rest bg-ui-bg-component rounded-md px-4 py-2 transition-colors">
      <div className="flex items-center gap-3">
        <div className="shadow-elevation-card-rest rounded-md">
          <Thumbnail src={variant.product?.thumbnail} />
        </div>
        <div className="flex flex-1 flex-col">
          <Text size="small" leading="compact" weight="plus">
            {variant.title}
          </Text>
          <Text size="small" leading="compact" className="text-ui-fg-subtle">
            {variant.options.map((o) => o.value).join(" ⋅ ")}
          </Text>
        </div>
        <div className="size-7 flex items-center justify-center">
          <TriangleRightMini className="text-ui-fg-muted rtl:rotate-180" />
        </div>
      </div>
    </div>
  )

  if (!link) {
    return <div key={variant.id}>{Inner}</div>
  }

  return (
    <Link
      to={link}
      key={variant.id}
      className="outline-none focus-within:shadow-borders-interactive-with-focus rounded-md [&:hover>div]:bg-ui-bg-component-hover"
    >
      {Inner}
    </Link>
  )
}

// Usage in a widget
const RelatedProductsDisplay = ({ products }) => {
  if (products.length > 10) {
    // Use DataTable for many items
    return <ProductDataTable products={products} />
  }

  // Use simple list for few items
  return (
    <div className="flex flex-col gap-2">
      {products.map((product) => (
        <ProductVariantItem
          key={product.id}
          variant={product}
          link={`/products/${product.id}`}
        />
      ))}
    </div>
  )
}
```

### Simple Text List (No Thumbnails)

For entities without images (categories, regions, etc.):

```tsx
import { Text } from "@medusajs/ui"
import { TriangleRightMini } from "@medusajs/icons"
import { Link } from "react-router-dom"

const SimpleListItem = ({ title, description, link }) => {
  const Inner = (
    <div className="shadow-elevation-card-rest bg-ui-bg-component rounded-md px-4 py-3 transition-colors">
      <div className="flex items-center gap-3">
        <div className="flex flex-1 flex-col gap-y-1">
          <Text size="small" leading="compact" weight="plus">
            {title}
          </Text>
          {description && (
            <Text size="small" leading="compact" className="text-ui-fg-subtle">
              {description}
            </Text>
          )}
        </div>
        <div className="size-7 flex items-center justify-center">
          <TriangleRightMini className="text-ui-fg-muted rtl:rotate-180" />
        </div>
      </div>
    </div>
  )

  if (!link) {
    return <div>{Inner}</div>
  }

  return (
    <Link
      to={link}
      className="outline-none focus-within:shadow-borders-interactive-with-focus rounded-md [&:hover>div]:bg-ui-bg-component-hover"
    >
      {Inner}
    </Link>
  )
}

// Usage
<div className="flex flex-col gap-2">
  {categories.map((cat) => (
    <SimpleListItem
      key={cat.id}
      title={cat.name}
      description={cat.description}
      link={`/categories/${cat.id}`}
    />
  ))}
</div>
```

### Compact List (No Cards)

For very compact displays:

```tsx
import { Text } from "@medusajs/ui"

<div className="flex flex-col gap-y-2">
  {items.map((item) => (
    <div key={item.id} className="flex items-center justify-between">
      <Text size="small" leading="compact" weight="plus">
        {item.title}
      </Text>
      <Text size="small" leading="compact" className="text-ui-fg-subtle">
        {item.metadata}
      </Text>
    </div>
  ))}
</div>
```

### Grid Display

For displaying items in a grid:

```tsx
<div className="grid grid-cols-2 gap-4">
  {items.map((item) => (
    <div
      key={item.id}
      className="shadow-elevation-card-rest bg-ui-bg-component rounded-md p-4"
    >
      <div className="flex flex-col gap-y-2">
        <Thumbnail src={item.thumbnail} />
        <Text size="small" leading="compact" weight="plus">
          {item.title}
        </Text>
        <Text size="small" leading="compact" className="text-ui-fg-subtle">
          {item.description}
        </Text>
      </div>
    </div>
  ))}
</div>
```

## Key Design Elements

### For Product/Variant displays:

- Always show the thumbnail using `<Thumbnail />` component
- Display title with `<Text size="small" leading="compact" weight="plus">`
- Show secondary info with `<Text size="small" leading="compact" className="text-ui-fg-subtle">`
- Use `shadow-elevation-card-rest` for card elevation
- Include hover states with `bg-ui-bg-component-hover`
- Add navigation indicators (arrows) when items are clickable

### For other entities:

- Use similar card patterns but adapt the content
- Keep consistent spacing (`gap-3` for items, `gap-2` for lists)
- Always use the Text component with correct typography patterns
- Maintain visual hierarchy with `weight="plus"` for primary and `text-ui-fg-subtle` for secondary text

## Empty States

Always handle empty states gracefully:

```tsx
{items.length === 0 ? (
  <Text size="small" leading="compact" className="text-ui-fg-subtle">
    No items to display
  </Text>
) : (
  <div className="flex flex-col gap-2">
    {items.map((item) => (
      <ItemDisplay key={item.id} item={item} />
    ))}
  </div>
)}
```

## Loading States

Show loading states while data is being fetched:

```tsx
import { Spinner } from "@medusajs/ui"

{isLoading ? (
  <div className="flex items-center justify-center p-8">
    <Spinner />
  </div>
) : (
  <div className="flex flex-col gap-2">
    {items.map((item) => (
      <ItemDisplay key={item.id} item={item} />
    ))}
  </div>
)}
```

## Conditional Rendering Based on Count

```tsx
const DisplayComponent = ({ items }) => {
  // Use DataTable for many items
  if (items.length > 10) {
    return <ItemsDataTable items={items} />
  }

  // Use simple list for few items
  if (items.length > 0) {
    return (
      <div className="flex flex-col gap-2">
        {items.map((item) => (
          <SimpleListItem key={item.id} item={item} />
        ))}
      </div>
    )
  }

  // Empty state
  return (
    <Text size="small" leading="compact" className="text-ui-fg-subtle">
      No items to display
    </Text>
  )
}
```

## Common Class Patterns

### Card with elevation and hover

```tsx
className="shadow-elevation-card-rest bg-ui-bg-component rounded-md transition-colors hover:bg-ui-bg-component-hover"
```

### Flex container with consistent spacing

```tsx
className="flex flex-col gap-2" // For vertical lists
className="flex items-center gap-3" // For horizontal items
```

### Focus states for interactive elements

```tsx
className="outline-none focus-within:shadow-borders-interactive-with-focus rounded-md"
```

### RTL support for directional icons

```tsx
className="text-ui-fg-muted rtl:rotate-180"
```
