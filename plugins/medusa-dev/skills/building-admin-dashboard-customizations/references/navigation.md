# Navigation and Routing

## Contents
- [Pre-Implementation Requirements for pnpm](#pre-implementation-requirements-for-pnpm)
- [Basic Navigation with Link Component](#basic-navigation-with-link-component)
- [Programmatic Navigation](#programmatic-navigation)
- [Accessing Route Parameters](#accessing-route-parameters)
- [Linking to Built-in Admin Pages](#linking-to-built-in-admin-pages)
- [Navigation from Widgets](#navigation-from-widgets)
- [Common Navigation Patterns](#common-navigation-patterns)

## Pre-Implementation Requirements for pnpm

**⚠️ pnpm Users**: Navigation requires `react-router-dom`. Install BEFORE implementing:

```bash
pnpm list react-router-dom --depth=10 | grep @medusajs/dashboard
pnpm add react-router-dom@[exact-version]
```

**npm/yarn Users**: DO NOT install - already available through dashboard dependencies.

## Basic Navigation with Link Component

Use the `Link` component for internal navigation in widgets and custom pages:

```tsx
import { Link } from "react-router-dom"
import { Text } from "@medusajs/ui"
import { TriangleRightMini } from "@medusajs/icons"

// Link to a custom page
<Link
  to="/custom/my-page"
  className="outline-none focus-within:shadow-borders-interactive-with-focus rounded-md [&:hover>div]:bg-ui-bg-component-hover"
>
  <div className="shadow-elevation-card-rest bg-ui-bg-component rounded-md px-4 py-3 transition-colors">
    <div className="flex items-center gap-3">
      <Text size="small" leading="compact" weight="plus">
        Go to Custom Page
      </Text>
      <div className="size-7 flex items-center justify-center">
        <TriangleRightMini className="text-ui-fg-muted rtl:rotate-180" />
      </div>
    </div>
  </div>
</Link>
```

### Link with Dynamic ID

```tsx
// Link to product details
<Link to={`/products/${product.id}`}>
  <Text size="small" leading="compact" weight="plus">
    {product.title}
  </Text>
</Link>
```

### Button-styled Link

```tsx
import { Button } from "@medusajs/ui"
import { Link } from "react-router-dom"

<Button asChild size="small" variant="secondary">
  <Link to="/custom/my-page">
    View Details
  </Link>
</Button>
```

## Programmatic Navigation

Use `useNavigate` for navigation after actions (e.g., after creating an entity):

```tsx
import { useNavigate } from "react-router-dom"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast, Button } from "@medusajs/ui"
import { sdk } from "../lib/client"

const CreateProductWidget = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const createProduct = useMutation({
    mutationFn: (data) => sdk.admin.product.create(data),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["products"] })
      toast.success("Product created successfully")

      // Navigate to the new product's page
      navigate(`/products/${result.product.id}`)
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create product")
    },
  })

  const handleCreate = () => {
    createProduct.mutate({
      title: "New Product",
      // ... other fields
    })
  }

  return (
    <Button onClick={handleCreate} isLoading={createProduct.isPending}>
      Create and View Product
    </Button>
  )
}
```

### Navigate with State

Pass data to the destination page:

```tsx
navigate("/custom/review", {
  state: { productId: product.id, productTitle: product.title }
})

// Access in destination page
import { useLocation } from "react-router-dom"

const ReviewPage = () => {
  const location = useLocation()
  const { productId, productTitle } = location.state || {}

  return <div>Reviewing: {productTitle}</div>
}
```

### Navigate Back

```tsx
const navigate = useNavigate()

<Button onClick={() => navigate(-1)}>
  Go Back
</Button>
```

## Accessing Route Parameters

In custom pages, access URL parameters with `useParams`:

```tsx
// Custom page at: /custom/products/:id
import { useParams } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { sdk } from "../lib/client"
import { Container, Heading } from "@medusajs/ui"

const ProductDetailsPage = () => {
  const { id } = useParams() // Get :id from URL

  const { data: product, isLoading } = useQuery({
    queryFn: () => sdk.admin.product.retrieve(id, {
      fields: "+metadata,+variants.*",
    }),
    queryKey: ["product", id],
    enabled: !!id, // Only fetch if ID exists
  })

  if (isLoading) return <div>Loading...</div>

  return (
    <Container>
      <Heading>{product?.title}</Heading>
      {/* Product details */}
    </Container>
  )
}

export default ProductDetailsPage
```

### Multiple Parameters

```tsx
// Route: /custom/orders/:orderId/items/:itemId
const { orderId, itemId } = useParams()

const { data } = useQuery({
  queryFn: () => sdk.client.fetch(`/admin/orders/${orderId}/items/${itemId}`),
  queryKey: ["order-item", orderId, itemId],
  enabled: !!orderId && !!itemId,
})
```

### Query Parameters

Use `useSearchParams` for query string parameters:

```tsx
import { useSearchParams } from "react-router-dom"

const ProductsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams()

  const status = searchParams.get("status") // Get ?status=published
  const page = searchParams.get("page") // Get ?page=2

  const { data } = useQuery({
    queryFn: () => sdk.admin.product.list({
      status,
      offset: (parseInt(page) || 0) * 15,
    }),
    queryKey: ["products", status, page],
  })

  // Update query params
  const handleFilterChange = (newStatus: string) => {
    setSearchParams({ status: newStatus, page: "0" })
  }

  return (
    <div>
      <Button onClick={() => handleFilterChange("published")}>
        Published Only
      </Button>
      {/* Products list */}
    </div>
  )
}
```

## Linking to Built-in Admin Pages

Link to standard Medusa admin pages:

```tsx
import { Link } from "react-router-dom"

// Product details
<Link to={`/products/${productId}`}>View Product</Link>

// Order details
<Link to={`/orders/${orderId}`}>View Order</Link>

// Customer details
<Link to={`/customers/${customerId}`}>View Customer</Link>

// Product categories
<Link to="/categories">View Categories</Link>

// Settings
<Link to="/settings">Settings</Link>

// Custom field in settings
<Link to="/settings/custom-field-name">Custom Settings</Link>
```

### Common Built-in Routes

```tsx
const ADMIN_ROUTES = {
  products: "/products",
  productDetails: (id: string) => `/products/${id}`,
  orders: "/orders",
  orderDetails: (id: string) => `/orders/${id}`,
  customers: "/customers",
  customerDetails: (id: string) => `/customers/${id}`,
  categories: "/categories",
  inventory: "/inventory",
  pricing: "/pricing",
  settings: "/settings",
}

// Usage
<Link to={ADMIN_ROUTES.productDetails(product.id)}>
  View Product
</Link>
```

## Navigation from Widgets

### Pattern: View All Link

Add a "View All" link from a widget to a custom page:

```tsx
import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { Container, Heading, Button, Text } from "@medusajs/ui"
import { Link } from "react-router-dom"
import { DetailWidgetProps } from "@medusajs/framework/types"

const RelatedProductsWidget = ({ data: product }) => {
  // ... widget logic

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading level="h2">Related Products</Heading>
        <div className="flex items-center gap-x-2">
          <Button size="small" variant="secondary" onClick={() => setOpen(true)}>
            Edit
          </Button>
          <Button asChild size="small" variant="transparent">
            <Link to={`/custom/products/${product.id}/related`}>
              View All
            </Link>
          </Button>
        </div>
      </div>
      {/* Widget content */}
    </Container>
  )
}

export const config = defineWidgetConfig({
  zone: "product.details.after",
})

export default RelatedProductsWidget
```

### Pattern: List Item Navigation

Make list items clickable to navigate:

```tsx
import { Thumbnail, Text } from "@medusajs/ui"
import { TriangleRightMini } from "@medusajs/icons"
import { Link } from "react-router-dom"

const ProductListItem = ({ product }) => {
  return (
    <Link
      to={`/products/${product.id}`}
      className="outline-none focus-within:shadow-borders-interactive-with-focus rounded-md [&:hover>div]:bg-ui-bg-component-hover"
    >
      <div className="shadow-elevation-card-rest bg-ui-bg-component rounded-md px-4 py-2 transition-colors">
        <div className="flex items-center gap-3">
          <Thumbnail src={product.thumbnail} />
          <div className="flex flex-1 flex-col">
            <Text size="small" leading="compact" weight="plus">
              {product.title}
            </Text>
            <Text size="small" leading="compact" className="text-ui-fg-subtle">
              {product.status}
            </Text>
          </div>
          <div className="size-7 flex items-center justify-center">
            <TriangleRightMini className="text-ui-fg-muted rtl:rotate-180" />
          </div>
        </div>
      </div>
    </Link>
  )
}
```

## Common Navigation Patterns

### Pattern: Back to List

Navigate back to list after viewing details:

```tsx
import { useNavigate } from "react-router-dom"
import { ArrowLeft } from "@medusajs/icons"
import { IconButton } from "@medusajs/ui"

const DetailsPage = () => {
  const navigate = useNavigate()

  return (
    <div>
      <div className="flex items-center gap-x-2 mb-4">
        <IconButton onClick={() => navigate("/custom/products")}>
          <ArrowLeft />
        </IconButton>
        <Heading>Product Details</Heading>
      </div>
      {/* Details content */}
    </div>
  )
}
```

### Pattern: Breadcrumb Navigation

```tsx
import { Link } from "react-router-dom"
import { Text } from "@medusajs/ui"

const Breadcrumbs = ({ product }) => {
  return (
    <div className="flex items-center gap-x-2">
      <Link to="/products">
        <Text size="small" className="text-ui-fg-subtle hover:text-ui-fg-base">
          Products
        </Text>
      </Link>
      <Text size="small" className="text-ui-fg-muted">/</Text>
      <Link to={`/products/${product.id}`}>
        <Text size="small" className="text-ui-fg-subtle hover:text-ui-fg-base">
          {product.title}
        </Text>
      </Link>
      <Text size="small" className="text-ui-fg-muted">/</Text>
      <Text size="small" weight="plus">Details</Text>
    </div>
  )
}
```

### Pattern: Tab Navigation

Navigate between different views using tabs:

```tsx
import { useSearchParams, Link } from "react-router-dom"
import { Tabs } from "@medusajs/ui"

const ProductTabs = () => {
  const [searchParams] = useSearchParams()
  const activeTab = searchParams.get("tab") || "details"

  return (
    <Tabs value={activeTab}>
      <Tabs.List>
        <Tabs.Trigger value="details" asChild>
          <Link to="?tab=details">Details</Link>
        </Tabs.Trigger>
        <Tabs.Trigger value="variants" asChild>
          <Link to="?tab=variants">Variants</Link>
        </Tabs.Trigger>
        <Tabs.Trigger value="media" asChild>
          <Link to="?tab=media">Media</Link>
        </Tabs.Trigger>
      </Tabs.List>

      <Tabs.Content value="details">
        {/* Details content */}
      </Tabs.Content>
      <Tabs.Content value="variants">
        {/* Variants content */}
      </Tabs.Content>
      <Tabs.Content value="media">
        {/* Media content */}
      </Tabs.Content>
    </Tabs>
  )
}
```

### Pattern: Action with Navigation

Perform an action then navigate:

```tsx
const deleteProduct = useMutation({
  mutationFn: (id) => sdk.admin.product.delete(id),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ["products"] })
    toast.success("Product deleted")
    navigate("/products") // Navigate to list after deletion
  },
})
```

### Pattern: Conditional Navigation

Navigate based on state or data:

```tsx
const handleComplete = () => {
  if (hasErrors) {
    toast.error("Please fix errors first")
    return
  }

  if (isDraft) {
    navigate(`/custom/products/${id}/publish`)
  } else {
    navigate("/products")
  }
}
```

## Important Notes

1. **pnpm users**: Must install `react-router-dom` with exact version from dashboard
2. **npm/yarn users**: Do NOT install `react-router-dom` - already available
3. **Always use relative paths** starting with `/` for internal navigation
4. **Use Link for navigation links** - better for SEO and accessibility
5. **Use navigate for programmatic navigation** - after actions or based on logic
6. **Always handle loading states** when fetching route parameter-based data
7. **Clean up on unmount** when using listeners or subscriptions in routes
8. **Maintain focus management** for accessibility when navigating
