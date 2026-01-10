import { execSync } from "child_process";
import fs from "fs";
import path from "path";

const MIN_COVERAGE = Number(process.env.MIN_COVERAGE || 80);
const BASE_BRANCH = process.env.BASE_BRANCH || "main";

function run(cmd) {
  return execSync(cmd, { encoding: "utf8" }).trim();
}

function findCoverageFile() {
  const possible = [
    "coverage/coverage-summary.json",
    "coverage/coverage-final.json",
    "coverage/coverage.json",
    "coverage/coverage-summary/coverage-summary.json",
  ];
  for (const p of possible) {
    const abs = path.resolve(process.cwd(), p);
    if (fs.existsSync(abs)) return abs;
  }
  return null;
}

function loadCoverageSummary(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (err) {
    console.error("Failed to read coverage summary:", err.message || err);
    process.exit(2);
  }
}

function getChangedFiles(base) {
  try {
    // Ensure we have the base branch available for comparison
    try {
      run(`git fetch origin ${base} --depth=1`);
    } catch (e) {
      /* ignore */
    }
    const diff = run(`git diff --name-only origin/${base}...HEAD`);
    if (!diff) return [];
    return diff.split("\n").filter(Boolean);
  } catch (err) {
    console.error("Failed to get changed files:", err.message || err);
    process.exit(2);
  }
}

function buildTotalsForFiles(summary, changedFiles) {
  // summary may contain a `total` plus per-file keys
  if (!summary || typeof summary !== "object") return null;

  const filesSummary = {};
  // normalize mapping: keys that look like file paths map to their data
  Object.keys(summary).forEach((k) => {
    if (k === "total") return;
    filesSummary[k] = summary[k];
  });

  const matched = [];
  for (const changed of changedFiles) {
    // only consider source files
    if (!changed.startsWith("src/")) continue;
    // try to find a coverage key that endsWith the changed path
    const candidate = Object.keys(filesSummary).find(
      (key) =>
        key.endsWith(changed) || key.endsWith(`/${path.basename(changed)}`)
    );
    if (candidate)
      matched.push({ changed, key: candidate, data: filesSummary[candidate] });
  }

  if (matched.length === 0) return null;

  const metrics = {
    lines: { total: 0, covered: 0 },
    statements: { total: 0, covered: 0 },
    functions: { total: 0, covered: 0 },
    branches: { total: 0, covered: 0 },
  };

  matched.forEach(({ data }) => {
    ["lines", "statements", "functions", "branches"].forEach((m) => {
      const info = data[m];
      if (info && typeof info.total === "number") {
        metrics[m].total += info.total || 0;
        metrics[m].covered += info.covered || 0;
      }
    });
  });

  const percentages = {};
  Object.keys(metrics).forEach((m) => {
    const t = metrics[m];
    percentages[m] = t.total
      ? Math.round((t.covered / t.total) * 10000) / 100
      : 100;
  });

  return { matched, metrics, percentages };
}

function assertChangedCoverage(summary) {
  const changedFiles = getChangedFiles(BASE_BRANCH);
  if (!changedFiles || changedFiles.length === 0) {
    console.log("No changed files detected vs", BASE_BRANCH);
    return;
  }

  const result = buildTotalsForFiles(summary, changedFiles);
  if (!result) {
    console.log(
      "No changed source files with coverage data found; skipping changed-file coverage check."
    );
    return;
  }

  console.log(
    "Found changed files with coverage data:",
    result.matched.map((m) => m.changed).join(", ")
  );
  const fails = [];
  Object.keys(result.percentages).forEach((m) => {
    const pct = result.percentages[m];
    console.log(` - ${m}: ${pct}%`);
    if (pct < MIN_COVERAGE) fails.push(`${m}: ${pct}% < ${MIN_COVERAGE}%`);
  });

  if (fails.length > 0) {
    console.error("Changed-files coverage threshold NOT met:");
    fails.forEach((f) => console.error(" -", f));
    process.exit(3);
  }

  console.log(
    "✅ Changed-files coverage thresholds met (>=",
    MIN_COVERAGE,
    "%)"
  );
}

function main() {
  const covFile = findCoverageFile();
  if (!covFile) {
    console.error(
      "No coverage summary JSON found. Make sure tests were run with --coverage."
    );
    process.exit(1);
  }

  const summary = loadCoverageSummary(covFile);
  // If the file is a wrapper with `total`, adjust to the mapping
  const perFileSummary = summary && summary.total ? summary : summary;

  assertChangedCoverage(perFileSummary);
}

main();
