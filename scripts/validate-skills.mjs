#!/usr/bin/env node
/**
 * Integrity checks for the plugin/skill content in this repository.
 *
 * This repository has no package.json, so there is no lint/build/test command
 * to run. These checks stand in for one: they catch the ways an automated edit
 * can break a skill (malformed frontmatter, renamed skill, dead relative link,
 * invalid plugin manifest) before a pull request is opened.
 *
 * Usage: node scripts/validate-skills.mjs
 * Exits non-zero and prints one line per problem when anything fails.
 */

import { readFileSync, readdirSync, statSync, existsSync } from "node:fs"
import { join, dirname, resolve, relative } from "node:path"

const ROOT = resolve(new URL("..", import.meta.url).pathname)
const problems = []

function walk(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    if (entry === "node_modules" || entry === ".git") continue
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) walk(full, out)
    else out.push(full)
  }
  return out
}

const allFiles = walk(ROOT)
const rel = (p) => relative(ROOT, p)

// 1. Every JSON file must parse.
for (const file of allFiles.filter((f) => f.endsWith(".json"))) {
  try {
    JSON.parse(readFileSync(file, "utf8"))
  } catch (err) {
    problems.push(`${rel(file)}: invalid JSON -- ${err.message}`)
  }
}

// 2. Every plugin listed in the marketplace must exist and have a manifest.
const marketplacePath = join(ROOT, ".claude-plugin", "marketplace.json")
if (existsSync(marketplacePath)) {
  try {
    const marketplace = JSON.parse(readFileSync(marketplacePath, "utf8"))
    for (const plugin of marketplace.plugins || []) {
      const source = join(ROOT, plugin.source)
      if (!existsSync(source)) {
        problems.push(
          `.claude-plugin/marketplace.json: plugin source does not exist -- ${plugin.source}`
        )
        continue
      }
      const manifest = join(source, ".claude-plugin", "plugin.json")
      if (!existsSync(manifest)) {
        problems.push(`${plugin.source}: missing .claude-plugin/plugin.json`)
      }
    }
  } catch {
    // already reported by the JSON check above
  }
}

// 3. Every SKILL.md must have frontmatter with a slug `name` and a
//    `description`, and no two skills may share a name (Claude Code resolves
//    skills by the frontmatter name, not by directory).
const seenNames = new Map()
const skillFiles = allFiles.filter((f) => f.endsWith("/SKILL.md"))
if (skillFiles.length === 0) {
  problems.push("no SKILL.md files found -- did the edit remove them all?")
}
for (const file of skillFiles) {
  const content = readFileSync(file, "utf8")
  if (!content.startsWith("---\n")) {
    problems.push(`${rel(file)}: missing YAML frontmatter`)
    continue
  }
  const end = content.indexOf("\n---", 4)
  if (end === -1) {
    problems.push(`${rel(file)}: frontmatter is not terminated by ---`)
    continue
  }
  const frontmatter = content.slice(4, end)
  const name = frontmatter.match(/^name:\s*(.+)$/m)?.[1]?.trim()
  const description = frontmatter.match(/^description:\s*(.+)$/m)?.[1]?.trim()

  if (!name) problems.push(`${rel(file)}: frontmatter has no "name"`)
  if (!description)
    problems.push(`${rel(file)}: frontmatter has no "description"`)

  if (name && !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(name)) {
    problems.push(
      `${rel(file)}: frontmatter name "${name}" is not a lowercase kebab-case slug`
    )
  }
  if (name && seenNames.has(name)) {
    problems.push(
      `${rel(file)}: duplicate skill name "${name}", also used by ${seenNames.get(name)}`
    )
  } else if (name) {
    seenNames.set(name, rel(file))
  }
}

// 4. Relative markdown links between skill files must resolve.
const LINK_RE = /\[[^\]]*\]\(([^)\s]+)\)/g
for (const file of allFiles.filter((f) => f.endsWith(".md"))) {
  const content = readFileSync(file, "utf8")
  for (const match of content.matchAll(LINK_RE)) {
    const target = match[1]
    if (/^(https?:|mailto:|#)/.test(target)) continue
    const path = target.split("#")[0]
    if (!path) continue
    if (!existsSync(resolve(dirname(file), path))) {
      problems.push(`${rel(file)}: broken relative link -- ${target}`)
    }
  }
}

if (problems.length > 0) {
  console.error(`validate-skills: ${problems.length} problem(s) found`)
  for (const p of problems) console.error(`  ${p}`)
  process.exit(1)
}

console.log(
  `validate-skills: OK (${skillFiles.length} skills, ${allFiles.filter((f) => f.endsWith(".md")).length} markdown files)`
)
