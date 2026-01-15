# Forms and Modal Patterns

## Contents
- [FocusModal vs Drawer](#focusmodal-vs-drawer)
- [Edit Button Patterns](#edit-button-patterns)
  - [Simple Edit Button (top right corner)](#simple-edit-button-top-right-corner)
  - [Dropdown Menu with Actions](#dropdown-menu-with-actions)
- [Select Component for Small Datasets](#select-component-for-small-datasets)
- [FocusModal Example](#focusmodal-example)
- [Drawer Example](#drawer-example)
- [Form with Validation and Loading States](#form-with-validation-and-loading-states)
- [Key Form Patterns](#key-form-patterns)

## FocusModal vs Drawer

**FocusModal** - Use for creating new entities:
- Full-screen modal
- More space for complex forms
- Better for multi-step flows

**Drawer** - Use for editing existing entities:
- Side panel that slides in from right
- Quick edits without losing context
- Better for single-field updates

**Rule of thumb:** FocusModal for creating, Drawer for editing.

## Edit Button Patterns

Data displayed in a container should not be editable directly. Instead, use an "Edit" button. This can be:

### Simple Edit Button (top right corner)

```tsx
import { Button } from "@medusajs/ui"
import { PencilSquare } from "@medusajs/icons"

<div className="flex items-center justify-between px-6 py-4">
  <Heading level="h2">Section Title</Heading>
  <Button
    size="small"
    variant="secondary"
    onClick={() => setOpen(true)}
  >
    <PencilSquare />
  </Button>
</div>
```

### Dropdown Menu with Actions

```tsx
import { EllipsisHorizontal, PencilSquare, Plus, Trash } from "@medusajs/icons"
import { DropdownMenu, IconButton } from "@medusajs/ui"

export function DropdownMenuDemo() {
  return (
    <DropdownMenu>
      <DropdownMenu.Trigger asChild>
        <IconButton size="small" variant="transparent">
          <EllipsisHorizontal />
        </IconButton>
      </DropdownMenu.Trigger>
      <DropdownMenu.Content>
        <DropdownMenu.Item className="gap-x-2">
          <PencilSquare className="text-ui-fg-subtle" />
          Edit
        </DropdownMenu.Item>
        <DropdownMenu.Item className="gap-x-2">
          <Plus className="text-ui-fg-subtle" />
          Add
        </DropdownMenu.Item>
        <DropdownMenu.Separator />
        <DropdownMenu.Item className="gap-x-2">
          <Trash className="text-ui-fg-subtle" />
          Delete
        </DropdownMenu.Item>
      </DropdownMenu.Content>
    </DropdownMenu>
  )
}
```

## Select Component for Small Datasets

For selecting from 2-10 options (statuses, types, etc.), use the Select component:

```tsx
import { Select } from "@medusajs/ui"

<Select>
  <Select.Trigger>
    <Select.Value placeholder="Select status" />
  </Select.Trigger>
  <Select.Content>
    {items.map((item) => (
      <Select.Item key={item.value} value={item.value}>
        {item.label}
      </Select.Item>
    ))}
  </Select.Content>
</Select>
```

**For larger datasets** (Products, Categories, Regions, etc.), use DataTable with FocusModal for search and pagination. See [table-selection.md](table-selection.md) for the complete pattern.

## FocusModal Example

```tsx
import { FocusModal, Button, Input, Label } from "@medusajs/ui"
import { useState } from "react"

const MyWidget = () => {
  const [open, setOpen] = useState(false)
  const [formData, setFormData] = useState({ title: "" })

  const handleSubmit = () => {
    // Handle form submission
    console.log(formData)
    setOpen(false)
  }

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        Create New
      </Button>

      <FocusModal open={open} onOpenChange={setOpen}>
        <FocusModal.Content>
          <div className="flex h-full flex-col overflow-hidden">
            <FocusModal.Header>
              <div className="flex items-center justify-end gap-x-2">
                <FocusModal.Close asChild>
                  <Button size="small" variant="secondary">
                    Cancel
                  </Button>
                </FocusModal.Close>
                <Button size="small" onClick={handleSubmit}>
                  Save
                </Button>
              </div>
            </FocusModal.Header>

            <FocusModal.Body className="flex-1 overflow-auto">
              <div className="flex flex-col gap-y-4">
                <div className="flex flex-col gap-y-2">
                  <Label>Title</Label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  />
                </div>
                {/* More form fields */}
              </div>
            </FocusModal.Body>
          </div>
        </FocusModal.Content>
      </FocusModal>
    </>
  )
}
```

## Drawer Example

```tsx
import { Drawer, Button, Input, Label } from "@medusajs/ui"
import { useState } from "react"

const MyWidget = ({ data }) => {
  const [open, setOpen] = useState(false)
  const [formData, setFormData] = useState({ title: data.title })

  const handleSubmit = () => {
    // Handle form submission
    console.log(formData)
    setOpen(false)
  }

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        Edit
      </Button>

      <Drawer open={open} onOpenChange={setOpen}>
        <Drawer.Content>
          <Drawer.Header>
            <Drawer.Title>Edit Settings</Drawer.Title>
          </Drawer.Header>

          <Drawer.Body className="flex-1 overflow-auto p-4">
            <div className="flex flex-col gap-y-4">
              <div className="flex flex-col gap-y-2">
                <Label>Title</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </div>
              {/* More form fields */}
            </div>
          </Drawer.Body>

          <Drawer.Footer>
            <div className="flex items-center justify-end gap-x-2">
              <Drawer.Close asChild>
                <Button size="small" variant="secondary">
                  Cancel
                </Button>
              </Drawer.Close>
              <Button size="small" onClick={handleSubmit}>
                Save
              </Button>
            </div>
          </Drawer.Footer>
        </Drawer.Content>
      </Drawer>
    </>
  )
}
```

## Form with Validation and Loading States

```tsx
import { FocusModal, Button, Input, Label, Text, toast } from "@medusajs/ui"
import { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { sdk } from "../lib/client"

const CreateProductWidget = () => {
  const [open, setOpen] = useState(false)
  const [formData, setFormData] = useState({
    title: "",
    description: "",
  })
  const [errors, setErrors] = useState({})
  const queryClient = useQueryClient()

  const createProduct = useMutation({
    mutationFn: (data) => sdk.admin.product.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] })
      toast.success("Product created successfully")
      setOpen(false)
      setFormData({ title: "", description: "" })
      setErrors({})
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create product")
    },
  })

  const handleSubmit = () => {
    // Validate
    const newErrors = {}
    if (!formData.title) newErrors.title = "Title is required"
    if (!formData.description) newErrors.description = "Description is required"

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    createProduct.mutate(formData)
  }

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        Create Product
      </Button>

      <FocusModal open={open} onOpenChange={setOpen}>
        <FocusModal.Content>
          <div className="flex h-full flex-col overflow-hidden">
            <FocusModal.Header>
              <div className="flex items-center justify-end gap-x-2">
                <FocusModal.Close asChild>
                  <Button
                    size="small"
                    variant="secondary"
                    disabled={createProduct.isPending}
                  >
                    Cancel
                  </Button>
                </FocusModal.Close>
                <Button
                  size="small"
                  onClick={handleSubmit}
                  isLoading={createProduct.isPending}
                >
                  Save
                </Button>
              </div>
            </FocusModal.Header>

            <FocusModal.Body className="flex-1 overflow-auto">
              <div className="flex flex-col gap-y-4">
                <div className="flex flex-col gap-y-2">
                  <Label>Title *</Label>
                  <Input
                    value={formData.title}
                    onChange={(e) => {
                      setFormData({ ...formData, title: e.target.value })
                      setErrors({ ...errors, title: undefined })
                    }}
                  />
                  {errors.title && (
                    <Text size="small" className="text-ui-fg-error">
                      {errors.title}
                    </Text>
                  )}
                </div>

                <div className="flex flex-col gap-y-2">
                  <Label>Description *</Label>
                  <Input
                    value={formData.description}
                    onChange={(e) => {
                      setFormData({ ...formData, description: e.target.value })
                      setErrors({ ...errors, description: undefined })
                    }}
                  />
                  {errors.description && (
                    <Text size="small" className="text-ui-fg-error">
                      {errors.description}
                    </Text>
                  )}
                </div>
              </div>
            </FocusModal.Body>
          </div>
        </FocusModal.Content>
      </FocusModal>
    </>
  )
}
```

## Key Form Patterns

### Always Disable Actions During Mutations

```tsx
<Button
  disabled={mutation.isPending}
  onClick={handleAction}
>
  Action
</Button>
```

### Show Loading State on Submit Button

```tsx
<Button
  isLoading={mutation.isPending}
  onClick={handleSubmit}
>
  Save
</Button>
```

### Clear Form After Success

```tsx
onSuccess: () => {
  setFormData(initialState)
  setErrors({})
  setOpen(false)
}
```

### Validate Before Submitting

```tsx
const handleSubmit = () => {
  const errors = validateForm(formData)
  if (Object.keys(errors).length > 0) {
    setErrors(errors)
    return
  }
  mutation.mutate(formData)
}
```

### Clear Field Errors on Input Change

```tsx
<Input
  value={formData.field}
  onChange={(e) => {
    setFormData({ ...formData, field: e.target.value })
    setErrors({ ...errors, field: undefined }) // Clear error
  }}
/>
```
