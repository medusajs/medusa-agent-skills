---
name: creating-internal-agents
description: "Use when building an internal admin-facing AI agent in a Medusa project. These agents are operated by merchants and store operators — not customers. Covers data models, module service, agent runtime (tools, system prompt, streamText), streaming API routes (NDJSON), and admin UI chat extensions. Load for any internal agent type: store operations assistant, product audit, cohort analysis, customer service tooling for support staff, etc. Do NOT use for customer-facing agents (storefront chatbots, buyer-side assistants)."
---

# Creating Agents in Medusa

This skill covers the full stack for adding an **internal, admin-facing** AI agent to a Medusa project. These agents are used by merchants and store operators through the Medusa admin dashboard — not by customers on a storefront. For customer-facing agents (e.g. a storefront chatbot), a different architecture is needed: public API routes, no MedusaExec, and storefront auth.

## Constraints

- **Internal use only** — this architecture is for admin users (merchants, operators, support staff), not customers. Routes live under `src/api/admin/`, the UI lives in the Medusa admin dashboard, and access is gated by admin authentication throughout.
- **Authentication is non-negotiable** — MedusaExec runs arbitrary TypeScript with full database access. All agent routes must use `AuthenticatedMedusaRequest` and live under `src/api/admin/`. An unauthenticated endpoint is a remote code execution vulnerability.
- **Use MedusaExec, not custom tools** — for any data operation, the agent writes TypeScript and executes it via MedusaExec. Only build a custom tool for capabilities that cannot be expressed as executable TypeScript (e.g. calling an external API with a secret key).
- **One shared module, multiple agents** — `AgentSession` and `AgentMessage` are shared infrastructure. Use `agent_type` to distinguish sessions per agent. Never create separate models per agent.
- **Pass `MedusaContainer` via `experimental_context`** — never import services directly in tool files; that causes circular dependencies.
- **Stream format is NDJSON** — `Content-Type: application/x-ndjson`, one JSON object per line followed by `\n`.
- **Run migrations** after adding or changing models (`npx medusa db:generate agent && npx medusa db:migrate`).
- **Tool descriptions live in config**, not inline in `tool()` — the config object overrides them at runtime.

## CRITICAL: Load Reference Files When Needed

**⚠️ The quick reference below is NOT sufficient for implementation.** Load the relevant reference file before writing any code.

| Task | Load this file |
|------|---------------|
| Defining conversation models | `reference/data-models.md` |
| Setting up the module service | `reference/service.md` |
| Configuring tools, prompt, streamText | `reference/agent-setup.md` |
| Building the POST chat endpoint | `reference/api-route.md` |
| Implementing NDJSON streaming | `reference/streaming.md` |
| Building the admin chat UI | `reference/admin-extension.md` |
| Giving the agent code execution capability | `reference/medusa-exec.md` |

**Minimum requirement:** Load at least the reference file matching your current task before writing code.

## Related Skills

Load these alongside this skill when relevant:

- **`building-with-medusa`** — Medusa module patterns, workflows, data model conventions. Load when implementing the module service or custom backend logic.
- **`building-admin-dashboard-customizations`** — Admin UI component patterns, TanStack Query, route registration. Load when building or extending the admin chat UI.

## Architecture Overview

```
src/modules/agent/
  index.ts                ← Module() export + AGENT_MODULE constant
  service.ts              ← MedusaService + Anthropic client + stream(messages, container, config)
  models/
    session.ts            ← AgentSession (shared across all agents, filtered by agent_type)
    message.ts            ← AgentMessage
  agents/index.ts         ← streamText() orchestration
  tools/
    medusa-exec.ts        ← MedusaExec tool (primary tool for all data operations)
    todo-write.ts         ← TodoWrite tool
  config/
    <agent-type>.ts       ← per-agent system prompt + tool descriptions

src/api/admin/agent/<agent-type>/
  route.ts                ← POST (AuthenticatedMedusaRequest, session lifecycle, NDJSON stream)
  sessions/route.ts       ← GET session list (filtered by agent_type)
  sessions/[id]/route.ts  ← GET messages for a session

src/admin/routes/<agent-type>/
  page.tsx                ← React chat UI (admin extension)

src/lib/code-mode/
  executor.ts             ← sandboxed TypeScript executor used by MedusaExec
```

## Common Mistakes

Verify you are NOT doing these:

**Security:**
- [ ] Agent route uses `MedusaRequest` instead of `AuthenticatedMedusaRequest`
- [ ] Agent route placed outside `src/api/admin/`

**Architecture:**
- [ ] Creating separate `AgentSession`/`AgentMessage` models per agent instead of using `agent_type`
- [ ] Importing services directly in tool files instead of resolving from `experimental_context`
- [ ] Building a custom tool for a data operation instead of using MedusaExec

**Streaming:**
- [ ] Missing `res.end()` after the stream loop (response never closes)
- [ ] Missing `Transfer-Encoding: chunked` or `Content-Type: application/x-ndjson` headers
- [ ] Not buffering incomplete lines on the client (JSON parse errors on split packets)

**Module:**
- [ ] Forgetting to register the module in `medusa-config.ts`
- [ ] Forgetting to run migrations after changing models
- [ ] Hardcoding tool descriptions in `tool()` instead of the config object

## Reference Files Available

```
reference/data-models.md       - model.define(), agent_type discriminator, relationships, migrations
reference/service.md           - MedusaService extension, Anthropic init, stream(), module index, config registration
reference/agent-setup.md       - streamText(), MedusaExec tool wiring, system prompt, context passing
reference/api-route.md         - POST route, session lifecycle, message persistence, streaming headers
reference/streaming.md         - NDJSON emission, fullStream iteration, chunk types, client-side parsing
reference/admin-extension.md   - React chat UI, streaming fetch, message rendering, tool call display, session sidebar
reference/medusa-exec.md       - Executor setup, MedusaExec tool, query.graph() patterns, error codes
```

## Testing

Once the agent is implemented, test it end-to-end directly in the admin dashboard:

1. Start the Medusa dev server (`npx medusa develop`)
2. Open the admin dashboard and navigate to the agent's page in the sidebar (the label set in `defineRouteConfig`)
3. Type a simple read-only prompt — e.g. *"How many products are in the store?"* — and submit
4. Verify the response streams in and a new session appears in the sidebar
5. Send a follow-up message in the same session to confirm conversation history is preserved
6. Reload the page, select the session from the sidebar, and confirm the message history is restored from the database

If anything is broken, check:
- Browser network tab — the POST request should return `Content-Type: application/x-ndjson` with chunked lines
- Server logs — `[agent] tool_call` and `[agent] step_finish` lines confirm the agent is running
- Database — `agent_session` and `agent_message` tables should have rows with the correct `agent_type`
