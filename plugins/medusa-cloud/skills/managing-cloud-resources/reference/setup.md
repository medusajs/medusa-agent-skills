# CLI Setup and Authentication

One-time setup for the Medusa Cloud CLI. Skip steps whose checks already pass.

## 1. Check if CLI is Installed

```bash
mcloud --version
```

If this exits `0` and prints a version, skip to [Confirm Authentication](#4-confirm-authentication).

## 2. Verify Node.js Version

The CLI requires Node.js v22+:

```bash
node --version
```

If below `v22`, ask the user to upgrade (via nvm or the official installer). Do not upgrade without authorization.

## 3. Install the CLI

```bash
npm install -g @medusajs/mcloud
```

Verify:

```bash
mcloud --version
```

If not found, ask the user to check their global npm bin directory is on `PATH`.

## 4. Confirm Authentication

Ask the user if they have a Medusa Cloud account.

**Has account:**

```bash
mcloud login
```

Opens a browser to complete auth.

**No account:**

```bash
mcloud signup
mcloud login
```

**Non-interactive environments (CI, Docker, headless):**

```bash
export MCLOUD_TOKEN=<access-key>
```

When `MCLOUD_TOKEN` is set, the CLI uses it on every command and `mcloud login` is rejected.

## 5. Verify Setup

```bash
mcloud whoami --json
```

Check auth and scope:

```bash
mcloud whoami --json | jq -e '.auth.kind != "none" and .organization.id != null'
```

## Setting the Active Context

Persist org, project, and environment so subsequent commands skip `--organization`, `--project`, `--environment` flags:

```bash
mcloud use \
  --organization org_123 \
  --project proj_123 \
  --environment production
```

### Resolving Names to IDs

If you only have names:

```bash
# Resolve organization ID by name
ORGANIZATION_ID=$(
  mcloud organizations list --json \
    | jq -r '.[] | select(.name == "My Organization") | .id'
)

# Resolve project handle by name
PROJECT_HANDLE=$(
  mcloud projects list --organization "$ORGANIZATION_ID" --json \
    | jq -r '.[] | select(.name == "My Store") | .handle'
)

# Resolve environment handle by name
ENVIRONMENT_HANDLE=$(
  mcloud environments list --organization "$ORGANIZATION_ID" --project "$PROJECT_HANDLE" --json \
    | jq -r '.[] | select(.name == "Production") | .handle'
)

mcloud use \
  --organization "$ORGANIZATION_ID" \
  --project "$PROJECT_HANDLE" \
  --environment "$ENVIRONMENT_HANDLE"
```

### Clearing Context

```bash
mcloud use --clear
```
