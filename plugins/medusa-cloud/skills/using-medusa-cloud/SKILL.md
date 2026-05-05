---
name: using-medusa-cloud
description: Manages Medusa Cloud resources through the Cloud CLI (mcloud). Use when deploying, debugging deployments, managing environments, environment variables, or any Medusa Cloud operation. CRITICAL for mcloud commands, deployment failures, build logs, Cloud setup, and CI/CD workflows.
---

# Managing Medusa Cloud Resources

Operational guide for AI agents managing Medusa Cloud infrastructure through the `mcloud` CLI. Covers setup, deployments, debugging, environments, and variables.

## Constraints

- **Always pass `--json`** when parsing CLI output. Plaintext output is for humans and may change without warning.
- **Confirm context before mutating.** Run `mcloud whoami --json` before any state change.
- **Read before you write.** Run a `get` or `list` before any `delete`, `redeploy`, or `trigger-build`.
- **Use `--yes` for destructive operations.** `delete` commands require `--yes` in non-interactive mode.
- **Production environments cannot be deleted.** `mcloud environments delete` errors on production by design.
- **Never pass `--reveal` unless the user explicitly asks.** Secret values appear in terminal scrollback and logs.
- **`--json` and `--follow` are incompatible.** Use bounded time windows (`--from`/`--to`) with `--json` for programmatic log ingestion.

## CRITICAL: Load Reference Files When Needed

**Load these references based on what you're doing:**

- **Setting up the CLI?** → MUST load `setup.md` first
- **Debugging a failed deployment?** → MUST load `debugging-deployments.md` first
- **Managing environments or variables?** → MUST load `environments-and-variables.md` first

**Minimum requirement:** Load at least one reference file before executing multi-step workflows.

## Quick Reference

### Authentication Check

Always verify auth and scope before mutating state:

```bash
mcloud whoami --json | jq -e '.auth.kind != "none" and .organization.id != null'
```

Exit code `0` = authenticated and scoped. Non-zero = stop and ask the user.

### Set Context Once

```bash
mcloud use \
  --organization org_123 \
  --project proj_123 \
  --environment production
```

> **CRITICAL:** `mcloud use` without flags is interactive and fails in CI/Docker/piped input. Always pass flags.

### Deployment Status Routing

Route on `backend_status` (or `storefront_status`):

| Status | Meaning | Logs to check |
|--------|---------|---------------|
| `build-failed` | Build step failed | `mcloud deployments build-logs <id>` |
| `deployment-failed` | Runtime crashed after build | `mcloud logs --deployment <id>` |
| `timed-out` | Exceeded time budget | Both: build-logs first, then runtime logs |

### Redeployment Decision

| Command | When to use |
|---------|-------------|
| `mcloud environments redeploy <env>` | Fix is environment-side (variable change, infra) — reruns existing build |
| `mcloud environments trigger-build <env>` | Fix is in source code on the tracked branch — starts new build |

## Common Pitfalls

- **TTY-only commands.** `mcloud login`, `mcloud use` (without flags), and `delete` without `--yes` require a TTY. They fail in CI, Docker, or piped input.
- **`MCLOUD_TOKEN` precedence.** When set, file-based credentials are ignored and `mcloud login` is rejected. Unset it to switch accounts.
- **Personal vs org access keys.** Personal keys require `--organization`; org keys are pre-scoped.
- **`organizations list` requires personal auth.** Org access keys return 401 on this command.
- **Build IDs vs deployment IDs.** `depl_*` = deployment ID; anything else = build ID (resolved to latest deployment). `mcloud logs --deployment` accepts both; other commands take build IDs only.

## Reference Files

```
setup.md                       - CLI installation, authentication, context setup
debugging-deployments.md       - Build/deployment failure recipes and log analysis
environments-and-variables.md  - Environment lifecycle and variable management
```
