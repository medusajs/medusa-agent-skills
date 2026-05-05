# Environments and Variables

## Managing Environments

### Create a Preview Environment

```bash
mcloud environments create \
  --name "Staging" \
  --branch develop
```

### Inspect an Environment

```bash
mcloud environments get staging --json | jq '{id, name, type, status, external_id}'
```

### Delete an Environment

```bash
mcloud environments delete env_123 --yes
```

> **CRITICAL:** Production environments are protected — `delete` returns a non-zero exit code. Always check the `type` field via `environments get --json` before attempting a delete in automation.

## Managing Environment Variables

Variables are scoped to a single environment.

### List Variables

```bash
mcloud variables list --json
```

### Get a Variable

```bash
# By key (requires active project and environment)
mcloud variables get DATABASE_URL --json

# By ID (works without project/environment context)
mcloud variables get var_01XYZ --json
```

### Reveal Secret Values

> **CRITICAL:** Only pass `--reveal` when the user explicitly asks. Plaintext values appear in terminal scrollback, log aggregators, and process listings.

```bash
mcloud variables get STRIPE_SECRET_KEY --reveal --json | jq -r '.value'
```

### Export to .env

Replicate a Cloud environment's variables locally:

```bash
mcloud variables list --reveal --json \
  | jq -r '.[] | "\(.key)=\(.value)"' \
  > .env
```
