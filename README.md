# Medusa Plugin Marketplace

A collection of Claude Code plugins for building Medusa applications with best practices and architectural patterns.

## Available Plugins

| Plugin | Description |
|--------|-------------|
| [medusa-dev](plugins/medusa-dev/README.md) | Comprehensive skills for building Medusa applications across backend, admin UI, and storefronts. |

## Installation

1. Start Claude:

```bash
claude
```

2. Add the Medusa marketplace to Claude Code:

```bash
/plugin marketplace add medusajs/medusa-claude-plugins
```

3. Install any of the plugins. For example:

```bash
/plugin install medusa-dev@medusa
```

4. Verify the plugin is loaded:

```bash
/plugin
```

You should see the Medusa plugin listed under the Installed tab.

## Usage

These plugins will help you with your Medusa development. Refer to each plugin for more details on usage.

## Usage with Other Agents

The Medusa plugins provide skills that allows all agents to build with Medusa following best practices and conventions. All you need to do is copy the `skill` directory of a plugin into the designated skills directory of your agent.

For example, if you want to use the [medusa-dev plugin](./plugins/medusa-dev/README.md), copy its skills directory into the necessary directory:

1. GitHub Copilot -> supports `.claude/skills` directory.
2. OpenCode -> supports `.opencode/skills` directory.
3. Other agents -> check the agent's documentation.

## Privacy

The Medusa plugins do not collect, store, or transmit any user data or conversation information. All instructional content is provided locally through skill files, and MCP servers only query public Medusa documentation.
