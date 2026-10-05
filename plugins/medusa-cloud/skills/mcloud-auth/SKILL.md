---
name: mcloud-auth
description: "Execute mcloud authentication and context commands: login, logout, whoami, use, version, and signup. Use when setting up the CLI, switching accounts, verifying auth state, setting the active org/project/environment context, or checking the CLI version."
allowed-tools: Bash(mcloud whoami*), Bash(mcloud use*), Bash(mcloud version*), Bash(mcloud logout*), Bash(jq*)
---

# Cloud CLI: Auth and Context Commands

Execute authentication and context commands for the Medusa Cloud CLI.

## Constraints

- `mcloud login`, `mcloud signup`, and `mcloud use` (without flags) require a **TTY** — they fail in CI, Docker, or piped input. Use `MCLOUD_TOKEN` or pass flags explicitly instead.
- When `MCLOUD_TOKEN` is set, file-based credentials are ignored and `mcloud login` is rejected. Unset it to switch accounts.
- Always verify auth before any state-changing command: `mcloud whoami --json | jq -e '.auth.kind != "none"'`

## Commands

### whoami

Show authenticated user, auth method, and active context (organization, project, environment).

```bash
mcloud whoami --json
```

**Options:**
- `--json` — Output as JSON

**Use to verify auth and scope:**
```bash
mcloud whoami --json | jq -e '.auth.kind != "none" and .organization.id != null'
```
Exit code `0` = authenticated and scoped. Non-zero = stop and prompt the user.

### use

Set the active organization, project, and/or environment so subsequent commands skip those flags.

```bash
mcloud use \
  --organization <org-id> \
  --project <project-id-or-handle> \
  --environment <environment-handle>
```

**CRITICAL:** `mcloud use` without flags is interactive and fails in CI/Docker/piped input. Always pass flags explicitly.

**Options:**
- `-o/--organization <id>` — Set active organization
- `-p/--project <id-or-handle>` — Set active project
- `-e/--environment <handle>` — Set active environment
- `--clear` — Clear all active context
- `--json` — Output as JSON

**Clear context:**
```bash
mcloud use --clear
```

### version

Print CLI version and platform metadata.

```bash
mcloud version --json
```

**Options:**
- `--json` — Output as JSON

### login

Authenticate with Medusa Cloud. Opens a browser to complete auth.

> **TTY required.** Cannot be run in CI, Docker, or non-interactive environments. Use `MCLOUD_TOKEN` instead for non-interactive auth.

```bash
mcloud login
```

**Non-interactive alternative:**
```bash
export MCLOUD_TOKEN=<access-key>
```

**Options:**
- `-t/--token <token>` — Authenticate using an access key without browser (non-interactive)
- `--json` — Output as JSON

### logout

Remove stored credentials.

```bash
mcloud logout --json
```

**Options:**
- `--json` — Output as JSON

### signup

Create a new Medusa Cloud account. Opens a browser.

> **TTY required.** Cannot be run in non-interactive environments.

```bash
mcloud signup
```

## Auth Methods

| Method | When to use |
|--------|-------------|
| `mcloud login` (browser) | Interactive setup; requires TTY |
| `mcloud login --token <key>` | Non-interactive login with access key |
| `MCLOUD_TOKEN=<key>` env var | CI/CD, Docker, scripted environments |

## Examples

```bash
# Check authentication and active context
mcloud whoami --json

# Verify auth before running commands
mcloud whoami --json | jq -e '.auth.kind != "none" and .organization.id != null'

# Set full context (org + project + environment)
mcloud use \
  --organization org_123 \
  --project my-store \
  --environment production

# Set context by resolving names
ORGANIZATION_ID=$(mcloud organizations list --json | jq -r '.[] | select(.name == "My Org") | .id')
PROJECT_HANDLE=$(mcloud projects list --organization "$ORGANIZATION_ID" --json | jq -r '.[] | select(.name == "My Store") | .handle')
ENVIRONMENT_HANDLE=$(mcloud environments list --organization "$ORGANIZATION_ID" --project "$PROJECT_HANDLE" --json | jq -r '.[] | select(.name == "Production") | .handle')

mcloud use \
  --organization "$ORGANIZATION_ID" \
  --project "$PROJECT_HANDLE" \
  --environment "$ENVIRONMENT_HANDLE"

# Clear context
mcloud use --clear

# Check CLI version
mcloud version --json

# Non-interactive login with token
mcloud login --token <access-key>

# Logout
mcloud logout
```
