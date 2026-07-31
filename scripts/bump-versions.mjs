#!/usr/bin/env node
/**
 * Bumps the patch version of every plugin whose content changed, plus the
 * marketplace version, so a published skill edit is actually picked up by
 * installs.
 *
 * Input  (stdin): the changed paths, one per line, as produced by
 *                 `git status --porcelain -- plugins | cut -c4-`.
 * Output (--output <file>, optional): a markdown list of the bumps, for the
 *                 pull request body.
 *
 * Only `plugins/<name>/...` paths count. A run where no plugin content changed
 * bumps nothing, including the marketplace.
 */

import { readFileSync, writeFileSync, existsSync, appendFileSync } from "node:fs"

const MARKETPLACE = ".claude-plugin/marketplace.json"

function arg(name) {
  const i = process.argv.indexOf(name)
  return i === -1 ? null : process.argv[i + 1]
}

/** Bumps the patch component of a strict X.Y.Z version. */
function bumpPatch(version, label) {
  const match = /^(\d+)\.(\d+)\.(\d+)$/.exec(String(version || "").trim())
  if (!match) {
    console.error(
      `::error::${label} has version "${version}", which is not a plain X.Y.Z. Refusing to guess how to bump it.`
    )
    process.exit(1)
  }
  const [, major, minor, patch] = match
  return `${major}.${minor}.${Number(patch) + 1}`
}

/**
 * Rewrites a single `"version": "..."` value in place, leaving the rest of the
 * file byte-for-byte alone. Reserializing with JSON.stringify would reformat
 * files that are hand-maintained.
 */
function writeVersion(path, from, to) {
  const original = readFileSync(path, "utf8")
  const pattern = new RegExp(`("version"\\s*:\\s*)"${from.replace(/\./g, "\\.")}"`)
  if (!pattern.test(original)) {
    console.error(`::error::could not locate the version string in ${path}`)
    process.exit(1)
  }
  writeFileSync(path, original.replace(pattern, `$1"${to}"`))
}

function main() {
  const outputPath = arg("--output")

  const changed = readFileSync(0, "utf8")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)

  // plugins/<name>/... -- anything else is not publishable plugin content.
  const affected = new Set()
  for (const path of changed) {
    const match = /^plugins\/([^/]+)\//.exec(path)
    if (match) affected.add(match[1])
  }

  if (affected.size === 0) {
    console.error("no plugin content changed, nothing to bump")
    if (outputPath) writeFileSync(outputPath, "")
    return
  }

  const bumps = []

  for (const plugin of [...affected].sort()) {
    const manifest = `plugins/${plugin}/.claude-plugin/plugin.json`
    if (!existsSync(manifest)) {
      console.error(`::error::${plugin} has changed content but no ${manifest}`)
      process.exit(1)
    }
    const current = JSON.parse(readFileSync(manifest, "utf8")).version
    const next = bumpPatch(current, manifest)
    writeVersion(manifest, current, next)
    bumps.push({ name: plugin, path: manifest, from: current, to: next })
  }

  // The marketplace version gates the whole catalogue, so it moves whenever any
  // plugin in it does.
  if (!existsSync(MARKETPLACE)) {
    console.error(`::error::${MARKETPLACE} is missing`)
    process.exit(1)
  }
  const marketplaceCurrent = JSON.parse(readFileSync(MARKETPLACE, "utf8"))
    .metadata.version
  const marketplaceNext = bumpPatch(marketplaceCurrent, MARKETPLACE)
  writeVersion(MARKETPLACE, marketplaceCurrent, marketplaceNext)
  bumps.push({
    name: "marketplace",
    path: MARKETPLACE,
    from: marketplaceCurrent,
    to: marketplaceNext,
  })

  for (const b of bumps) {
    console.error(`bumped ${b.name}: ${b.from} -> ${b.to}`)
  }

  if (outputPath) {
    const lines = [
      "### Versions bumped",
      "",
      ...bumps.map((b) => `- \`${b.path}\` - ${b.from} to ${b.to}`),
      "",
    ]
    writeFileSync(outputPath, lines.join("\n"))
  }

  if (process.env.GITHUB_OUTPUT) {
    appendFileSync(
      process.env.GITHUB_OUTPUT,
      `bumped=${bumps.map((b) => `${b.name}@${b.to}`).join(" ")}\n`
    )
  }
}

main()
