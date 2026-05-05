# Medusa Cloud Plugin

Skills for managing Medusa Cloud resources through the Cloud CLI (`mcloud`). Covers setup, deployments, debugging, environment management, and variables.

> For installation and usage with other agents, refer to the [main README](../../README.md).

## Installation with Claude Code

### Prerequisites

- [Claude Code](https://github.com/anthropics/claude-code) installed
- A Medusa Cloud account (or planning to create one)

### Install Plugin

1. Start Claude:

```bash
claude
```

2. Add Medusa marketplace to Claude Code:

```bash
/plugin marketplace add medusajs/medusa-agent-skills
```

3. Install the plugin:

```bash
/plugin install medusa-cloud@medusa
```

4. Verify the plugin is loaded:

```bash
/plugin
```

## Skills Included

1. **using-medusa-cloud** - Cloud CLI operations (setup, deployments, debugging, environments, variables)

## Privacy

This plugin does not collect, store, or transmit any user data or conversation information. All instructional content is provided locally through skill files.
