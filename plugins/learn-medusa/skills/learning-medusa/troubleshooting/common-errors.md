# Common Errors and Solutions

This is a comprehensive catalog of errors you might encounter while learning Medusa development. Errors are organized by category with symptoms, causes, and step-by-step solutions.

## Module Errors

### "Cannot find module 'brand'"

**Symptom**: Build fails or server crashes with module not found error

**Cause**: Module not registered in `medusa-config.ts`

**Solution**:
1. Open `medusa-config.ts`
2. Add module to `modules` array:
   ```typescript
   modules: [
     {
       resolve: "./modules/brand",
       options: {},
     },
   ]
   ```
3. Restart dev server: `npm run dev`

---

### "Module name must be camelCase"

**Symptom**: Error about module naming convention

**Cause**: Used kebab-case or PascalCase for module name

**Solution**:
Use camelCase in module definition:
```typescript
// ❌ WRONG
export default Module("brand-module", { ... })
export default Module("BrandModule", { ... })

// ✅ CORRECT
export default Module("brand", { ... })
```

---

### "Property 'brand' does not exist on type..."

**Symptom**: TypeScript errors about missing properties

**Cause**: Medusa hasn't regenerated types for new module

**Solution**:
1. Ensure migrations ran successfully: `npx medusa db:migrate`
2. Restart dev server (regenerates types): `npm run dev`
3. If issue persists, rebuild: `npm run build`

---

## Workflow Errors

### "Async function not allowed in workflow"

**Symptom**: TypeScript error or runtime warning

**Cause**: Workflow function declared as `async function`

**Solution**:
Remove `async` keyword from workflow function:
```typescript
// ❌ WRONG
createWorkflow("name", async function (input) {
  // ...
})

// ✅ CORRECT
createWorkflow("name", function (input) {
  // ...
})
```

---

### "Cannot use await in workflow"

**Symptom**: Error about await usage

**Cause**: Using `await` when calling steps

**Solution**:
Remove `await` - steps are called synchronously in workflow definition:
```typescript
// ❌ WRONG
const result = await createBrandStep(input)

// ✅ CORRECT
const result = createBrandStep(input)
```

---

## API Route Errors

### "Middleware not running / validation not working"

**Symptom**: Invalid data passes through without errors

**Cause**: Middleware not configured correctly

**Solution**:
1. Check `matcher` exactly matches route: `"/admin/brands"`
2. Check `method` is uppercase: `"POST"`
3. Ensure file is at `src/api/middlewares.ts`
4. Restart dev server after middleware changes

---

### "Route not found" / 404 error

**Symptom**: cURL or browser returns 404

**Cause**: File not in correct location or not named correctly

**Solution**:
1. Ensure file is at `src/api/admin/brands/route.ts`
2. Ensure function is exported with correct name: `export const POST`
3. Restart dev server
4. Check URL is correct: `http://localhost:9000/admin/brands`

---

## Module Link Errors

### "Link sync failed"

**Symptom**: `npx medusa db:sync-links` fails

**Cause**: Module not registered or server not recognizing module

**Solution**:
1. Verify module is in `medusa-config.ts`
2. Restart dev server: `npm run dev`
3. Try sync again: `npx medusa db:sync-links`

---

## Query Errors

### "metadata is undefined"

**Symptom**: Error accessing count, take, skip

**Cause**: Incorrect destructuring (shouldn't happen, but handle defensively)

**Solution**:
Use default values:
```typescript
const {
  data: brands,
  metadata: { count, take, skip } = {},
} = await query.graph({ ... })

res.json({
  brands,
  count: count || 0,
  limit: take || 15,
  offset: skip || 0,
})
```

---

### "products field not included"

**Symptom**: Brand objects don't have products array

**Cause**: Middleware defaults don't include products relation

**Solution**:
Add to middleware defaults:
```typescript
validateAndTransformQuery(GetBrandsSchema, {
  defaults: ["id", "name", "products.*"],
  isList: true,
})
```

---

## Admin UI Errors

### "Cannot find module '@tanstack/react-query'" (pnpm users)

**Symptom**: Build or runtime error

**Cause**: pnpm strict dependency resolution

**Solution**:
Find exact version and install:
```bash
pnpm list @tanstack/react-query --depth=10 | grep @medusajs/dashboard
pnpm add @tanstack/react-query@5.x.x
```

---

### "Widget not showing"

**Symptom**: Widget doesn't appear on page

**Causes and Solutions**:

**Cause 1**: Wrong zone name
- **Solution**: Use exact zone: `"product.details"`

**Cause 2**: Config not exported
- **Solution**: Export config:
  ```typescript
  export const config = defineWidgetConfig({ zone: "..." })
  ```

**Cause 3**: File not in correct location
- **Solution**: Ensure file is at `src/admin/widgets/[name].tsx`

**Cause 4**: Dev server not restarted
- **Solution**: Restart: `npm run dev`

**Cause 5**: Component not default exported
- **Solution**: Add default export:
  ```typescript
  export default WidgetComponent
  ```

---

### "Route not showing in sidebar"

**Symptom**: Can't see route in navigation

**Causes and Solutions**:

**Cause 1**: Config not exported
- **Solution**: Export config:
  ```typescript
  export const config = defineRouteConfig({
    label: "Brands",
    icon: TagSolid,
  })
  ```

**Cause 2**: Wrong file name
- **Solution**: Must be `page.tsx` (not `route.tsx` or `index.tsx`)

**Cause 3**: File not in correct location
- **Solution**: Should be at `src/admin/routes/brands/page.tsx`

**Cause 4**: Dev server not restarted
- **Solution**: Restart dev server

---

### "sdk is not defined"

**Symptom**: Runtime error about sdk

**Cause**: SDK not imported or initialized

**Solution**:
1. Create `src/admin/lib/sdk.ts`:
   ```typescript
   import Medusa from "@medusajs/js-sdk"

   export const sdk = new Medusa({
     baseUrl: import.meta.env.VITE_BACKEND_URL || "/",
     debug: import.meta.env.DEV,
     auth: { type: "session" },
   })
   ```
2. Import in widget/route:
   ```typescript
   import { sdk } from "../../lib/sdk"
   ```

---

## Database Errors

### "Connection refused" / "Cannot connect to database"

**Symptom**: Server can't connect to PostgreSQL

**Cause**: Database not running or wrong credentials

**Solution**:
1. Check database is running:
   ```bash
   # macOS with Homebrew
   brew services list
   brew services start postgresql

   # Linux with systemd
   sudo systemctl status postgresql
   sudo systemctl start postgresql
   ```
2. Check credentials in `.env`:
   ```
   DATABASE_URL=postgres://user:password@localhost:5432/medusa-db
   ```
3. Test connection:
   ```bash
   psql $DATABASE_URL -c "SELECT 1"
   ```

---

### "Permission denied for relation"

**Symptom**: SQL permission error

**Cause**: Database user doesn't have required permissions

**Solution**:
Grant permissions to user:
```bash
psql postgres -c "ALTER USER your_user CREATEDB;"
psql your_database -c "GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO your_user;"
```

---

## Build Errors

---

## Data Conventions & Common Mistakes

### Incorrect Price Values

**Symptom**: Prices displaying incorrectly (e.g., showing $1999 instead of $19.99)

**Cause**: Using cents/smallest unit instead of actual price value

**Solution**:
Medusa stores prices as-is, NOT in cents or smallest currency unit:

```typescript
// ❌ WRONG - Using cents
{
  "amount": 1999,  // This will display as $1999, not $19.99
  "currency_code": "usd"
}

// ✅ CORRECT - Using actual price
{
  "amount": 19.99,  // This displays correctly as $19.99
  "currency_code": "usd"
}
```

**Examples**:
- $10.00 → `"amount": 10` (not `1000`)
- €25.50 → `"amount": 25.50` (not `2550`)
- ¥1000 → `"amount": 1000` (not `100000`)

**Why this matters**: Payment systems like Stripe use cents, but Medusa handles the conversion internally. Always use the actual price value in your requests and data models.

---

## General Debugging Tips

1. **Check logs**: Always read error messages carefully
2. **Restart server**: Many issues resolve with a fresh start
3. **Isolate issue**: Test components independently
4. **Use TypeScript**: Type errors often reveal issues early

## Getting More Help

If you encounter an error not listed here:

1. **Check official docs**: [docs.medusajs.com](https://docs.medusajs.com)
2. **Search GitHub issues**: [github.com/medusajs/medusa](https://github.com/medusajs/medusa)
3. **Ask in Discord**: [discord.gg/medusajs](https://discord.gg/medusajs)
4. **Use MCP server**: Query MedusaDocs for latest information

When asking for help, include:
- Error message (full stack trace)
- Steps to reproduce
- Your code (relevant files)
- Medusa version: `npx medusa --version`
- Node version: `node --version`
