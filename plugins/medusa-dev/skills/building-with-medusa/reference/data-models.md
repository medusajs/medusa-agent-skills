# Data Models

Data models represent tables in the database. Use Medusa's Data Model Language (DML) to define them.

## Property Types

```typescript
import { model } from "@medusajs/framework/utils"

const MyModel = model.define("my_model", {
  // Primary key (required)
  id: model.id().primaryKey(),

  // Text
  name: model.text(),
  description: model.text().nullable(),

  // Numbers
  quantity: model.number(),
  price: model.bigNumber(), // For high precision

  // Boolean
  is_active: model.boolean().default(true),

  // Enum
  status: model.enum(["draft", "published", "archived"]).default("draft"),

  // Date/Time
  published_at: model.dateTime().nullable(),

  // JSON (for flexible data)
  metadata: model.json().nullable(),

  // Array
  tags: model.array().nullable(),
})
```

## Property Modifiers

```typescript
model.text() // Required by default
model.text().nullable() // Allow null values
model.text().default("value") // Set default value
model.text().unique() // Unique constraint
model.text().primaryKey() // Set as primary key
```

## Relationships Within a Module

Define relationships between data models in the same module:

```typescript
// src/modules/blog/models/post.ts
import { model } from "@medusajs/framework/utils"
import { Comment } from "./comment"

export const Post = model.define("post", {
  id: model.id().primaryKey(),
  title: model.text(),
  comments: model.hasMany(() => Comment, {
    mappedBy: "post",
  }),
})

// src/modules/blog/models/comment.ts
import { model } from "@medusajs/framework/utils"
import { Post } from "./post"

export const Comment = model.define("comment", {
  id: model.id().primaryKey(),
  content: model.text(),
  post: model.belongsTo(() => Post, {
    mappedBy: "comments",
  }),
})
```

## Relationship Types

- `model.hasMany()` - One-to-many (post has many comments)
- `model.belongsTo()` - Many-to-one (comment belongs to post)
- `model.hasOne()` - One-to-one
- `model.manyToMany()` - Many-to-many

## Automatic Properties

Data models automatically include:

- `created_at` - Creation timestamp
- `updated_at` - Last update timestamp
- `deleted_at` - Soft delete timestamp

**Important**: Never add these properties explicitly to your model definitions.

## Generate and Run Migrations After Changes

After making changes to a data model, such as adding a property, you MUST generate migrations BEFORE running migrations:

```bash
npx medusa db:generate blog
npx medusa db:migrate
```
