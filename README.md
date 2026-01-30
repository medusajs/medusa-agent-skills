# Medusa Agent Skills

A collection of skills composed as Claude Code plugins for building Medusa applications with best practices and architectural patterns.

These skills can be used with any agent, as explained in the [Usage with Other Agents](#usage-with-other-agents) section.

- [Available Plugins](#available-plugins)
- [Installation](#installation)
- [Usage](#usage)
- [Usage with Other Agents](#usage-with-other-agents)
- [Privacy](#privacy)

## Available Plugins

| Plugin | Description |
|--------|-------------|
| [medusa-dev](plugins/medusa-dev/README.md) | Comprehensive skills for building Medusa applications across backend, admin UI, and storefronts. |
| [learn-medusa](plugins/learn-medusa/README.md) | Interactive tutorial session to learn about Medusa concepts through building a brands feature. |
| [ecommerce-storefront](plugins/ecommerce-storefront/README.md) | Comprehensive skill for building high-converting ecommerce storefronts with best practices. |

## Installation for Claude Code

1. Start Claude:

```bash
claude
```

2. Add the Medusa marketplace to Claude Code:

```bash
/plugin marketplace add medusajs/medusa-agent-skills
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

## Usage with Other Agents

### Installation with `skills`

The `skills` command allows you to copy skills from a repository to the directory relevant for your agent. Use this command when you only want to copy skills, as you can't copy the MCP server with this command.

```bash
yarn skills add medusajs/medusa-agent-skills
```

### Manual Installation

Alternatively, you can copy the assets necessary, including skills and MCP servers, to the directory relevant to your agent.

For example, if you're using Cursor and you want to use the [medusa-dev plugin](./plugins/medusa-dev/README.md), you can:

1. Copy the skills directories to the .cursor/skills directory of your Medusa project.
2. Add the MCP server configuration to the .cursor/mcp.json file of your Medusa project.

## Usage

These plugins will help you with your Medusa development. Refer to each plugin for more details on usage.

## Privacy

The Medusa plugins do not collect, store, or transmit any user data or conversation information. All instructional content is provided locally through skill files, and MCP servers only query public Medusa documentation.
