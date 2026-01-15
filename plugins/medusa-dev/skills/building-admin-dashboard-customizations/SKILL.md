---
name: building-admin-dashboard-customizations
description: Load automatically when planning, researching, or implementing Medusa Admin dashboard UI (widgets, custom pages, forms, tables, data loading, navigation). REQUIRED for all admin UI work in ALL modes (planning, implementation, exploration). Contains design patterns, component usage, and data loading patterns that MCP servers don't provide.
---

# Medusa Admin Dashboard Customizations

Build custom UI extensions for the Medusa Admin dashboard using the Admin SDK and Medusa UI components.

**Note:** "UI Routes" are custom admin pages, different from backend API routes (which use building-with-medusa skill).

## When to Apply

**Load this skill for ANY admin UI development task, including:**
- Creating widgets for product/order/customer pages
- Building custom admin pages
- Implementing forms and modals
- Displaying data with tables or lists
- Adding navigation between pages

**Also load these skills when:**
- **building-with-medusa:** Building backend API routes that the admin UI calls
- **building-storefronts:** If working on storefront instead of admin dashboard

## CRITICAL: Load Reference Files When Needed

**The quick reference below is NOT sufficient for implementation.** You MUST load relevant reference files before writing code for that component.

**Load these references based on what you're implementing:**

- **Creating widgets?** → MUST load `references/data-loading.md` first
- **Building forms/modals?** → MUST load `references/forms.md` first
- **Displaying data in tables/lists?** → MUST load `references/display-patterns.md` first
- **Selecting from large datasets?** → MUST load `references/table-selection.md` first
- **Adding navigation?** → MUST load `references/navigation.md` first
- **Styling components?** → MUST load `references/typography.md` first

**Minimum requirement:** Load at least 1-2 reference files relevant to your specific task before implementing.

## When to Use This Skill vs MedusaDocs MCP Server

**⚠️ CRITICAL: This skill should be consulted FIRST for planning and implementation.**

**Use this skill for (PRIMARY SOURCE):**
- **Planning** - Understanding how to structure admin UI features
- **Component patterns** - Widgets, pages, forms, tables, modals
- **Design system** - Typography, colors, spacing, semantic classes
- **Data loading** - Critical separate query pattern, cache invalidation
- **Best practices** - Correct vs incorrect patterns (e.g., display queries on mount)
- **Critical rules** - What NOT to do (common mistakes like conditional display queries)

**Use MedusaDocs MCP server for (SECONDARY SOURCE):**
- Specific component prop signatures after you know which component to use
- Available widget zones list
- JS SDK method details
- Configuration options reference

**Why skills come first:**
- Skills contain critical patterns like separate display/modal queries that MCP doesn't emphasize
- Skills show correct vs incorrect patterns; MCP shows what's possible
- Planning requires understanding patterns, not just API reference

## Critical Setup Rules

### SDK Client Configuration

**CRITICAL:** Always use exact configuration - different values cause errors:

```tsx
// src/admin/lib/client.ts
import Medusa from "@medusajs/js-sdk"

export const sdk = new Medusa({
  baseUrl: import.meta.env.VITE_BACKEND_URL || "/",
  debug: import.meta.env.DEV,
  auth: {
    type: "session",
  },
})
```

### pnpm Users ONLY

**CRITICAL:** Install peer dependencies BEFORE writing any code:

```bash
# Find exact version from dashboard
pnpm list @tanstack/react-query --depth=10 | grep @medusajs/dashboard
# Install that exact version
pnpm add @tanstack/react-query@[exact-version]

# If using navigation (Link component)
pnpm list react-router-dom --depth=10 | grep @medusajs/dashboard
pnpm add react-router-dom@[exact-version]
```

**npm/yarn users:** DO NOT install these packages - already available.

## Rule Categories by Priority

| Priority | Category | Impact | Prefix |
|----------|----------|--------|--------|
| 1 | Data Loading | CRITICAL | `data-` |
| 2 | Design System | CRITICAL | `design-` |
| 3 | Typography | HIGH | `typo-` |
| 4 | Forms & Modals | MEDIUM | `form-` |
| 5 | Selection Patterns | MEDIUM | `select-` |

## Quick Reference

### 1. Data Loading (CRITICAL)

- `data-display-on-mount` - Display queries MUST load on mount (no enabled condition based on UI state)
- `data-separate-queries` - Separate display queries from modal/form queries
- `data-invalidate-display` - Invalidate display queries after mutations, not just modal queries
- `data-loading-states` - Always show loading states (Spinner), not empty states
- `data-pnpm-install-first` - pnpm users MUST install @tanstack/react-query BEFORE coding

### 2. Design System (CRITICAL)

- `design-semantic-colors` - Always use semantic color classes (bg-ui-bg-base, text-ui-fg-subtle), never hardcoded
- `design-spacing` - Use px-6 py-4 for section padding, gap-2 for lists, gap-3 for items
- `design-button-size` - Always use size="small" for buttons in widgets and tables
- `design-medusa-components` - Always use Medusa UI components (Container, Button, Text), not raw HTML

### 3. Typography (HIGH)

- `typo-text-component` - Always use Text component from @medusajs/ui, never plain span/p tags
- `typo-labels` - Use `<Text size="small" leading="compact" weight="plus">` for labels/headings
- `typo-descriptions` - Use `<Text size="small" leading="compact" className="text-ui-fg-subtle">` for descriptions
- `typo-no-heading-widgets` - Never use Heading for small sections in widgets (use Text instead)

### 4. Forms & Modals (MEDIUM)

- `form-focusmodal-create` - Use FocusModal for creating new entities
- `form-drawer-edit` - Use Drawer for editing existing entities
- `form-disable-pending` - Always disable actions during mutations (disabled={mutation.isPending})
- `form-show-loading` - Show loading state on submit button (isLoading={mutation.isPending})

### 5. Selection Patterns (MEDIUM)

- `select-small-datasets` - Use Select component for 2-10 options (statuses, types, etc.)
- `select-large-datasets` - Use DataTable with FocusModal for large datasets (products, categories, etc.)
- `select-search-config` - Must pass search configuration to useDataTable to avoid "search not enabled" error

## Critical Data Loading Pattern

**ALWAYS follow this pattern - never load display data conditionally:**

```tsx
// ✅ CORRECT - Separate queries with proper responsibilities
const RelatedProductsWidget = ({ data: product }) => {
  const [modalOpen, setModalOpen] = useState(false)

  // Display query - loads on mount
  const { data: displayProducts } = useQuery({
    queryFn: () => fetchSelectedProducts(selectedIds),
    queryKey: ["related-products-display", product.id],
    // No 'enabled' condition - loads immediately
  })

  // Modal query - loads when needed
  const { data: modalProducts } = useQuery({
    queryFn: () => sdk.admin.product.list({ limit: 10, offset: 0 }),
    queryKey: ["products-selection"],
    enabled: modalOpen, // OK for modal-only data
  })

  // Mutation with proper invalidation
  const updateProduct = useMutation({
    mutationFn: updateFunction,
    onSuccess: () => {
      // Invalidate display data query to refresh UI
      queryClient.invalidateQueries({ queryKey: ["related-products-display", product.id] })
      // Also invalidate the entity query
      queryClient.invalidateQueries({ queryKey: ["product", product.id] })
      // Note: No need to invalidate modal selection query
    },
  })

  return (
    <Container>
      {/* Display uses displayProducts */}
      {displayProducts?.map(p => <div key={p.id}>{p.title}</div>)}

      <FocusModal open={modalOpen} onOpenChange={setModalOpen}>
        {/* Modal uses modalProducts */}
      </FocusModal>
    </Container>
  )
}

// ❌ WRONG - Single query with conditional loading
const BrokenWidget = ({ data: product }) => {
  const [modalOpen, setModalOpen] = useState(false)

  const { data } = useQuery({
    queryFn: () => sdk.admin.product.list(),
    enabled: modalOpen, // ❌ Display breaks on page refresh!
  })

  // Trying to display from modal query
  const displayItems = data?.filter(item => ids.includes(item.id)) // No data until modal opens

  return <div>{displayItems?.map(...)}</div> // Empty on mount!
}
```

**Why this matters:**
- On page refresh, modal is closed, so conditional query doesn't run
- User sees empty state instead of their data
- Display depends on modal interaction (broken UX)

## Common Mistakes Checklist

Before implementing, verify you're NOT doing these:

**Data Loading:**
- [ ] Loading display data conditionally based on modal/UI state
- [ ] Using a single query for both display and modal
- [ ] Forgetting to invalidate display queries after mutations
- [ ] Not handling loading states (showing empty instead of spinner)
- [ ] pnpm users: Not installing @tanstack/react-query before coding

**Design System:**
- [ ] Using hardcoded colors instead of semantic classes
- [ ] Forgetting size="small" on buttons in widgets
- [ ] Not using px-6 py-4 for section padding
- [ ] Using raw HTML elements instead of Medusa UI components

**Typography:**
- [ ] Using plain span/p tags instead of Text component
- [ ] Not using weight="plus" for labels
- [ ] Not using text-ui-fg-subtle for descriptions
- [ ] Using Heading in small widget sections

**Forms:**
- [ ] Using Drawer for creating (should use FocusModal)
- [ ] Using FocusModal for editing (should use Drawer)
- [ ] Not disabling buttons during mutations
- [ ] Not showing loading state on submit

**Selection:**
- [ ] Using DataTable for <10 items (overkill)
- [ ] Using Select for >10 items (poor UX)
- [ ] Not configuring search in useDataTable (causes error)

## Reference Files Available

Load these for detailed patterns:

```
references/data-loading.md       - useQuery/useMutation patterns, cache invalidation
references/forms.md              - FocusModal/Drawer patterns, validation
references/table-selection.md    - Complete DataTable selection pattern
references/display-patterns.md   - Lists, tables, cards for entities
references/typography.md         - Text component patterns
references/navigation.md         - Link, useNavigate, useParams patterns
```

Each reference contains:
- Step-by-step implementation guides
- Correct vs incorrect code examples
- Common mistakes and solutions
- Complete working examples

## Integration with Backend

Admin UI connects to backend API routes:

```tsx
// Fetch from custom backend route
const { data } = useQuery({
  queryKey: ["reviews", product.id],
  queryFn: () => sdk.client.fetch(`/admin/products/${product.id}/reviews`),
})

// Mutation to custom backend route
const createReview = useMutation({
  mutationFn: (data) => sdk.client.fetch("/admin/reviews", {
    method: "POST",
    body: data
  }),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ["reviews", product.id] })
    toast.success("Review created")
  },
})
```

**For implementing backend API routes**, load the `building-with-medusa` skill.

## Widget vs UI Route

**Widgets** extend existing admin pages:

```tsx
// src/admin/widgets/custom-widget.tsx
import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { DetailWidgetProps } from "@medusajs/framework/types"

const MyWidget = ({ data }: DetailWidgetProps<HttpTypes.AdminProduct>) => {
  return <Container>Widget content</Container>
}

export const config = defineWidgetConfig({
  zone: "product.details.after",
})

export default MyWidget
```

**UI Routes** create new admin pages:

```tsx
// src/admin/routes/custom-page/page.tsx
import { defineRouteConfig } from "@medusajs/admin-sdk"

const CustomPage = () => {
  return <div>Page content</div>
}

export const config = defineRouteConfig({
  label: "Custom Page",
})

export default CustomPage
```

## Common Issues & Solutions

**"Cannot find module" errors (pnpm users):**
- Install peer dependencies BEFORE coding
- Use exact versions from dashboard

**"No QueryClient set" error:**
- pnpm: Install @tanstack/react-query
- npm/yarn: Remove incorrectly installed package

**"DataTable.Search not enabled":**
- Must pass search configuration to useDataTable

**Widget not refreshing:**
- Invalidate display queries, not just modal queries
- Include all dependencies in query keys

**Display empty on refresh:**
- Display query has conditional `enabled` based on UI state
- Remove condition - display data must load on mount

## Next Steps - Testing Your Implementation

**After successfully implementing a feature, always provide these next steps to the user:**

### 1. Start the Development Server

If the server isn't already running, start it:

```bash
npm run dev      # or pnpm dev / yarn dev
```

### 2. Access the Admin Dashboard

Open your browser and navigate to:
- **Admin Dashboard:** http://localhost:9000/app

Log in with your admin credentials.

### 3. Navigate to Your Custom UI

**For Widgets:**
Navigate to the page where your widget is displayed. Common widget zones:
- **Product widgets:** Go to Products → Select a product → Your widget appears in the zone you configured (e.g., `product.details.after`)
- **Order widgets:** Go to Orders → Select an order → Your widget appears in the configured zone
- **Customer widgets:** Go to Customers → Select a customer → Your widget appears in the configured zone

**For UI Routes (Custom Pages):**
- Look for your custom page in the admin sidebar/navigation (based on the `label` you configured)
- Or navigate directly to: `http://localhost:9000/app/[your-route-path]`

### 4. Test Functionality

Depending on what was implemented, test:
- **Forms:** Try creating/editing entities, verify validation and error messages
- **Tables:** Test pagination, search, sorting, and row selection
- **Data display:** Verify data loads correctly and refreshes after mutations
- **Modals:** Open FocusModal/Drawer, test form submission, verify data updates
- **Navigation:** Click links and verify routing works correctly

### Format for Presenting Next Steps

Always present next steps in a clear, actionable format after implementation:

```markdown
## Implementation Complete

The [feature name] has been successfully implemented. Here's how to see it:

### Start the Development Server
[command based on package manager]

### Access the Admin Dashboard
Open http://localhost:9000/app in your browser and log in.

### View Your Custom UI

**For Widgets:**
1. Navigate to [specific admin page, e.g., "Products"]
2. Select [an entity, e.g., "any product"]
3. Scroll to [zone location, e.g., "the bottom of the page"]
4. You'll see your "[widget name]" widget

**For UI Routes:**
1. Look for "[page label]" in the admin navigation
2. Or navigate directly to http://localhost:9000/app/[route-path]

### What to Test
1. [Specific test case 1]
2. [Specific test case 2]
3. [Specific test case 3]
```
