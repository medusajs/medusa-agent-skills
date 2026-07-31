# Verification Guide: How to Test Each Component

This guide provides systematic testing procedures for each component type in Medusa. Use these methods to verify your implementations work correctly.

## Important Medusa Conventions

### Price Storage

**Prices in Medusa are stored as-is, NOT in cents or smallest currency unit.**

- If a product costs $10, store it as `10` (not `1000`)
- If a product costs €25.50, store it as `25.50` (not `2550`)
- If a product costs ¥1000, store it as `1000` (not `100000`)

**Example**:
```json
{
  "title": "T-Shirt",
  "variants": [
    {
      "prices": [
        {
          "amount": 19.99,  // $19.99, NOT 1999
          "currency_code": "usd"
        }
      ]
    }
  ]
}
```

**Why this matters**: Many payment systems (like Stripe) use cents, but Medusa handles the conversion internally. Always use the actual price value in your API requests and data models.

---

## Module Verification

### Step 1: Build Test

Verify module compiles without errors:

```bash
npm run build
```

**Expected**: Build succeeds without TypeScript errors.

**If it fails**: Check module definition, imports, and type definitions.

### Step 2: Migration Test

Verify database table created:

```bash
# Run migrations
npx medusa db:migrate

# Connect to database
psql your_database_name

# Check table exists
\dt brand

# Check table structure
\d brand

# Expected output:
# Columns: id, name, created_at, updated_at
```

### Step 3: Service Resolution Test

Create a custom CLI script to verify service can be resolved:

```typescript
// src/scripts/test-brand-service.ts
import { ExecArgs } from "@medusajs/framework/types"

export default async function testServiceResolution({ container }: ExecArgs) {
  const brandService = container.resolve("brand")

  console.log("Service resolved:", !!brandService)
  console.log("Methods available:", typeof brandService.createBrands === "function")
}
```

Execute the script:

```bash
npx medusa exec ./src/scripts/test-brand-service.ts
```

**Expected**: Service resolves and has CRUD methods.

### Step 4: Direct Service Test

Create a custom CLI script to test CRUD operations:

```typescript
// src/scripts/test-brand-crud.ts
import { ExecArgs } from "@medusajs/framework/types"

export default async function testCRUD({ container }: ExecArgs) {
  const brandService = container.resolve("brand")

  // Create
  const [brand] = await brandService.createBrands([{ name: "Test Brand" }])
  console.log("Created:", brand)

  // Retrieve
  const [retrieved] = await brandService.retrieveBrands([brand.id])
  console.log("Retrieved:", retrieved)

  // Update
  const [updated] = await brandService.updateBrands([{
    id: brand.id,
    name: "Updated Brand"
  }])
  console.log("Updated:", updated)

  // List
  const brands = await brandService.listBrands()
  console.log("Listed:", brands.length, "brands")

  // Delete
  await brandService.deleteBrands([brand.id])
  console.log("Deleted successfully")
}
```

Execute the script:

```bash
npx medusa exec ./src/scripts/test-brand-crud.ts
```

**Expected**: All operations succeed without errors.

---

## Workflow Verification

### Step 1: Build Test

Verify workflow compiles:

```bash
npm run build
```

**Expected**: No errors about async/await, arrow functions, or workflow syntax.

### Step 2: Workflow Execution Test

Create a custom CLI script to test workflow execution:

```typescript
// src/scripts/test-create-brand-workflow.ts
import { ExecArgs } from "@medusajs/framework/types"
import { createBrandWorkflow } from "../workflows/create-brand"

export default async function testWorkflowExecution({ container }: ExecArgs) {
  const { result } = await createBrandWorkflow(container)
    .run({ input: { name: "Nike" } })

  console.log("Workflow result:", result)
}
```

Execute the script:

```bash
npx medusa exec ./src/scripts/test-create-brand-workflow.ts
```

**Expected**: Workflow completes successfully, brand created.

### Step 3: Rollback Test

First, create a test workflow that intentionally fails:

```typescript
// src/workflows/test-rollback.ts
import { createWorkflow, createStep, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import { createBrandStep } from "./create-brand"

// Create a step that will intentionally fail
const intentionalFailStep = createStep(
  "intentional-fail",
  async () => {
    throw new Error("Intentional failure for rollback test")
  }
)

// Create a workflow that intentionally fails after brand creation
export const testRollbackWorkflow = createWorkflow(
  "test-rollback",
  function (input) {
    const brand = createBrandStep(input)

    // This step will fail
    intentionalFailStep()

    return new WorkflowResponse(brand)
  }
)
```

Then create a custom CLI script to test rollback:

```typescript
// src/scripts/test-rollback.ts
import { ExecArgs } from "@medusajs/framework/types"
import { testRollbackWorkflow } from "../workflows/test-rollback"

export default async function testRollback({ container }: ExecArgs) {
  const brandService = container.resolve("brand")

  const beforeCount = (await brandService.listBrands()).length

  try {
    await testRollbackWorkflow(container)
      .run({ input: { name: "Will Be Rolled Back" } })
  } catch (error) {
    console.log("Expected error:", error.message)
  }

  const afterCount = (await brandService.listBrands()).length

  console.log("Brand count before:", beforeCount)
  console.log("Brand count after:", afterCount)
  console.log("Rollback worked:", beforeCount === afterCount)
}
```

Execute the script:

```bash
npx medusa exec ./src/scripts/test-rollback.ts
```

**Expected**: Brand count unchanged (rollback succeeded).

---

## API Route Verification

### Step 1: Server Start Test

Verify server starts without errors:

```bash
npm run dev
```

**Expected**:
- Server starts successfully
- Console shows "Server is ready on port 9000"
- No route registration errors

### Step 2: Admin Authentication

All `/admin` routes require authentication. First, create an admin user and login to get an authentication token.

**Create admin user** (if not already created):

```bash
npx medusa user -e admin@test.com -p supersecret
```

**Login to get authentication token**:

```bash
curl -X POST http://localhost:9000/auth/user/emailpass \
  -H "Content-Type: application/json" \
  --data-raw '{
    "email": "admin@test.com",
    "password": "supersecret"
  }'
```

**Expected response**:

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Save the token** - you'll need it for all subsequent `/admin` requests:

```bash
# Set token as environment variable for convenience
export AUTH_TOKEN="your-token-here"
```

**Important**: All `/admin` route requests must include the authentication token in the `Authorization: Bearer` header:

```bash
curl -X GET http://localhost:9000/admin/brands \
  -H "Authorization: Bearer $AUTH_TOKEN"
```

### Step 3: Route Accessibility Test

Test route responds to authenticated requests:

```bash
# First, authenticate and get token (see Step 2)
export AUTH_TOKEN="your-token-here"

# Then test the route
curl -X POST http://localhost:9000/admin/brands \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -d '{"name": "Nike"}'
```

**Expected**:
- 200 or 201 status code
- JSON response with brand object
- Brand has id, name, timestamps

**If 404**: Route not registered - check file location and function export name.

**If 401**: Authentication required - see authentication section below.

### Step 3: Validation Test

Test middleware validation works with authenticated requests:

```bash
# Authentication required (see Step 2)
# Send invalid data (missing required field)
curl -X POST http://localhost:9000/admin/brands \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -d '{}'
```

**Expected**:
- 400 status code
- Error message about missing `name` field

### Step 4: Database Verification

Verify data was persisted:

```bash
# After creating a brand via API
psql your_database -c "SELECT * FROM brand WHERE name = 'Nike';"
```

**Expected**: Brand exists in database with correct data.

### Step 5: Error Handling Test

Test error responses with authenticated requests:

```bash
# Authentication required (see Step 2)
# Send malformed JSON
curl -X POST http://localhost:9000/admin/brands \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -d 'invalid json'
```

**Expected**: 400 error with appropriate message.

---

## Module Links Verification

### Step 1: Link Sync Test

Verify link table created:

```bash
# Sync links
npx medusa db:sync-links

# Run migrations
npx medusa db:migrate

# Check link table exists
psql your_database -c "\dt" | grep link
```

**Expected**: Link table exists (e.g., `link_brand_product`).

### Step 2: Link Structure Test

Verify link table structure:

```bash
psql your_database -c "\d link_brand_product"
```

**Expected columns**:
- id (primary key)
- brand_id (foreign key)
- product_id (foreign key)
- created_at
- updated_at
- deleted_at

### Step 3: Link Creation Test

Test creating a link:

```typescript
import { Modules } from "@medusajs/framework/utils"

async function testLinkCreation() {
  const link = container.resolve(ContainerRegistrationKeys.LINK)

  await link.create({
    [Modules.BRAND]: { brand_id: "brand_123" },
    [Modules.PRODUCT]: { product_id: "prod_456" },
  })

  console.log("Link created successfully")
}
```

**Expected**: Link created without errors.

### Step 4: Query Linked Data Test

Test querying linked records (requires authentication):

```bash
# Authentication required (see API Route Verification Step 2)
curl "http://localhost:9000/admin/brands?fields=id,name,products.*" \
  -H "Authorization: Bearer $AUTH_TOKEN"
```

**Expected**: Brands include products array with product details.

---

## Workflow Hooks Verification

### Step 1: Hook Registration Test

Verify hook doesn't cause errors:

```bash
npm run dev
```

**Expected**:
- Server starts without errors
- No warnings about invalid hook subscribers
- Logs show hook file loaded

### Step 2: Hook Execution Test

Test hook runs when core workflow executes (requires authentication):

```bash
# Authentication required (see API Route Verification Step 2)
# Create product with brand_id in additional_data
curl -X POST http://localhost:9000/admin/products \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -d '{
    "title": "Air Max 90",
    "additional_data": {
      "brand_id": "brand_123"
    }
  }'
```

**Expected**:
- Product created successfully
- Link created between product and brand

### Step 3: Link Verification Test

Verify link was created by hook (requires authentication):

```bash
# Authentication required (see API Route Verification Step 2)
# Query brand with products
curl "http://localhost:9000/admin/brands?fields=id,name,products.*" \
  -H "Authorization: Bearer $AUTH_TOKEN"
```

**Expected**: Brand shows the newly created product in products array.

### Step 4: Hook Rollback Test

Test hook compensation works:

```typescript
// Temporarily modify the workflow to fail after products are created
// The hook should create the link, then roll it back when workflow fails

async function testHookRollback() {
  const linkService = container.resolve(ContainerRegistrationKeys.LINK)

  // Count links before
  const linksBefore = await linkService.list({})

  try {
    // This should fail and trigger rollback
    await createProductsWorkflow(container).run({
      input: {
        products: [{ title: "Test", additional_data: { brand_id: "brand_123" } }]
      }
    })
  } catch (error) {
    console.log("Expected error:", error.message)
  }

  // Count links after
  const linksAfter = await linkService.list({})

  console.log("Links before:", linksBefore.length)
  console.log("Links after:", linksAfter.length)
  console.log("Rollback worked:", linksBefore.length === linksAfter.length)
}
```

**Expected**: Link count unchanged (hook compensation ran).

---

## Query Verification

All query tests require authentication (see API Route Verification Step 2).

### Step 1: Basic Query Test

Test Query.graph() retrieves data:

```bash
# Authentication required
curl "http://localhost:9000/admin/brands" \
  -H "Authorization: Bearer $AUTH_TOKEN"
```

**Expected**:
- Returns brands array
- Includes count, limit, offset metadata

### Step 2: Fields Parameter Test

Test field selection:

```bash
# Authentication required
curl "http://localhost:9000/admin/brands?fields=id,name" \
  -H "Authorization: Bearer $AUTH_TOKEN"
```

**Expected**: Brands include only id and name fields.

### Step 3: Pagination Test

Test pagination works correctly:

```bash
# Authentication required
# Page 1
curl "http://localhost:9000/admin/brands?limit=2&offset=0" \
  -H "Authorization: Bearer $AUTH_TOKEN"

# Page 2
curl "http://localhost:9000/admin/brands?limit=2&offset=2" \
  -H "Authorization: Bearer $AUTH_TOKEN"
```

**Expected**: Different brands on each page, correct metadata.

### Step 4: Relations Test

Test including related data:

```bash
# Authentication required
curl "http://localhost:9000/admin/brands?fields=id,name,products.*" \
  -H "Authorization: Bearer $AUTH_TOKEN"
```

**Expected**: Each brand includes full products array with product details.

---

## Admin Widget Verification

### Step 1: Widget Visibility Test

**Manual test in browser**:

1. Open admin: http://localhost:9000/app
2. Login with admin credentials
3. Navigate to Products
4. Click on a product with a brand
5. Look for your widget

**Expected**: Widget appears somewhere in the specified zone's section (e.g., the main section for `product.details`). Its exact position is set by the admin user in the Editor view, so don't treat "not at the top" as a failure.

### Step 2: Widget Data Test

**In browser DevTools**:

1. Open Network tab
2. Navigate to product page
3. Look for API request fetching product data

**Expected**:
- Request includes `fields` parameter with `+brand.*`
- Response includes brand data
- Widget displays brand name correctly

### Step 3: Widget Loading State Test

**In browser with throttled connection**:

1. Open DevTools → Network tab
2. Throttle to "Slow 3G"
3. Navigate to product page
4. Observe widget

**Expected**:
- Widget shows loading state initially
- Then displays brand data
- No errors in console

### Step 4: Widget Error Handling Test

**Temporarily modify widget to force error**:

```typescript
const { data, error } = useQuery({
  queryFn: () => { throw new Error("Test error") },
  queryKey: ["test-error"],
})

if (error) return <div>Error: {error.message}</div>
```

**Expected**: Widget gracefully shows error state.

---

## Admin UI Route Verification

### Step 1: Route Accessibility Test

**Manual test in browser**:

1. Open admin: http://localhost:9000/app
2. Look for route in sidebar navigation

**Expected**:
- Route appears in sidebar with correct icon and label
- Clicking navigates to route

### Step 2: Navigation Test

**Manual test**:

1. Click route in sidebar
2. Check URL changes to `/app/brands`
3. Check page loads without errors

**Expected**:
- URL updates correctly
- Page renders successfully
- No console errors

### Step 3: DataTable Test

**Manual test on route page**:

1. Navigate to route
2. Observe table

**Expected**:
- Table displays with correct columns
- Data loads and populates rows
- Styling matches other admin pages
- No console errors

### Step 4: Pagination Test

**Manual test (requires 15+ records)**:

1. Navigate to route
2. Look at pagination controls
3. Click "Next" page

**Expected**:
- Pagination controls appear at bottom
- Clicking changes page
- Different data displays
- Correct page indicator

### Step 5: Network Test

**In browser DevTools**:

1. Open Network tab
2. Navigate to route
3. Look for API request

**Expected**:
- Request to `/admin/brands` with query params (limit, offset)
- Response includes data, count, limit, offset
- Table populated with response data

---

## Authentication Reference

All `/admin` routes require authentication. See **API Route Verification → Step 2: Admin Authentication** for complete authentication setup instructions.

**Quick reference**:

1. Create admin user:
   ```bash
   npx medusa user -e admin@test.com -p supersecret
   ```

2. Get authentication token:
   ```bash
   curl -X POST http://localhost:9000/auth/user/emailpass \
     -H "Content-Type: application/json" \
     --data-raw '{
       "email": "admin@test.com",
       "password": "supersecret"
     }'
   ```

3. Use token in requests:
   ```bash
   export AUTH_TOKEN="your-token-here"
   curl http://localhost:9000/admin/brands \
     -H "Authorization: Bearer $AUTH_TOKEN"
   ```

---

## Summary

**Systematic verification approach**:

1. **Build test**: Ensure code compiles
2. **API test**: Test via HTTP endpoints
3. **UI test**: Test in browser
4. **Database test**: Verify persistence
5. **End-to-end test**: Test complete flows

**Tools used**:
- `npm run build` - Compilation verification
- `npx medusa db:migrate` - Database setup
- `curl` - API testing
- Browser DevTools - UI testing
- `psql` - Database inspection
- `jq` - JSON parsing

**Key principle**: Test each layer independently before testing integration. This isolates problems and makes debugging easier.

**Common verification workflow**:
1. Write code
2. Run build test
3. Test in UI (manual test)
4. Verify in database
5. Test edge cases and errors

**Remember**: A systematic testing approach catches issues early and gives confidence your implementation works correctly.
