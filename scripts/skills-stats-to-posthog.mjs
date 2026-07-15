#!/usr/bin/env node
/**
 * Snapshot skills.sh install counts and send them to PostHog.
 *
 * There is no history/trends endpoint on skills.sh — this job runs daily and
 * records the current `installs` for each skill so PostHog builds the trend.
 *
 * Discovery: every folder in the repo containing a SKILL.md is a skill; its
 * slug is the folder name.
 *
 * Data source: GET https://skills.sh/api/v1/skills/{source}/{slug}
 *   -> { id, source, slug, installs, hash, files: [{ path, contents }] }
 *   Requires a Vercel OIDC token (Authorization: Bearer <VERCEL_OIDC_TOKEN>).
 *
 * Destination: PostHog batch capture (one `skill_stats_snapshot` event per skill).
 *
 * Exit codes:
 *   0  all resolved skills snapshotted and sent (per-skill 404s only warn)
 *   1  systemic failure: missing config, token rejected, network/5xx errors,
 *      unparseable installs, nothing to send, or the PostHog send failed
 *
 * Required env:
 *   VERCEL_OIDC_TOKEN        Vercel OIDC token accepted by skills.sh
 *   POSTHOG_PROJECT_API_KEY  PostHog project ingestion key (phc_...)
 * Optional env:
 *   SOURCE                   skills.sh source (default medusajs/medusa-agent-skills)
 *   REPO_ROOT                repo root to scan (default $GITHUB_WORKSPACE or cwd)
 *   POSTHOG_HOST             PostHog host (default https://eu.i.posthog.com)
 *   DRY_RUN                  if "1"/"true", skip the PostHog send (still fetches)
 */

import { readdirSync, statSync } from "node:fs";
import { join, basename } from "node:path";

const SOURCE = process.env.SOURCE || "medusajs/medusa-agent-skills";
const REPO_ROOT = process.env.REPO_ROOT || process.env.GITHUB_WORKSPACE || process.cwd();
const SKILLS_API = "https://skills.sh/api/v1/skills";
const POSTHOG_HOST = (process.env.POSTHOG_HOST || "https://eu.i.posthog.com").replace(/\/$/, "");
const EVENT = "skill_stats_snapshot";
const DISTINCT_ID = "skills-sh-tracker";
const DRY_RUN = ["1", "true", "yes"].includes(String(process.env.DRY_RUN || "").toLowerCase());

const OIDC_TOKEN = process.env.VERCEL_OIDC_TOKEN;
const POSTHOG_KEY = process.env.POSTHOG_PROJECT_API_KEY;

const IGNORE_DIRS = new Set(["node_modules", ".git", ".github"]);

function fail(msg) {
  console.error(`::error::${msg}`);
  process.exit(1);
}

function warn(msg) {
  console.warn(`::warning::${msg}`);
}

/** Recursively find every folder that directly contains a SKILL.md file. */
function discoverSkills(root) {
  const found = [];
  const walk = (dir) => {
    let entries;
    try {
      entries = readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    const hasSkill = entries.some((e) => e.isFile() && e.name === "SKILL.md");
    if (hasSkill) {
      found.push({ slug: basename(dir), dir });
      // A skill folder can still nest sub-skills, so keep walking.
    }
    for (const e of entries) {
      if (e.isDirectory() && !IGNORE_DIRS.has(e.name)) {
        walk(join(dir, e.name));
      }
    }
  };
  walk(root);
  // De-dupe by slug (a slug maps to a single skill on skills.sh).
  const bySlug = new Map();
  for (const s of found) {
    if (!bySlug.has(s.slug)) bySlug.set(s.slug, s);
  }
  return [...bySlug.values()].sort((a, b) => a.slug.localeCompare(b.slug));
}

const MAX_ATTEMPTS = 3;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** fetch() with retry on network errors and 5xx/429 (transient blips). */
async function fetchWithRetry(url, options) {
  let lastErr;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const res = await fetch(url, options);
      // Retry only on transient server-side statuses; 4xx (incl. 404) is final.
      if (res.status >= 500 || res.status === 429) {
        lastErr = new Error(`HTTP ${res.status}`);
      } else {
        return res;
      }
    } catch (err) {
      lastErr = err;
    }
    if (attempt < MAX_ATTEMPTS) await sleep(attempt * 500);
  }
  throw lastErr;
}

/** Fetch install count for one skill. Returns a classified result. */
async function fetchSkill(slug) {
  const url = `${SKILLS_API}/${SOURCE}/${encodeURIComponent(slug)}`;
  let res;
  try {
    res = await fetchWithRetry(url, {
      headers: { Authorization: `Bearer ${OIDC_TOKEN}` },
    });
  } catch (err) {
    return { slug, status: "error", reason: `network error after ${MAX_ATTEMPTS} attempts: ${err.message}` };
  }

  if (res.status === 404) {
    return { slug, status: "not_indexed" };
  }
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    return {
      slug,
      status: "error",
      reason: `HTTP ${res.status}${body ? ` — ${body.slice(0, 200)}` : ""}`,
    };
  }

  let data;
  try {
    data = await res.json();
  } catch (err) {
    return { slug, status: "error", reason: `invalid JSON: ${err.message}` };
  }

  const installs = data.installs;
  if (typeof installs !== "number" || !Number.isFinite(installs)) {
    return {
      slug,
      status: "error",
      reason: `installs missing or not numeric (got ${JSON.stringify(installs)})`,
    };
  }

  return {
    slug,
    status: "ok",
    installs,
    hash: typeof data.hash === "string" ? data.hash : null,
    fileCount: Array.isArray(data.files) ? data.files.length : null,
  };
}

async function sendToPostHog(events) {
  const payload = {
    api_key: POSTHOG_KEY,
    historical_migration: false,
    batch: events.map((e) => ({
      event: EVENT,
      distinct_id: DISTINCT_ID,
      properties: {
        source: SOURCE,
        skill: e.slug,
        installs: e.installs,
        hash: e.hash,
        file_count: e.fileCount,
        // Keep these backend metric events from creating/updating person profiles.
        $process_person_profile: false,
      },
    })),
  };

  const res = await fetch(`${POSTHOG_HOST}/batch/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const body = await res.text().catch(() => "");
  if (!res.ok) {
    throw new Error(`PostHog batch returned HTTP ${res.status}: ${body.slice(0, 300)}`);
  }
  return body;
}

async function main() {
  if (!OIDC_TOKEN) fail("VERCEL_OIDC_TOKEN is not set — cannot authenticate to skills.sh.");
  if (!POSTHOG_KEY && !DRY_RUN) fail("POSTHOG_PROJECT_API_KEY is not set.");

  const skills = discoverSkills(REPO_ROOT);
  if (skills.length === 0) {
    fail(`No skills found under ${REPO_ROOT} (looked for folders containing SKILL.md).`);
  }
  console.log(`Discovered ${skills.length} skill(s) under ${REPO_ROOT}:`);
  console.log(`  ${skills.map((s) => s.slug).join(", ")}`);
  console.log(`Fetching install counts from ${SKILLS_API}/${SOURCE}/<slug> ...`);

  const results = await Promise.all(skills.map((s) => fetchSkill(s.slug)));

  const ok = results.filter((r) => r.status === "ok");
  const notIndexed = results.filter((r) => r.status === "not_indexed");
  const errored = results.filter((r) => r.status === "error");

  for (const r of ok) {
    console.log(`  ✓ ${r.slug}: ${r.installs} installs (files: ${r.fileCount})`);
  }
  for (const r of notIndexed) {
    warn(`${r.slug}: not indexed on skills.sh yet (HTTP 404) — skipping.`);
  }
  for (const r of errored) {
    warn(`${r.slug}: ${r.reason}`);
  }

  console.log(
    `\nSummary: ${ok.length} ok, ${notIndexed.length} not-indexed (404), ${errored.length} error(s).`
  );

  // Send whatever succeeded so we never lose a day of snapshots, then decide exit.
  if (ok.length > 0) {
    if (DRY_RUN) {
      console.log("\nDRY_RUN: skipping PostHog send. Payload preview:");
      console.log(
        JSON.stringify(
          ok.map((e) => ({ skill: e.slug, installs: e.installs })),
          null,
          2
        )
      );
    } else {
      try {
        const body = await sendToPostHog(ok);
        console.log(`\nSent ${ok.length} '${EVENT}' event(s) to PostHog. Response: ${body}`);
      } catch (err) {
        fail(`Failed to send events to PostHog: ${err.message}`);
      }
    }
  }

  // Systemic failure conditions (never silently post zeros or skip everything).
  if (ok.length === 0) {
    fail(
      "No install counts could be retrieved — the skills.sh API may be down or the " +
        "token was rejected. Not posting anything."
    );
  }
  if (errored.length > 0) {
    fail(
      `${errored.length} skill(s) failed with non-404 errors (see warnings above). ` +
        `Sent the ${ok.length} that succeeded, but failing the job to surface the problem.`
    );
  }

  console.log("\nDone.");
}

main().catch((err) => fail(`Unexpected error: ${err.stack || err.message}`));
