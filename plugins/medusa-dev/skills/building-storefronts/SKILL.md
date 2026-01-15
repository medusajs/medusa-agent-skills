---
name: building-storefronts
description: Load automatically when planning, researching, or implementing Medusa storefront features (calling custom API routes, SDK integration, React Query patterns, data fetching). REQUIRED for all storefront development in ALL modes (planning, implementation, exploration). Contains SDK usage patterns, frontend integration, and critical rules for calling Medusa APIs.
---

# Medusa Storefront Development

Frontend integration guide for building storefronts with Medusa. Covers SDK usage, React Query patterns, and calling custom API routes.

## When to Apply

**Load this skill for ANY storefront development task, including:**
- Calling custom Medusa API routes from the storefront
- Integrating Medusa SDK in frontend applications
- Using React Query for data fetching
- Implementing mutations with optimistic updates
- Error handling and cache invalidation

**Also load building-with-medusa when:** Building the backend API routes that the storefront calls

## CRITICAL: Load Reference Files When Needed

**The quick reference below is NOT sufficient for implementation.** You MUST load the reference file before writing storefront integration code.

**Load this reference when implementing storefront features:**

- **Calling API routes?** → MUST load `references/frontend-integration.md` first
- **Using SDK?** → MUST load `references/frontend-integration.md` first
- **Implementing React Query?** → MUST load `references/frontend-integration.md` first

## Rule Categories by Priority

| Priority | Category | Impact | Prefix |
|----------|----------|--------|--------|
| 1 | SDK Usage | CRITICAL | `sdk-` |
| 2 | React Query Patterns | HIGH | `query-` |
| 3 | Error Handling | MEDIUM | `error-` |

## Quick Reference

### 1. SDK Usage (CRITICAL)

- `sdk-no-json-stringify` - **NEVER use JSON.stringify() on body** - SDK handles serialization automatically
- `sdk-plain-objects` - Pass plain JavaScript objects to body, not strings
- `sdk-locate-first` - Always locate where SDK is instantiated in the project before using it
- `sdk-client-fetch` - Use `sdk.client.fetch()` for custom API routes
- `sdk-auto-headers` - SDK automatically adds Content-Type, auth headers, and API key

### 2. React Query Patterns (HIGH)

- `query-use-query` - Use `useQuery` for GET requests (data fetching)
- `query-use-mutation` - Use `useMutation` for POST/DELETE requests (mutations)
- `query-invalidate` - Invalidate queries in `onSuccess` to refresh data after mutations
- `query-keys-hierarchical` - Structure query keys hierarchically for effective cache management
- `query-loading-states` - Always handle `isLoading`, `isPending`, `isError` states

### 3. Error Handling (MEDIUM)

- `error-on-error` - Implement `onError` callback in mutations to handle failures
- `error-display` - Show error messages to users when mutations fail
- `error-rollback` - Use optimistic updates with rollback on error for better UX

## Critical SDK Pattern

**ALWAYS pass plain objects to the SDK - NEVER use JSON.stringify():**

```typescript
// ✅ CORRECT - Plain object
await sdk.client.fetch("/store/reviews", {
  method: "POST",
  body: {
    product_id: "prod_123",
    rating: 5,
  }
})

// ❌ WRONG - JSON.stringify breaks the request
await sdk.client.fetch("/store/reviews", {
  method: "POST",
  body: JSON.stringify({  // ❌ DON'T DO THIS!
    product_id: "prod_123",
    rating: 5,
  })
})
```

**Why this matters:**
- The SDK handles JSON serialization automatically
- Using JSON.stringify() will double-serialize and break the request
- The server won't be able to parse the body

## Common Mistakes Checklist

Before implementing, verify you're NOT doing these:

**SDK Usage:**
- [ ] Using JSON.stringify() on the body parameter
- [ ] Manually setting Content-Type headers (SDK adds them)
- [ ] Hardcoding SDK import paths (locate in project first)
- [ ] Not using sdk.client.fetch() for custom routes

**React Query:**
- [ ] Not invalidating queries after mutations
- [ ] Using flat query keys instead of hierarchical
- [ ] Not handling loading and error states
- [ ] Forgetting to disable buttons during mutations (isPending)

**Error Handling:**
- [ ] Not implementing onError callbacks
- [ ] Not showing error messages to users
- [ ] Not handling network failures gracefully

## How to Use

**For detailed patterns and examples, load reference file:**

```
references/frontend-integration.md - SDK usage, React Query patterns, API integration
```

The reference file contains:
- Step-by-step SDK integration patterns
- Complete React Query examples
- Correct vs incorrect code examples
- Query key best practices
- Optimistic update patterns
- Error handling strategies

## When to Use MedusaDocs MCP Server

**Use this skill for (PRIMARY SOURCE):**
- How to call custom API routes from storefront
- SDK usage patterns (sdk.client.fetch)
- React Query integration patterns
- Common mistakes and anti-patterns

**Use MedusaDocs MCP server for (SECONDARY SOURCE):**
- Built-in SDK methods (sdk.admin.*, sdk.store.*)
- Official Medusa SDK API reference
- Framework-specific configuration options

**Why skills come first:**
- Skills contain critical patterns like "don't use JSON.stringify" that MCP doesn't emphasize
- Skills show correct vs incorrect patterns; MCP shows what's possible
- Planning requires understanding patterns, not just API reference

## Integration with Backend

When building features that span backend and frontend:

1. **Backend (building-with-medusa skill):** Module → Workflow → API Route
2. **Storefront (this skill):** SDK → React Query → UI Components
3. **Connection:** Storefront calls backend API routes via `sdk.client.fetch()`

See `building-with-medusa` for backend API route patterns.
