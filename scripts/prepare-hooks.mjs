#!/usr/bin/env node
/**
 * `npm run prepare` entry point.
 *
 * Runs `husky` if it's installed (no-op otherwise so cloning the repo
 * without dev deps doesn't fail). Skipped in CI to avoid needlessly
 * setting up local git hooks during build pipelines.
 */

import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const REPO_ROOT = resolve(__filename, "..", "..");

if (process.env.CI === "true") {
  console.log("[prepare] CI detected, skipping husky install.");
  process.exit(0);
}

const huskyPkg = resolve(REPO_ROOT, "node_modules", "husky", "package.json");
if (!existsSync(huskyPkg)) {
  console.log("[prepare] husky not installed yet (post-bootstrap install will retry).");
  process.exit(0);
}

const isWin = process.platform === "win32";
const result = spawnSync(isWin ? "npx.cmd" : "npx", ["husky"], {
  cwd: REPO_ROOT,
  stdio: "inherit",
  shell: false,
});
process.exit(result.status ?? 0);
