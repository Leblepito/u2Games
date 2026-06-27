#!/usr/bin/env node
/**
 * Cross-platform GLB optimizer.
 *
 * Replaces the previous shell `find ... -exec gltfjsx ...` which only
 * worked on POSIX. Walks `src/assets/models/**` for `*.glb`, skips
 * already-transformed files (`*-transformed.glb`), and shells out to
 * the locally-installed `gltfjsx` CLI per file with the project's
 * standard flags (--transform --types --shadows).
 *
 * Usage:
 *   node scripts/optimize-models.mjs            # optimize everything
 *   node scripts/optimize-models.mjs --dry-run  # list targets only
 *   node scripts/optimize-models.mjs path/foo.glb [path/bar.glb ...]
 */

import { spawn } from "node:child_process";
import { readdirSync, statSync } from "node:fs";
import { join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const REPO_ROOT = resolve(__filename, "..", "..");
const MODELS_DIR = resolve(REPO_ROOT, "src", "assets", "models");

function* walk(dir) {
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch (err) {
    if (err.code === "ENOENT") return;
    throw err;
  }
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      yield* walk(full);
    } else if (entry.isFile() && entry.name.endsWith(".glb") && !entry.name.includes("-transformed")) {
      yield full;
    }
  }
}

function collectTargets(args) {
  if (args.length === 0) return [...walk(MODELS_DIR)];
  return args.map((a) => resolve(REPO_ROOT, a));
}

function runGltfjsx(file) {
  return new Promise((resolveP, rejectP) => {
    const isWin = process.platform === "win32";
    const cmd = isWin ? "npx.cmd" : "npx";
    const child = spawn(
      cmd,
      ["gltfjsx", file, "--transform", "--types", "--shadows"],
      { stdio: "inherit", cwd: REPO_ROOT, shell: false },
    );
    child.on("error", rejectP);
    child.on("exit", (code) => {
      if (code === 0) resolveP();
      else rejectP(new Error(`gltfjsx exited with code ${code} for ${file}`));
    });
  });
}

async function main(argv) {
  const dryRun = argv.includes("--dry-run");
  const positional = argv.filter((a) => !a.startsWith("--"));
  const targets = collectTargets(positional);

  if (targets.length === 0) {
    console.log(`No .glb files under ${MODELS_DIR.split(sep).join("/")} (excluding *-transformed).`);
    return;
  }

  console.log(`Found ${targets.length} GLB file(s):`);
  for (const t of targets) console.log("  -", relative(REPO_ROOT, t).split(sep).join("/"));

  if (dryRun) return;

  for (const file of targets) {
    try {
      statSync(file);
    } catch {
      console.warn(`Skipping missing file: ${file}`);
      continue;
    }
    console.log(`\n→ ${relative(REPO_ROOT, file).split(sep).join("/")}`);
    await runGltfjsx(file);
  }
}

main(process.argv.slice(2)).catch((err) => {
  console.error(err.message ?? err);
  process.exit(1);
});
