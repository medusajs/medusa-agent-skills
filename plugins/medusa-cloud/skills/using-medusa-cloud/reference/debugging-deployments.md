# Debugging Deployments

## Inspecting Deployments

Status fields per deployment: `backend_status` and `storefront_status`.

Values: `created`, `building`, `built`, `deploying`, `deployed`, `build-failed`, `deployment-failed`, `timed-out` (backend only), `canceled`, `idle`.

```bash
# Most recent failed deployment
mcloud deployments list --json \
  | jq -r '[.[] | select(.backend_status == "build-failed" or .backend_status == "deployment-failed")][0].id'

# Deployments for a specific commit
mcloud deployments list --commit a1b2c3d --json | jq '.'

# Only preview deployments
mcloud deployments list --environment-type preview --json | jq '.'

# Single deployment details
mcloud deployments get bld_01ABC123 --json
```

## Build Failure Recipe

Use when `backend_status == "build-failed"`:

```bash
# Find the most recent build-failed deployment
DEPLOYMENT_ID=$(
  mcloud deployments list --json \
    | jq -r '[.[] | select(.backend_status == "build-failed")][0].id'
)

# Inspect deployment metadata
mcloud deployments get "$DEPLOYMENT_ID" --json

# Read the build output
mcloud deployments build-logs "$DEPLOYMENT_ID"

# For storefront build failures
mcloud deployments build-logs "$DEPLOYMENT_ID" --type storefront
```

`build-logs` returns a `build_status` field. When `failed`, check `metadata.failed_docker_layer` via `mcloud deployments get --json` to identify the failing layer.

## Deployment Failure Recipe

Use when `backend_status == "deployment-failed"` (build succeeded, runtime crashed):

```bash
# Find the most recent deployment-failed
DEPLOYMENT_ID=$(
  mcloud deployments list --json \
    | jq -r '[.[] | select(.backend_status == "deployment-failed")][0].id'
)

# Runtime logs for that deployment
mcloud logs --deployment "$DEPLOYMENT_ID" --limit 1000

# Error-level lines only
mcloud logs --deployment "$DEPLOYMENT_ID" --search error --limit 1000

# Filter by HTTP status
mcloud logs --deployment "$DEPLOYMENT_ID" --metadata status=500 --limit 1000

# Structured analysis
mcloud logs --deployment "$DEPLOYMENT_ID" --json | jq '.[] | {timestamp, source, message}'
```

> **Note:** `--follow` cannot be combined with `--json`. Use bounded time windows with `--from`/`--to` and `--json` for scripts.

## Rerunning a Deployment

Two options — not interchangeable:

**Redeploy (environment-side fix):** Re-runs the active deployment's existing build. Use when the fix is a variable change or infra issue.

```bash
mcloud environments redeploy env_123
```

Requires the environment to have an active deployment. If it doesn't, use `trigger-build` first.

**Trigger build (source code fix):** Starts a new build from the tracked branch. Use when the fix is in committed code.

```bash
mcloud environments trigger-build env_123
```

**Verify the new build:**

```bash
mcloud deployments list --environment env_123 --limit 5 --json \
  | jq '.[] | {id, backend_status, commit_hash, updated_at}'
```
