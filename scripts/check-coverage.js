import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Support __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Enforce minimum coverage percentage
const MIN_COVERAGE = 80;

// Potential coverage summary file locations
const POSSIBLE_FILES = [
  "coverage/coverage-summary.json",
  "coverage/coverage-final.json",
  "coverage/coverage.json",
  "coverage/coverage-summary/coverage-summary.json",
];

function findCoverageFile() {
  for (const p of POSSIBLE_FILES) {
    const abs = path.resolve(process.cwd(), p);
    if (fs.existsSync(abs)) return abs;
  }
  return null;
}

function readSummary(jsonPath) {
  try {
    const contents = fs.readFileSync(jsonPath, "utf-8");
    const parsed = JSON.parse(contents);
    // If the file is an object with a `total` property, use it. Otherwise, use root `total` field semantics.
    if (parsed.total) return parsed.total;

    // Some v8 provider outputs may put keys differently; try to build totals ourselves
    if (parsed.coverage) {
      return parsed.coverage.total || parsed.total || null;
    }

    // If it's a map of files with summary including 'total', roll up totals to compute overall total
    if (parsed && typeof parsed === "object") {
      if (parsed.total) return parsed.total;
      // If it's an object by files with `lines`, etc compute totals
      const totals = {
        lines: { total: 0, covered: 0 },
        statements: { total: 0, covered: 0 },
        functions: { total: 0, covered: 0 },
        branches: { total: 0, covered: 0 },
      };
      Object.keys(parsed).forEach((key) => {
        const file = parsed[key];
        if (file.lines && typeof file.lines.covered === "number") {
          totals.lines.total += file.lines.total || 0;
          totals.lines.covered += file.lines.covered || 0;
        }
        if (file.statements && typeof file.statements.covered === "number") {
          totals.statements.total += file.statements.total || 0;
          totals.statements.covered += file.statements.covered || 0;
        }
        if (file.functions && typeof file.functions.covered === "number") {
          totals.functions.total += file.functions.total || 0;
          totals.functions.covered += file.functions.covered || 0;
        }
        if (file.branches && typeof file.branches.covered === "number") {
          totals.branches.total += file.branches.total || 0;
          totals.branches.covered += file.branches.covered || 0;
        }
      });
      return {
        lines: {
          pct: totals.lines.total
            ? Math.round((totals.lines.covered / totals.lines.total) * 10000) /
              100
            : 0,
        },
        statements: {
          pct: totals.statements.total
            ? Math.round(
                (totals.statements.covered / totals.statements.total) * 10000
              ) / 100
            : 0,
        },
        functions: {
          pct: totals.functions.total
            ? Math.round(
                (totals.functions.covered / totals.functions.total) * 10000
              ) / 100
            : 0,
        },
        branches: {
          pct: totals.branches.total
            ? Math.round(
                (totals.branches.covered / totals.branches.total) * 10000
              ) / 100
            : 0,
        },
      };
    }
    return null;
  } catch (err) {
    console.error("Failed to read coverage summary:", err.message || err);
    return null;
  }
}

function assertCoveragePasses(total) {
  if (!total) {
    console.error("No coverage data found in the summary file.");
    process.exit(2);
  }

  const metrics = ["lines", "statements", "functions", "branches"];
  const fails = [];

  metrics.forEach((m) => {
    const pct = (total[m] && total[m].pct) || total[m]?.pct;
    if (typeof pct === "number") {
      if (pct < MIN_COVERAGE) fails.push(`${m}: ${pct}% < ${MIN_COVERAGE}%`);
    } else {
      // if we don't have a data point for this metric, don't fail but show a warning
      console.warn(
        `Coverage metric ${m} not found in coverage summary; skipping check.`
      );
    }
  });

  if (fails.length > 0) {
    console.error("Coverage threshold NOT met:");
    fails.forEach((f) => console.error(" -", f));
    process.exit(3);
  }

  console.log("✅ Coverage thresholds met (>=", MIN_COVERAGE, "%)");
  process.exit(0);
}

function main() {
  const coverageFile = findCoverageFile();
  if (!coverageFile) {
    console.error(
      "No coverage summary JSON found. Checked:",
      POSSIBLE_FILES.join(", ")
    );
    process.exit(1);
  }

  console.log("Found coverage summary file at", coverageFile);
  const total = readSummary(coverageFile);
  assertCoveragePasses(total);
}

main();
