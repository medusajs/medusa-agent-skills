# Checkpoint 3.1: Product Brand Widget

This checkpoint verifies that you've successfully created a widget that displays a product's brand on the product detail page.

## Verification Questions

Before proceeding, test your understanding:

1. **What is a widget and how is it different from a UI route?**
   <details>
   <summary>Answer</summary>

   A widget is a React component injected into an existing admin page at a predefined zone. It extends existing pages without replacing them. A UI route is a completely new page you create. Use widgets when you want to add information to existing pages (like adding brand to product details). Use UI routes when you need a new standalone page (like a brands management page).
   </details>

2. **Why do we need to refetch product data in the widget when the page already loads the product?**
   <details>
   <summary>Answer</summary>

   The product detail page doesn't include linked relations by default (like brand). We need to explicitly request the brand data using the `fields` parameter. The widget fetches the same product but with `fields: "+brand.*"` to include the brand relation. React Query caches this, so it's not inefficient.
   </details>

3. **What is React Query's `queryKey` and why is it important?**
   <details>
   <summary>Answer</summary>

   `queryKey` is a unique identifier for a query. React Query uses it for caching, refetching, and invalidation. The key should include all dependencies - in our case, `["product", product.id, "brand"]`. If the product ID changes, React Query knows to fetch different data. If you mutate a brand, you can invalidate this key to refetch fresh data.
   </details>

4. **Why do widgets use Medusa UI components instead of regular HTML/CSS?**
   <details>
   <summary>Answer</summary>

   Medusa UI components maintain design consistency with the rest of the admin dashboard (colors, spacing, typography, interactions). They're also accessible and responsive out of the box. Using standard HTML/CSS would make your widget look out of place and require extra styling work.
   </details>

## Implementation Check

Let me verify your implementation. Please share the following:

### 1. SDK Configuration

Show me your `src/admin/lib/sdk.ts` file.

**Key things to check**:
- [ ] Imports `Medusa` from "@medusajs/js-sdk"
- [ ] Creates SDK instance with `new Medusa()`
- [ ] Configures `baseUrl` using `import.meta.env.VITE_BACKEND_URL` or "/"
- [ ] Sets `debug: import.meta.env.DEV`
- [ ] Sets `auth.type: "session"`
- [ ] Exports as `export const sdk`

### 2. Widget Component File

Show me your `src/admin/widgets/product-brand.tsx` file.

**Key things to check**:
- [ ] Imports `defineWidgetConfig` from "@medusajs/admin-sdk"
- [ ] Imports types: `DetailWidgetProps`, `AdminProduct` from "@medusajs/framework/types"
- [ ] Imports UI components: `Container`, `Heading`, `Text` from "@medusajs/ui"
- [ ] Imports `useQuery` from "@tanstack/react-query"
- [ ] Imports `sdk` from "../lib/sdk"
- [ ] Defines `AdminProductBrand` type extending `AdminProduct` with brand
- [ ] Component props: `DetailWidgetProps<AdminProduct>`
- [ ] Destructures product: `{ data: product }`
- [ ] useQuery configuration:
  - `queryFn` calls `sdk.admin.product.retrieve()` with `fields: "+brand.*"`
  - `queryKey` includes product.id
- [ ] Handles loading state
- [ ] Displays brand name or "-" if no brand
- [ ] Uses Container, Heading, and Text components
- [ ] Exports config: `defineWidgetConfig({ zone: "product.details" })`
- [ ] Default exports component

### 3. Dev Server Running

Ensure dev server is running with admin:

```bash
npm run dev
```

**Expected**: Server starts and admin accessible at http://localhost:9000/app

### 4. Manual Test in Browser

1. Open admin dashboard: http://localhost:9000/app
2. Navigate to Products page
3. Click on a product that has a brand (created in Lesson 2)
4. Look for the Brand widget at the TOP of the product details page

**Expected**:
- Widget appears with heading "Brand"
- Shows brand name (e.g., "Nike")
- Widget styling matches other admin widgets

### 5. Test with Product Without Brand

1. Navigate to a product that doesn't have a brand
2. Check the widget

**Expected**:
- Widget still appears
- Shows "-" for the brand name (indicating no brand)

## Common Issues

### "Cannot find module '@tanstack/react-query'" (pnpm users)

**Symptom**: Build error or runtime error about missing react-query

**Cause**: pnpm strict dependency resolution

**Fix**:
Find the exact version used by Medusa:
```bash
pnpm list @tanstack/react-query --depth=10 | grep @medusajs/dashboard
```

Install that specific version:
```bash
pnpm add @tanstack/react-query@5.x.x
```

### Widget not showing on product page

**Symptom**: Navigate to product but no widget appears

**Causes and Fixes**:

**Cause 1**: Wrong zone name
- **Fix**: Use exact zone: `"product.details"`

**Cause 2**: Config not exported
- **Fix**: Ensure you export config:
  ```typescript
  export const config = defineWidgetConfig({ zone: "product.details" })
  ```

**Cause 3**: File not in correct location
- **Fix**: Ensure file is at `src/admin/widgets/product-brand.tsx`

**Cause 4**: Default export missing
- **Fix**: Ensure component is default exported:
  ```typescript
  export default ProductBrandWidget
  ```

### "Cannot read property 'brand' of undefined"

**Symptom**: Runtime error when accessing brand

**Cause**: Query result structure not properly typed

**Fix**:
Type the query result properly:
```typescript
const { data: queryResult } = useQuery({ ... })
const brandName = (queryResult?.product as AdminProductBrand)?.brand?.name
```

Use optional chaining throughout.

### Brand shows as "-" even though product has brand

**Symptom**: Widget shows "-" instead of brand name

**Causes and Fixes**:

**Cause 1**: fields parameter incorrect
- **Fix**: Use `"+brand.*"` (with + sign)

**Cause 2**: Link not created
- **Fix**: Verify link exists (see Checkpoint 2.2)

**Cause 3**: Extracting brand from wrong location
- **Fix**: Check structure of queryResult

### "sdk is not defined"

**Symptom**: Runtime error about sdk

**Cause**: SDK not imported or initialized

**Fix**:
1. Create `src/admin/lib/sdk.ts` (see Implementation Check #1)
2. Import in widget: `import { sdk } from "../lib/sdk"`

### Widget styling looks wrong / doesn't match dashboard

**Symptom**: Widget has different colors, spacing, or font

**Cause**: Not using Medusa UI components or adding custom CSS

**Fix**:
Use only Medusa UI components:
```typescript
import { Container, Heading, Text } from "@medusajs/ui"

// Use Container for the widget wrapper
<Container className="divide-y p-0">
  // Use Heading for title
  <Heading level="h2">Brand</Heading>
  // Use Text for content
  <Text size="small">{brandName}</Text>
</Container>
```

### Widget appears at bottom instead of top

**Symptom**: Widget shows after all other sections

**Cause**: Not a bug. Since Medusa v2.17.2, position within a zone is controlled by the admin user, not the zone name — the `.before`/`.after` suffixes are deprecated.

**Fix**:
Keep the unsuffixed zone and reposition the widget in the dashboard's Editor view (Layout Composer); the arrangement is saved.
```typescript
export const config = defineWidgetConfig({
  zone: "product.details",
})
```

### TypeScript errors about widget props

**Symptom**: Build fails with TS errors about props

**Cause**: Incorrect prop type

**Fix**:
Use generic DetailWidgetProps:
```typescript
const ProductBrandWidget = ({
  data: product,
}: DetailWidgetProps<AdminProduct>) => {
  // ...
}
```

## Testing Checklist

Verify each of these steps:

- [ ] SDK initialized in src/admin/lib/sdk.ts
- [ ] Widget file created in src/admin/widgets/
- [ ] Widget appears on product detail page (anywhere in the main section)
- [ ] Shows brand name for products with brands
- [ ] Shows "-" for products without brands
- [ ] Styling matches other admin widgets
- [ ] No console errors in browser DevTools

## Architecture Understanding

At this point, you should understand:

**Widget injection system**:

```
Admin Product Detail Page
┌────────────────────────────────────┐
│  Page Header                       │
│  (Medusa Core)                     │
├────────────────────────────────────┤
│  zone: product.details (main)      │
│                                    │
│  Product Information (Core)        │
│  Variants Section (Core)           │
│  ┌──────────────────────────────┐  │
│  │   Your Widget:               │  │  ← injected into the same zone;
│  │   Brand: Nike                │  │    order set by the user in the
│  └──────────────────────────────┘  │    Editor view (Layout Composer)
└────────────────────────────────────┘
```

**Why widgets matter**:
- **Non-invasive**: Extend pages without modifying core code
- **Composable**: Multiple widgets can use the same zone
- **User-arrangeable**: Admin users reorder page components, including widgets, in the Editor view (v2.17.2+)
- **Upgrade safe**: Core page updates don't break your widgets
- **Contextual**: Receive page data as props

**React Query caching**:
- First visit: Fetches product with brand
- Navigate away and back: Uses cached data (instant)
- Background refetch: Keeps data fresh
- Mutation: Invalidate cache to trigger refetch

## Next Steps

Once this checkpoint passes:

1. **SDK** initialized for API calls
2. **Product Brand Widget** showing brand on product page
3. **Next**: Create Brands UI Route (Part 3 of Lesson 3)

The widget enhances the existing product page. Next, we'll create a completely new admin page for managing all brands in a table with pagination.

**Ready to continue?** Let me know when all checks pass, and we'll create the brands management page.
