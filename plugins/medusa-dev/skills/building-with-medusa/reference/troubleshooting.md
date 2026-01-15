# Troubleshooting Common Medusa Backend Issues

This guide covers common errors and their solutions when building with Medusa.

## Contents
- [Module Registration Errors](#module-registration-errors)
- [API Route Errors](#api-route-errors)
- [Authentication Errors](#authentication-errors)
- [General Debugging Tips](#general-debugging-tips)

## Module Registration Errors

### Error: Module "X" not registered

```
Error: Module "my-module" is not registered in the container
```

**Cause**: Module not added to `medusa-config.ts` or server not restarted.

**Solution**:
1. Add module to `medusa-config.ts`:
```typescript
module.exports = defineConfig({
  modules: [
    { resolve: "./src/modules/my-module" }
  ],
})
```
2. Restart the Medusa server

### Error: Cannot find module './modules/X'

```
Error: Cannot find module './modules/my-module'
```

**Cause**: Module path is incorrect or module structure is incomplete.

**Solution**:
1. Verify module structure:
```
src/modules/my-module/
├── models/
│   └── my-model.ts
├── service.ts
└── index.ts
```
2. Ensure `index.ts` exports the module correctly
3. Check path in `medusa-config.ts` matches actual directory

## API Route Errors

### Error: validatedBody is undefined

```
TypeError: Cannot read property 'email' of undefined
```

**Cause**: Forgot to add validation middleware or accessing `req.validatedBody` instead of `req.body`.

**Solution**:
1. Add validation middleware:
```typescript
// middlewares.ts
export const myMiddlewares: MiddlewareRoute[] = [
  {
    matcher: "/store/my-route",
    method: "POST",
    middlewares: [validateAndTransformBody(MySchema)],
  },
]
```
2. Access `req.validatedBody` not `req.body`

### Error: queryConfig is undefined

```
TypeError: Cannot spread undefined
```

**Cause**: Using `...req.queryConfig` without setting up query config middleware.

**Solution**:
Add `validateAndTransformQuery` middleware:
```typescript
import { createFindParams } from "@medusajs/medusa/api/utils/validators"

export const GetMyItemsSchema = createFindParams()

export default defineMiddlewares({
  routes: [
    {
      matcher: "/store/my-items",
      method: "GET",
      middlewares: [
        validateAndTransformQuery(GetMyItemsSchema, {
          defaults: ["id", "name"],
          isList: true,
        }),
      ],
    },
  ],
})
```

### Error: MedusaError not being formatted

```
Error: [object Object]
```

**Cause**: Throwing regular `Error` instead of `MedusaError`.

**Solution**:
```typescript
// ❌ WRONG
throw new Error("Not found")

// ✅ CORRECT
import { MedusaError } from "@medusajs/framework/utils"
throw new MedusaError(MedusaError.Types.NOT_FOUND, "Not found")
```

### Error: Middleware not applying

```
Error: Route is not being validated
```

**Cause**: Middleware matcher doesn't match route path or middleware not registered.

**Solution**:
1. Check matcher pattern matches your route:
```typescript
// For route: /store/my-route
matcher: "/store/my-route" // Exact match

// For multiple routes: /store/my-route, /store/my-route/123
matcher: "/store/my-route*" // Wildcard
```
2. Ensure middleware is exported and registered in `api/middlewares.ts`

## Authentication Errors

### Error: auth_context is undefined

```
TypeError: Cannot read property 'actor_id' of undefined
```

**Cause**: Route is not protected or user is not authenticated.

**Solution**:
1. Check if route is under protected prefix (`/admin/*` or `/store/customers/me/*`)
2. If custom prefix, add authentication middleware:
```typescript
export default defineMiddlewares({
  routes: [
    {
      matcher: "/custom/admin*",
      middlewares: [authenticate("user", ["session", "bearer", "api-key"])],
    },
  ],
})
```
3. For optional auth, check if `auth_context` exists:
```typescript
const userId = req.auth_context?.actor_id
if (!userId) {
  // Handle unauthenticated case
}
```

## General Debugging Tips

### Enable Debug Logging

```bash
# Set log level to debug
LOG_LEVEL=debug npx medusa develop
```

### Log Values In Workflows with Transform

```typescript
import { 
  createStep, 
  createWorkflow, 
  StepResponse, 
  WorkflowResponse,
  transform,
} from "@medusajs/framework/workflows-sdk"

const step1 = createStep(
  "step-1",
  async () => {
    const message = "Hello from step 1!"

    return new StepResponse(
      message
    )
  }
)

export const myWorkflow = createWorkflow(
  "my-workflow",
  () => {
    const response = step1()

    const transformedMessage = transform(
      { response },
      (data) => {
        const upperCase = data.response.toUpperCase()
        console.log("Transformed Data:", upperCase)
        return upperCase
      }
    )

    return new WorkflowResponse({
      response: transformedMessage,
    })
  }
)
```