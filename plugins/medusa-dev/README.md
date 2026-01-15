# Medusa Claude Code Plugin

A comprehensive set of skills for Claude Code to help developers build Medusa applications with best practices and architectural patterns.

Use this plugin to build backend and frontend features related to Medusa.

## Installation

### Prerequisites

- [Claude Code](https://github.com/anthropics/claude-code) installed
- A Medusa project (or planning to create one)

### Install Plugin

1. Start Claude:

```bash
claude
```

2. Add Medusa marketplace to Claude Code:

```bash
/plugin marketplace add medusajs/medusa-claude-plugins
```

3. Install the plugin:

```bash
/plugin install medusa-dev@medusa
```

4. Verify the plugin is loaded:

```bash
/plugin
```

You should see the Medusa plugin listed under the Installed tab.

## Use Plugin

In your Medusa application, ask Claude to build features. Claude will know what to load from the Medusa plugin to build your feature.

For example:

> Implement a product reviews feature. Authenticated customers can add reviews. Admin users can view and approve or reject reviews from the dashboard

## Skills Included

1. **building-with-medusa** - Backend development (modules, workflows, API routes)
2. **building-admin-dashboard-customizations** - Admin UI development (widgets, pages, forms)
3. **building-storefronts** - Storefront integration (SDK usage, React Query patterns)

## TODO

- [x] **General skills** - Core skills for backend, admin UI, and storefront development
- [ ] **Learning path skill** - Interactive guide for learning Medusa development from scratch
- [ ] **Commands skill** - Common Medusa CLI commands:
  - `npx medusa db:generate <module-name>` - Generate migrations
  - `npx medusa db:migrate` - Run migrations
  - `npx create-medusa-app` - Create new Medusa project
  - Additional development and deployment commands
