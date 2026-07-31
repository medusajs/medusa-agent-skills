#!/usr/bin/env node
/**
 * Normalizes a `medusa-docs-updated` dispatch payload and the GitHub commit API
 * response into a single changed-files list, attaches each file's patch, and
 * drops paths that are not authored documentation.
 *
 * This does NOT decide whether the commit affects this repository -- that
 * judgement is Claude's. The filtering here is only mechanical: build output,
 * generated reference material, and docs apps whose content no skill restates.
 *
 * Env:
 *   EVENT_NAME    "repository_dispatch" | "workflow_dispatch"
 *   PAYLOAD_JSON  the raw github.event.client_payload as JSON ("" or "null" when absent)
 *
 * Args:
 *   --commit-api <file>  JSON body of GET /repos/medusajs/medusa/commits/<sha>
 *   --output-dir <dir>   where commit.json and changed-files.json are written
 *
 * The sender caps `changed_files` at 100 entries with no truncation flag, so a
 * payload of exactly 100 is treated as truncated and the API response wins.
 */

import { readFileSync, writeFileSync, appendFileSync, mkdirSync } from "node:fs"
import { join } from "node:path"

const PAYLOAD_CAP = 100

/** Total bytes of unified diff handed to Claude. */
const PATCH_BUDGET_BYTES = 250_000

/** Docs apps whose content no skill in this repository restates. */
const IGNORED_APPS = [
  ["www/apps/docs/", "landing and redirect app, no prose"],
  ["www/apps/bloom/", "Bloom framework, not covered by any skill"],
  ["www/apps/user-guide/", "merchant-facing admin guide, not developer content"],
  ["www/apps/api-reference/", "OAS-generated endpoint reference"],
]

/**
 * Generated or tooling paths. `www/apps/resources/references/` is the generated
 * TSDoc source and `www/apps/resources/app/references/` is where it is mounted
 * for the site -- neither is authored prose, and both churn on every release.
 */
const IGNORED_PATTERNS = [
  [/^www\/apps\/resources\/references\//, "generated TSDoc reference source"],
  [/^www\/apps\/resources\/app\/references\//, "generated TSDoc reference pages"],
  [/\/generated\//, "build output"],
  [/\/sidebar\.mjs$/, "generated sidebar"],
  [/\/sidebars\//, "generated sidebar data"],
  [/\/public\//, "static asset"],
  [/^www\/(utils|packages)\//, "docs tooling, not documentation"],
]

const CONTENT_EXTENSIONS = [".mdx", ".md"]

function arg(name) {
  const i = process.argv.indexOf(name)
  return i === -1 ? null : process.argv[i + 1]
}

function normalizeApiStatus(status) {
  switch (status) {
    case "added":
    case "copied":
      return "A"
    case "removed":
      return "D"
    default:
      return "M"
  }
}

/** Flattens the API's file list, expanding renames into a D + an A. */
function filesFromApi(commit) {
  const out = []
  for (const file of commit.files || []) {
    if (file.status === "renamed") {
      if (file.previous_filename) {
        out.push({ status: "D", path: file.previous_filename, patch: null })
      }
      out.push({
        status: "A",
        path: file.filename,
        previous_path: file.previous_filename || null,
        patch: file.patch || null,
      })
      continue
    }
    out.push({
      status: normalizeApiStatus(file.status),
      path: file.filename,
      patch: file.patch || null,
    })
  }
  return out
}

/** Returns a reason string when the path is not authored documentation. */
function ignoreReason(path) {
  if (!path.startsWith("www/apps/")) return "outside www/apps"
  for (const [prefix, reason] of IGNORED_APPS) {
    if (path.startsWith(prefix)) return reason
  }
  for (const [re, reason] of IGNORED_PATTERNS) {
    if (re.test(path)) return reason
  }
  if (!CONTENT_EXTENSIONS.some((ext) => path.endsWith(ext))) {
    return "not an authored content file"
  }
  return null
}

function main() {
  const commitApiPath = arg("--commit-api")
  const outputDir = arg("--output-dir")
  if (!commitApiPath || !outputDir) {
    console.error(
      "usage: resolve-docs-commit.mjs --commit-api <file> --output-dir <dir>"
    )
    process.exit(1)
  }
  mkdirSync(outputDir, { recursive: true })

  const commit = JSON.parse(readFileSync(commitApiPath, "utf8"))
  const apiFiles = filesFromApi(commit)

  let payload = null
  const rawPayload = (process.env.PAYLOAD_JSON || "").trim()
  if (rawPayload && rawPayload !== "null") {
    try {
      payload = JSON.parse(rawPayload)
    } catch (err) {
      console.error(`could not parse client_payload: ${err.message}`)
      process.exit(1)
    }
  }

  const payloadFiles = Array.isArray(payload?.changed_files)
    ? payload.changed_files
    : null

  let files
  let source
  if (!payloadFiles || payloadFiles.length === 0) {
    // workflow_dispatch carries no payload; a dispatch with no files at all is
    // handled by the caller before we get here.
    files = apiFiles
    source = "api (no changed_files in payload)"
  } else if (payloadFiles.length >= PAYLOAD_CAP) {
    files = apiFiles
    source = `api (payload hit the ${PAYLOAD_CAP}-entry cap and is assumed truncated)`
  } else {
    // Trust the payload's list, but take patches and rename info from the API.
    const byPath = new Map(apiFiles.map((f) => [f.path, f]))
    files = payloadFiles.map((f) => {
      const apiEntry = byPath.get(f.path)
      return {
        status: String(f.status || "M").toUpperCase().slice(0, 1),
        path: f.path,
        previous_path: apiEntry?.previous_path || null,
        patch: apiEntry?.patch || null,
      }
    })
    source = "payload (enriched with patches from the commit API)"
  }

  const considered = []
  const ignored = []
  for (const file of files) {
    if (!file.path) continue
    const reason = ignoreReason(file.path)
    if (reason) {
      ignored.push({ status: file.status, path: file.path, reason })
    } else {
      considered.push({
        status: file.status,
        path: file.path,
        previous_path: file.previous_path || null,
        patch: file.patch || null,
      })
    }
  }

  // Keep the prompt bounded. Patches beyond the budget are dropped, but the
  // file stays in the list with patch_omitted set, so the omission is visible
  // rather than silent -- Claude can read the page itself if it needs detail.
  let budget = PATCH_BUDGET_BYTES
  let patchesOmitted = 0
  for (const file of considered) {
    const size = file.patch ? file.patch.length : 0
    if (size === 0) continue
    if (size <= budget) {
      budget -= size
    } else {
      file.patch = null
      file.patch_omitted = true
      patchesOmitted++
    }
  }

  const commitInfo = {
    sha: commit.sha,
    url: commit.html_url,
    message: (payload?.commit_message || commit.commit?.message || "")
      .split("\n")[0]
      .trim(),
    repository: payload?.repository || "medusajs/medusa",
    file_list_source: source,
    counts: {
      considered: considered.length,
      ignored: ignored.length,
      patches_omitted: patchesOmitted,
    },
  }

  writeFileSync(
    join(outputDir, "commit.json"),
    JSON.stringify(commitInfo, null, 2)
  )
  writeFileSync(
    join(outputDir, "changed-files.json"),
    JSON.stringify({ considered, ignored }, null, 2)
  )

  console.error(`file list source: ${source}`)
  console.error(
    `${considered.length} docs file(s) to consider, ${ignored.length} ignored`
  )
  for (const f of considered) {
    console.error(`  [${f.status}] ${f.path}`)
  }
  if (patchesOmitted > 0) {
    console.error(
      `::warning::patch budget of ${PATCH_BUDGET_BYTES} bytes exhausted: ${patchesOmitted} of ${considered.length} patches omitted`
    )
  }

  if (process.env.GITHUB_OUTPUT) {
    appendFileSync(
      process.env.GITHUB_OUTPUT,
      `has_docs_files=${considered.length > 0}\n`
    )
  }
}

main()
