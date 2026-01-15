# Typography Guidelines

## Contents
- [Core Typography Pattern](#core-typography-pattern)
- [Typography Rules](#typography-rules)
- [Complete Examples](#complete-examples)
- [Text Color Classes](#text-color-classes)
- [Common Patterns](#common-patterns)
- [Quick Reference](#quick-reference)

## Core Typography Pattern

Use the `Text` component from `@medusajs/ui` for all text elements. Follow these specific patterns:

### Headings/Labels

Use this pattern for section headings, field labels, or any primary text:

```tsx
<Text size="small" leading="compact" weight="plus">
  {labelText}
</Text>
```

### Body/Descriptions

Use this pattern for descriptions, helper text, or secondary information:

```tsx
<Text size="small" leading="compact" className="text-ui-fg-subtle">
  {descriptionText}
</Text>
```

## Typography Rules

- **Never use** `<Heading>` component for small sections within widgets/containers
- **Always use** `size="small"` and `leading="compact"` for consistency
- **Use** `weight="plus"` for labels and headings
- **Use** `className="text-ui-fg-subtle"` for secondary/descriptive text
- **For larger headings** (page titles, container headers), use the `<Heading>` component

## Complete Examples

### Widget Section with Label and Description

```tsx
import { Text } from "@medusajs/ui"

// In a container or widget:
<div className="flex flex-col gap-y-2">
  <Text size="small" leading="compact" weight="plus">
    Product Settings
  </Text>
  <Text size="small" leading="compact" className="text-ui-fg-subtle">
    Configure how this product appears in your store
  </Text>
</div>
```

### List Item with Title and Subtitle

```tsx
<div className="flex flex-col gap-y-1">
  <Text size="small" leading="compact" weight="plus">
    Premium T-Shirt
  </Text>
  <Text size="small" leading="compact" className="text-ui-fg-subtle">
    Size: Large • Color: Blue
  </Text>
</div>
```

### Container Header (Use Heading)

```tsx
import { Container, Heading } from "@medusajs/ui"

<Container className="divide-y p-0">
  <div className="flex items-center justify-between px-6 py-4">
    <Heading level="h2">Related Products</Heading>
  </div>
  {/* ... */}
</Container>
```

### Empty State Message

```tsx
<Text size="small" leading="compact" className="text-ui-fg-subtle">
  No related products selected
</Text>
```

### Form Field Label

```tsx
<div className="flex flex-col gap-y-2">
  <Text size="small" leading="compact" weight="plus">
    Display Name
  </Text>
  <Input {...props} />
</div>
```

### Error Message

```tsx
<Text size="small" className="text-ui-fg-error">
  This field is required
</Text>
```

### Badge or Status Text

```tsx
<div className="flex items-center gap-x-2">
  <Text size="small" leading="compact" weight="plus">
    Status:
  </Text>
  <Text size="small" leading="compact" className="text-ui-fg-subtle">
    Active
  </Text>
</div>
```

## Text Color Classes

Medusa UI provides semantic color classes:

- `text-ui-fg-base` - Default text color (rarely needed, it's the default)
- `text-ui-fg-subtle` - Secondary/muted text
- `text-ui-fg-muted` - Even more muted
- `text-ui-fg-disabled` - Disabled state
- `text-ui-fg-error` - Error messages
- `text-ui-fg-success` - Success messages
- `text-ui-fg-warning` - Warning messages

## Common Patterns

### Two-Column Layout

```tsx
<div className="grid grid-cols-2 gap-4">
  <div className="flex flex-col gap-y-1">
    <Text size="small" leading="compact" className="text-ui-fg-subtle">
      Category
    </Text>
    <Text size="small" leading="compact" weight="plus">
      Clothing
    </Text>
  </div>
  <div className="flex flex-col gap-y-1">
    <Text size="small" leading="compact" className="text-ui-fg-subtle">
      Status
    </Text>
    <Text size="small" leading="compact" weight="plus">
      Published
    </Text>
  </div>
</div>
```

### Inline Label-Value Pair

```tsx
<div className="flex items-center gap-x-2">
  <Text size="small" leading="compact" className="text-ui-fg-subtle">
    SKU:
  </Text>
  <Text size="small" leading="compact" weight="plus">
    SHIRT-001
  </Text>
</div>
```

### Card with Title and Metadata

```tsx
<div className="flex flex-col gap-y-2">
  <Text size="small" leading="compact" weight="plus">
    Premium Cotton T-Shirt
  </Text>
  <div className="flex items-center gap-x-2 text-ui-fg-subtle">
    <Text size="small" leading="compact">
      $29.99
    </Text>
    <Text size="small" leading="compact">
      •
    </Text>
    <Text size="small" leading="compact">
      In stock
    </Text>
  </div>
</div>
```

## Quick Reference

| Use Case | Pattern |
|----------|---------|
| Section headings | `weight="plus"` |
| Primary text | `weight="plus"` |
| Labels | `weight="plus"` |
| Descriptions | `className="text-ui-fg-subtle"` |
| Helper text | `className="text-ui-fg-subtle"` |
| Metadata | `className="text-ui-fg-subtle"` |
| Errors | `className="text-ui-fg-error"` |
| Empty states | `className="text-ui-fg-subtle"` |
| Large headers | `<Heading>` component |
