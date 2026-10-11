
const fs = require("node:fs");
const path = require("node:path");

const reportDir = process.env.REPORT_DIR;

if (!reportDir) {
  console.error("REPORT_DIR is not set.");
  process.exit(1);
}

const jsonPath = path.join(reportDir, "cucumber-report.json");
const htmlPath = path.join(reportDir, "report.html");

if (!fs.existsSync(jsonPath)) {
  console.error(`Cucumber JSON report not found: ${jsonPath}`);
  process.exit(1);
}

const features = JSON.parse(fs.readFileSync(jsonPath, "utf8"));

const escapeHtml = (value) =>
  String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[char]);

const statusOf = (step) => {
  const status = step.result?.status;
  if (status === "passed") return "passed";
  if (status === "failed") return "failed";
  if (status === "undefined" || status === "ambiguous") return "undefined";
  return "skipped";
};

const counts = {
  passed: 0,
  failed: 0,
  skipped: 0,
  undefined: 0
};

let scenarioCount = 0;
let scenarioPassed = 0;
let scenarioFailed = 0;
let scenarioSkipped = 0;

const featureSections = [];

for (const feature of features) {
  const scenarios = [];

  for (const scenario of feature.elements ?? []) {
    if (scenario.type !== "scenario" && scenario.type !== "scenario_outline") {
      continue;
    }

    scenarioCount++;
    const steps = scenario.steps ?? [];
    let scenarioHasFailure = false;
    let scenarioHasUndefined = false;

    const stepRows = steps.map((step) => {
      const status = statusOf(step);
      counts[status]++;

      if (status === "failed") scenarioHasFailure = true;
      if (status === "undefined") scenarioHasUndefined = true;

      const durationNs = step.result?.duration ?? 0;
      const duration = `${(durationNs / 1e9).toFixed(3)} s`;
      const error = step.result?.error_message ?? "";
      const keyword = step.keyword ?? "";
      const text = step.name ?? "(unnamed step)";

      return `
        <div class="step ${status}">
          <div class="step-main">
            <span class="status-icon" aria-label="${status}">${{
              passed: "✓",
              failed: "✗",
              skipped: "—",
              undefined: "?"
            }[status]}</span>
            <div class="step-content">
              <div class="step-title">
                <span class="keyword">${escapeHtml(keyword)}</span>
                ${escapeHtml(text)}
              </div>
              <div class="step-meta">
                <span class="badge ${status}">${status.toUpperCase()}</span>
                <span>${duration}</span>
              </div>
              ${error ? `
                <details class="error" open>
                  <summary>Error details</summary>
                  <pre>${escapeHtml(error)}</pre>
                </details>
              ` : ""}
            </div>
          </div>
        </div>
      `;
    }).join("");

    const scenarioStatus = scenarioHasFailure
      ? "failed"
      : scenarioHasUndefined
        ? "undefined"
        : steps.some((step) => statusOf(step) === "skipped")
          ? "skipped"
          : "passed";

    if (scenarioStatus === "passed") scenarioPassed++;
    else if (scenarioStatus === "failed") scenarioFailed++;
    else scenarioSkipped++;

    scenarios.push(`
      <section class="scenario">
        <div class="scenario-heading">
          <div>
            <h3>${escapeHtml(scenario.name)}</h3>
            <p class="muted">${escapeHtml(scenario.keyword ?? "Scenario")}</p>
          </div>
          <span class="badge ${scenarioStatus}">${scenarioStatus.toUpperCase()}</span>
        </div>
        <div class="steps">${stepRows}</div>
      </section>
    `);
  }

  if (scenarios.length) {
    featureSections.push(`
      <section class="feature">
        <h2>${escapeHtml(feature.name ?? feature.uri ?? "Feature")}</h2>
        <div class="scenarios">${scenarios.join("")}</div>
      </section>
    `);
  }
}

const totalSteps = Object.values(counts).reduce((sum, count) => sum + count, 0);
const generatedAt = new Date().toLocaleString();

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Cucumber Test Report</title>
<style>
:root {
  font-family: "Segoe UI", Arial, sans-serif;
  color: #202938;
  background: #f5f7fb;
}
* { box-sizing: border-box; }
body { margin: 0; padding: 28px; }
main { max-width: 1200px; margin: auto; }
h1 { margin: 0 0 8px; font-size: 30px; }
h2 { margin: 0 0 18px; font-size: 22px; }
h3 { margin: 0; font-size: 17px; }
.muted { color: #64748b; font-size: 13px; margin: 5px 0 0; }
.summary {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
  gap: 12px;
  margin: 24px 0;
}
.card, .feature, .scenario {
  background: white;
  border: 1px solid #e1e6ef;
  border-radius: 10px;
}
.card { padding: 16px; }
.card-label { color: #64748b; font-size: 13px; }
.card-number { font-size: 29px; font-weight: 700; margin-top: 5px; }
.feature { padding: 22px; margin: 20px 0; }
.scenario { margin-top: 14px; overflow: hidden; }
.scenario-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  padding: 16px;
  border-bottom: 1px solid #e8edf4;
}
.step { padding: 14px 16px; border-bottom: 1px solid #edf0f5; }
.step:last-child { border-bottom: 0; }
.step-main { display: flex; gap: 12px; align-items: flex-start; }
.status-icon { font-weight: 800; font-size: 18px; width: 20px; text-align: center; }
.step-content { flex: 1; min-width: 0; }
.step-title { line-height: 1.5; overflow-wrap: anywhere; }
.keyword { font-weight: 700; margin-right: 5px; }
.step-meta { display: flex; gap: 12px; align-items: center; margin-top: 8px; color: #64748b; font-size: 12px; }
.badge { display: inline-block; padding: 4px 8px; border-radius: 5px; font-size: 11px; font-weight: 800; }
.passed .status-icon, .badge.passed { color: #137333; }
.badge.passed { background: #e4f5e9; }
.failed .status-icon, .badge.failed { color: #b42318; }
.badge.failed { background: #fee4e2; }
.skipped .status-icon, .badge.skipped { color: #8a6100; }
.badge.skipped { background: #fff2cc; }
.undefined .status-icon, .badge.undefined { color: #6941c6; }
.badge.undefined { background: #eee7ff; }
.error { margin-top: 12px; border: 1px solid #f2b8b5; background: #fff5f5; border-radius: 6px; padding: 10px; }
.error summary { color: #b42318; font-weight: 700; cursor: pointer; }
pre { white-space: pre-wrap; overflow-wrap: anywhere; font-size: 12px; line-height: 1.5; margin-bottom: 0; }
@media (max-width: 600px) { body { padding: 14px; } .feature { padding: 14px; } }
</style>
</head>
<body>
<main>
  <h1>Cucumber Test Report</h1>
  <p class="muted">Generated: ${escapeHtml(generatedAt)}</p>

  <div class="summary">
    <div class="card"><div class="card-label">Scenarios</div><div class="card-number">${scenarioCount}</div></div>
    <div class="card"><div class="card-label">Passed steps</div><div class="card-number" style="color:#137333">${counts.passed}</div></div>
    <div class="card"><div class="card-label">Failed steps</div><div class="card-number" style="color:#b42318">${counts.failed}</div></div>
    <div class="card"><div class="card-label">Skipped steps</div><div class="card-number" style="color:#8a6100">${counts.skipped}</div></div>
    <div class="card"><div class="card-label">Undefined steps</div><div class="card-number" style="color:#6941c6">${counts.undefined}</div></div>
    <div class="card"><div class="card-label">Total steps</div><div class="card-number">${totalSteps}</div></div>
  </div>

  ${featureSections.join("") || "<p>No scenarios were found in the Cucumber JSON report.</p>"}
</main>
</body>
</html>`;

fs.writeFileSync(htmlPath, html, "utf8");
console.log(`HTML report generated: ${htmlPath}`);
