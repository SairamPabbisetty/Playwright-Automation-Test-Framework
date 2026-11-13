const fs = require("node:fs");
const path = require("node:path");

// 1. Get Execution Directory
function getExecutionDirectory() {
  const executionDir = process.argv[2];

  if (!executionDir) {
    throw new Error("Execution directory argument is required.");
  }

  const resolvedDir = path.resolve(executionDir);

  if (
    !fs.existsSync(resolvedDir) ||
    !fs.statSync(resolvedDir).isDirectory()
  ) {
    throw new Error(`Invalid execution directory: ${resolvedDir}`);
  }

  return resolvedDir;
}

// 2. Load Comparison Results
function loadComparisonResults(executionDir) {
  const comparisonFile = path.join(
    executionDir,
    "comparison",
    "comparison-results.json"
  );

  if (!fs.existsSync(comparisonFile)) {
    throw new Error(`Comparison results not found: ${comparisonFile}`);
  }

  const results = JSON.parse(fs.readFileSync(comparisonFile, "utf8"));

  if (!results.execution || !results.summary || !results.features) {
    throw new Error("Invalid comparison results structure.");
  }

  return results;
}

// 3. HTML Utilities
function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatNumber(value, decimals = 2) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return "N/A";
  }

  return number.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

function formatDuration(value) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return "N/A";
  }

  return `${formatNumber(number)} ms`;
}

function formatPercentage(value) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return "N/A";
  }

  const sign = number > 0 ? "+" : "";
  return `${sign}${formatNumber(number)}%`;
}

function getStatusClass(status) {
  const normalized = String(status ?? "unknown").toLowerCase();

  if (normalized === "passed" || normalized === "matched") {
    return "passed";
  }

  if (normalized === "failed" || normalized === "failed_on_both") {
    return "failed";
  }

  if (
    normalized === "status_mismatch" ||
    normalized === "ambiguous" ||
    normalized === "undefined"
  ) {
    return "warning";
  }

  if (normalized === "skipped" || normalized === "pending") {
    return "skipped";
  }

  return "neutral";
}

function renderStatus(status) {
  const value = status ?? "unknown";
  const cssClass = getStatusClass(value);

  return `
    <span class="status-badge ${cssClass}">
      ${escapeHtml(value)}
    </span>
  `;
}

function getBrowserResult(item, browser) {
  const result = item?.[browser];

  if (result && typeof result === "object") {
    return result;
  }

  return {
    status: result ?? "unknown",
  };
}

function getDuration(result) {
  return (
    result?.durationMs ??
    result?.duration ??
    result?.durationInMs ??
    null
  );
}

function getDifference(item) {
  return (
    item?.comparison?.durationDifferenceMs ??
    item?.durationDifferenceMs ??
    item?.differenceMs ??
    null
  );
}

function getDifferencePercentage(item) {
  return (
    item?.comparison?.durationDifferencePercentage ??
    item?.durationDifferencePercentage ??
    item?.differencePercentage ??
    null
  );
}

function getFunctionalResult(item) {
  return (
    item?.comparison?.functionalStatus ??
    item?.functionalStatus ??
    item?.functionalResult ??
    item?.result ??
    "unknown"
  );
}

function renderError(error) {
  if (!error) {
    return "";
  }

  return `
    <details class="error-details">
      <summary>View error details</summary>
      <pre>${escapeHtml(error)}</pre>
    </details>
  `;
}

function renderMissingItems(items, label) {
  if (!Array.isArray(items) || items.length === 0) {
    return "";
  }

  return `
    <div class="missing-group">
      <h4>${escapeHtml(label)} (${items.length})</h4>
      <ul>
        ${items
          .map((item) => {
            const name =
              typeof item === "string"
                ? item
                : item?.name ??
                  item?.identity ??
                  item?.uri ??
                  JSON.stringify(item);

            return `<li>${escapeHtml(name)}</li>`;
          })
          .join("")}
      </ul>
    </div>
  `;
}

// 4. Summary Metric Card
function renderMetric(label, value, extraClass = "") {
  return `
    <div class="metric-card">
      <p class="metric-label">${escapeHtml(label)}</p>
      <p class="metric-value ${extraClass}">
        ${escapeHtml(value)}
      </p>
    </div>
  `;
}

// 5. Performance Comparison
function renderPerformanceComparison(summary) {
  const performance = summary.performance?.matchedScenarioDuration;

  if (!performance) {
    return `
      <section class="section">
        <h2>Browser Performance Comparison</h2>
        <p class="empty-state">Performance comparison data is unavailable.</p>
      </section>
    `;
  }

  const chromeDuration = Number(performance.chrome);
  const edgeDuration = Number(performance.edge);

  const validDurations =
    Number.isFinite(chromeDuration) &&
    Number.isFinite(edgeDuration) &&
    chromeDuration >= 0 &&
    edgeDuration >= 0;

  const maximumDuration = validDurations
    ? Math.max(chromeDuration, edgeDuration, 1)
    : 1;

  const chromeWidth = validDurations
    ? (chromeDuration / maximumDuration) * 100
    : 0;

  const edgeWidth = validDurations
    ? (edgeDuration / maximumDuration) * 100
    : 0;

  const difference = performance.differenceMs;
  const percentage = performance.differencePercentage;

  let performanceMessage = "Performance comparison unavailable.";

  if (validDurations) {
    if (chromeDuration < edgeDuration) {
      performanceMessage = "Chrome was faster in this execution.";
    } else if (edgeDuration < chromeDuration) {
      performanceMessage = "Edge was faster in this execution.";
    } else {
      performanceMessage = "Both browsers recorded the same duration.";
    }
  }

  return `
    <section class="section">
      <div class="section-heading">
        <div>
          <h2>Browser Performance Comparison</h2>
          <p class="section-description">
            Matched scenario duration across browsers
          </p>
        </div>
        <span class="info-badge">
          ${escapeHtml(summary.performance?.durationUnit ?? "milliseconds")}
        </span>
      </div>

      <div class="performance-grid">
        <div class="performance-card chrome-card">
          <div class="browser-heading">
            <span class="browser-dot chrome-dot"></span>
            <h3>Chrome</h3>
          </div>
          <p class="performance-value">
            ${formatDuration(performance.chrome)}
          </p>
          <p class="muted">Scenario duration</p>
        </div>

        <div class="performance-card edge-card">
          <div class="browser-heading">
            <span class="browser-dot edge-dot"></span>
            <h3>Edge</h3>
          </div>
          <p class="performance-value">
            ${formatDuration(performance.edge)}
          </p>
          <p class="muted">Scenario duration</p>
        </div>
      </div>

      <div class="duration-comparison">
        <h3>Duration Visualization</h3>

        <div class="bar-row">
          <span>Chrome</span>
          <div class="bar-track">
            <div class="bar chrome-bar" style="width: ${chromeWidth}%"></div>
          </div>
          <strong>${formatDuration(performance.chrome)}</strong>
        </div>

        <div class="bar-row">
          <span>Edge</span>
          <div class="bar-track">
            <div class="bar edge-bar" style="width: ${edgeWidth}%"></div>
          </div>
          <strong>${formatDuration(performance.edge)}</strong>
        </div>
      </div>

      <div class="performance-insight">
        <div>
          <p class="insight-label">Duration Difference</p>
          <p class="insight-value">
            ${formatDuration(difference)}
          </p>
        </div>

        <div>
          <p class="insight-label">Percentage Difference</p>
          <p class="insight-value">
            ${formatPercentage(percentage)}
          </p>
        </div>
      </div>

      <p class="performance-message">${escapeHtml(performanceMessage)}</p>

      <p class="muted small">
        Source: ${escapeHtml(summary.performance?.durationSource ?? "Comparison results")}
      </p>
    </section>
  `;
}

// 6. Step and Hook Comparison Table
function renderComparisonTable(items, type) {
  if (!Array.isArray(items) || items.length === 0) {
    return `<p class="empty-state">No matched ${escapeHtml(type)} available.</p>`;
  }

  const rows = items
    .map((item, index) => {
      const chrome = getBrowserResult(item, "chrome");
      const edge = getBrowserResult(item, "edge");

      const name =
        item.name ??
        item.identity ??
        `${item.keyword ?? ""} ${item.name ?? ""}`.trim() ??
        "Unnamed";

      const keyword = item.keyword
        ? `${escapeHtml(item.keyword)} `
        : "";

      const line = item.line
        ? `<span class="line-number">Line ${escapeHtml(item.line)}</span>`
        : "";

      const functionalResult = getFunctionalResult(item);

      return `
        <tr>
          <td class="number-cell">${index + 1}</td>

          <td class="name-cell">
            <div class="step-name">${keyword}${escapeHtml(name)}</div>
            ${line}
          </td>

          <td>${renderStatus(chrome.status)}</td>
          <td>${formatDuration(getDuration(chrome))}</td>

          <td>${renderStatus(edge.status)}</td>
          <td>${formatDuration(getDuration(edge))}</td>

          <td>${formatDuration(getDifference(item))}</td>

          <td>
            ${renderStatus(functionalResult)}
            ${renderError(chrome.errorMessage)}
            ${renderError(edge.errorMessage)}
          </td>
        </tr>
      `;
    })
    .join("");

  return `
    <div class="table-wrapper">
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>${escapeHtml(type)}</th>
            <th>Chrome Status</th>
            <th>Chrome Duration</th>
            <th>Edge Status</th>
            <th>Edge Duration</th>
            <th>Difference</th>
            <th>Result / Errors</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  `;
}

// 7. Scenario Comparison
function renderScenario(scenario, index) {
  const comparison = scenario.scenarioComparison ?? scenario;

  const chrome = getBrowserResult(comparison, "chrome");
  const edge = getBrowserResult(comparison, "edge");

  const scenarioName = scenario.name ?? comparison.name ?? "Unnamed scenario";

  const steps = scenario.steps ?? {};
  const hooks = scenario.hooks ?? {};

  return `
    <details class="scenario-card" ${index === 0 ? "open" : ""}>
      <summary class="scenario-summary">
        <div class="scenario-title">
          <span class="expand-icon"></span>
          <div>
            <h3>${escapeHtml(scenarioName)}</h3>
            <p class="muted small">
              ${escapeHtml(scenario.identity ?? "")}
            </p>
          </div>
        </div>

        <div class="scenario-statuses">
          ${renderStatus(chrome.status)}
          ${renderStatus(edge.status)}
          ${renderStatus(getFunctionalResult(comparison))}
        </div>
      </summary>

      <div class="scenario-content">

        <div class="scenario-metrics">
          <div>
            <span>Chrome Duration</span>
            <strong>${formatDuration(getDuration(chrome))}</strong>
          </div>

          <div>
            <span>Edge Duration</span>
            <strong>${formatDuration(getDuration(edge))}</strong>
          </div>

          <div>
            <span>Difference</span>
            <strong>${formatDuration(getDifference(comparison))}</strong>
          </div>

          <div>
            <span>Difference %</span>
            <strong>${formatPercentage(getDifferencePercentage(comparison))}</strong>
          </div>
        </div>

        <h4>Step Comparison (${steps.matched?.length ?? 0} matched)</h4>
        ${renderComparisonTable(steps.matched, "Step")}

        <div class="missing-grid">
          ${renderMissingItems(steps.missingInEdge, "Steps missing in Edge")}
          ${renderMissingItems(steps.missingInChrome, "Steps missing in Chrome")}
        </div>

        <h4>Hook Comparison (${hooks.matched?.length ?? 0} matched)</h4>
        ${renderComparisonTable(hooks.matched, "Hook")}

        <div class="missing-grid">
          ${renderMissingItems(hooks.missingInEdge, "Hooks missing in Edge")}
          ${renderMissingItems(hooks.missingInChrome, "Hooks missing in Chrome")}
        </div>

        ${renderError(chrome.errorMessage)}
        ${renderError(edge.errorMessage)}

      </div>
    </details>
  `;
}

// 8. Feature Comparison
function renderFeatures(features) {
  if (!Array.isArray(features) || features.length === 0) {
    return `<p class="empty-state">No matched features found.</p>`;
  }

  return features
    .map((feature, index) => {
      const scenarios = Array.isArray(feature.scenarios)
        ? feature.scenarios
        : [];

      return `
        <div class="feature-card">
          <div class="feature-heading">
            <div>
              <p class="eyebrow">FEATURE ${index + 1}</p>
              <h3>${escapeHtml(feature.name ?? "Unnamed feature")}</h3>
              <p class="muted small">${escapeHtml(feature.uri ?? "")}</p>
            </div>

            ${renderStatus(feature.status ?? "matched")}
          </div>

          <div class="feature-metrics">
            <span>${scenarios.length} matched scenarios</span>
            <span>${feature.missingInEdge?.length ?? 0} missing in Edge</span>
            <span>${feature.missingInChrome?.length ?? 0} missing in Chrome</span>
          </div>

          ${scenarios
            .map((scenario, scenarioIndex) =>
              renderScenario(scenario, scenarioIndex)
            )
            .join("")}

          <div class="missing-grid">
            ${renderMissingItems(feature.missingInEdge, "Items missing in Edge")}
            ${renderMissingItems(feature.missingInChrome, "Items missing in Chrome")}
          </div>
        </div>
      `;
    })
    .join("");
}

// 9. Unmatched Items
function renderUnmatchedItems(results) {
  const unmatchedFeatures = results.unmatchedFeatures ?? [];
  const unmatchedScenarios = results.unmatchedScenarios ?? [];

  if (
    unmatchedFeatures.length === 0 &&
    unmatchedScenarios.length === 0
  ) {
    return `
      <section class="section">
        <h2>Structural Differences</h2>
        <p class="success-message">
          No unmatched features or scenarios were detected.
        </p>
      </section>
    `;
  }

  return `
    <section class="section">
      <h2>Structural Differences</h2>

      <div class="missing-grid">
        <div class="missing-group">
          <h3>Unmatched Features (${unmatchedFeatures.length})</h3>
          ${unmatchedFeatures.length
            ? `<pre>${escapeHtml(JSON.stringify(unmatchedFeatures, null, 2))}</pre>`
            : `<p class="muted">None</p>`}
        </div>

        <div class="missing-group">
          <h3>Unmatched Scenarios (${unmatchedScenarios.length})</h3>
          ${unmatchedScenarios.length
            ? `<pre>${escapeHtml(JSON.stringify(unmatchedScenarios, null, 2))}</pre>`
            : `<p class="muted">None</p>`}
        </div>
      </div>
    </section>
  `;
}

// 10. Report HTML
function generateHtmlReport(results) {
  const { execution, summary } = results;

  const generatedAt = execution.generatedAt
    ? new Date(execution.generatedAt).toLocaleString()
    : "Not available";

  const totalMismatches =
    summary.functionalComparison?.totalStatusMismatches ?? 0;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">

  <title>Browser Comparison Report</title>

  <style>
    :root {
      --background: #f4f6f9;
      --surface: #ffffff;
      --text: #263238;
      --muted: #607d8b;
      --border: #e4e9ef;
      --primary: #2563eb;
      --success: #16803c;
      --success-bg: #e8f5ec;
      --failure: #c62828;
      --failure-bg: #fdecec;
      --warning: #a15c00;
      --warning-bg: #fff4dc;
      --neutral-bg: #edf0f4;
    }

    * {
      box-sizing: border-box;
    }

    body {
      margin: 0;
      padding: 30px;
      background: var(--background);
      color: var(--text);
      font-family: Arial, Helvetica, sans-serif;
      line-height: 1.5;
    }

    .container {
      max-width: 1450px;
      margin: auto;
    }

    .header,
    .section,
    .feature-card {
      background: var(--surface);
      padding: 26px;
      margin-bottom: 22px;
      border-radius: 12px;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.035);
    }

    .header h1 {
      margin: 0 0 18px;
      font-size: 34px;
    }

    h2 {
      margin: 0 0 20px;
      font-size: 25px;
    }

    h3 {
      margin: 0;
    }

    h4 {
      margin: 25px 0 12px;
      font-size: 17px;
    }

    p {
      margin-top: 0;
    }

    .metadata,
    .muted,
    .section-description {
      color: var(--muted);
    }

    .metadata {
      margin: 8px 0;
      overflow-wrap: anywhere;
    }

    .small {
      font-size: 12px;
    }

    .summary-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(175px, 1fr));
      gap: 16px;
    }

    .metric-card {
      padding: 20px;
      background: #f4f6f9;
      border-radius: 9px;
    }

    .metric-label {
      color: var(--muted);
      font-weight: 600;
      font-size: 14px;
      margin-bottom: 8px;
    }

    .metric-value {
      font-size: 30px;
      font-weight: 700;
      margin: 0;
    }

    .success-text {
      color: var(--success);
    }

    .failure-text {
      color: var(--failure);
    }

    .section-heading,
    .feature-heading,
    .scenario-summary,
    .browser-heading {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
    }

    .info-badge,
    .status-badge {
      display: inline-block;
      padding: 5px 10px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 700;
      white-space: nowrap;
    }

    .info-badge {
      color: #2453a6;
      background: #eaf1ff;
    }

    .status-badge.passed {
      color: var(--success);
      background: var(--success-bg);
    }

    .status-badge.failed {
      color: var(--failure);
      background: var(--failure-bg);
    }

    .status-badge.warning {
      color: var(--warning);
      background: var(--warning-bg);
    }

    .status-badge.skipped,
    .status-badge.neutral {
      color: #59636e;
      background: var(--neutral-bg);
    }

    .performance-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 18px;
      margin: 22px 0;
    }

    .performance-card {
      padding: 22px;
      border: 1px solid var(--border);
      border-radius: 10px;
    }

    .browser-heading {
      justify-content: flex-start;
    }

    .browser-dot {
      width: 11px;
      height: 11px;
      border-radius: 50%;
      display: inline-block;
    }

    .chrome-dot {
      background: #4285f4;
    }

    .edge-dot {
      background: #0b9b8a;
    }

    .performance-value {
      margin: 16px 0 4px;
      font-size: 30px;
      font-weight: 700;
    }

    .duration-comparison {
      padding: 20px;
      background: #f8fafc;
      border-radius: 9px;
    }

    .duration-comparison h3 {
      margin-bottom: 20px;
    }

    .bar-row {
      display: grid;
      grid-template-columns: 75px minmax(80px, 1fr) 130px;
      align-items: center;
      gap: 14px;
      margin: 15px 0;
      font-size: 13px;
    }

    .bar-track {
      height: 13px;
      overflow: hidden;
      background: #e6ebf1;
      border-radius: 20px;
    }

    .bar {
      height: 100%;
      min-width: 2px;
      border-radius: 20px;
    }

    .chrome-bar {
      background: #4285f4;
    }

    .edge-bar {
      background: #0b9b8a;
    }

    .performance-insight {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 15px;
      margin-top: 18px;
    }

    .performance-insight > div {
      padding: 18px;
      border: 1px solid var(--border);
      border-radius: 9px;
    }

    .insight-label {
      color: var(--muted);
      font-size: 13px;
      margin-bottom: 7px;
    }

    .insight-value {
      font-size: 22px;
      font-weight: 700;
      margin: 0;
    }

    .performance-message {
      margin: 18px 0 8px;
      font-weight: 700;
    }

    .feature-card {
      border: 1px solid var(--border);
      box-shadow: none;
      margin-bottom: 18px;
    }

    .eyebrow {
      color: var(--muted);
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 1px;
      margin-bottom: 5px;
    }

    .feature-heading h3 {
      font-size: 20px;
      overflow-wrap: anywhere;
    }

    .feature-metrics {
      display: flex;
      flex-wrap: wrap;
      gap: 10px 22px;
      padding: 14px 0;
      margin-top: 18px;
      border-top: 1px solid var(--border);
      border-bottom: 1px solid var(--border);
      color: var(--muted);
      font-size: 13px;
    }

    .scenario-card {
      border: 1px solid var(--border);
      border-radius: 9px;
      margin-top: 16px;
      overflow: hidden;
    }

    .scenario-summary {
      padding: 17px;
      cursor: pointer;
      list-style: none;
    }

    .scenario-summary::-webkit-details-marker {
      display: none;
    }

    .scenario-title {
      display: flex;
      align-items: center;
      gap: 12px;
      min-width: 0;
    }

    .scenario-title h3 {
      font-size: 16px;
      overflow-wrap: anywhere;
    }

    .expand-icon::before {
      content: "+";
      display: inline-flex;
      width: 24px;
      height: 24px;
      align-items: center;
      justify-content: center;
      background: #edf2f7;
      border-radius: 50%;
      font-weight: 700;
    }

    details[open] > summary .expand-icon::before {
      content: "−";
    }

    .scenario-statuses {
      display: flex;
      flex-wrap: wrap;
      justify-content: flex-end;
      gap: 6px;
    }

    .scenario-content {
      padding: 20px;
      border-top: 1px solid var(--border);
    }

    .scenario-metrics {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
      gap: 12px;
    }

    .scenario-metrics > div {
      padding: 14px;
      background: #f6f8fb;
      border-radius: 8px;
    }

    .scenario-metrics span {
      display: block;
      color: var(--muted);
      font-size: 12px;
      margin-bottom: 5px;
    }

    .scenario-metrics strong {
      font-size: 15px;
    }

    .table-wrapper {
      width: 100%;
      overflow-x: auto;
      border: 1px solid var(--border);
      border-radius: 8px;
    }

    table {
      width: 100%;
      min-width: 950px;
      border-collapse: collapse;
      font-size: 13px;
    }

    th,
    td {
      padding: 12px;
      text-align: left;
      border-bottom: 1px solid var(--border);
      vertical-align: top;
    }

    th {
      background: #f4f6f9;
      color: #536574;
      font-size: 12px;
      white-space: nowrap;
    }

    tr:last-child td {
      border-bottom: none;
    }

    tbody tr:hover {
      background: #fafbfd;
    }

    .number-cell {
      color: var(--muted);
      width: 35px;
    }

    .name-cell {
      min-width: 240px;
      overflow-wrap: anywhere;
    }

    .line-number {
      display: block;
      color: var(--muted);
      font-size: 11px;
      margin-top: 4px;
    }

    .missing-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 15px;
    }

    .missing-group {
      padding: 15px;
      margin-top: 15px;
      border: 1px solid var(--border);
      border-radius: 8px;
      min-width: 0;
    }

    .missing-group h3,
    .missing-group h4 {
      margin-top: 0;
    }

    .missing-group ul {
      padding-left: 20px;
      overflow-wrap: anywhere;
    }

    .error-details {
      margin-top: 8px;
      color: var(--failure);
      font-size: 12px;
    }

    .error-details summary {
      cursor: pointer;
      font-weight: 600;
    }

    pre {
      max-width: 100%;
      overflow: auto;
      padding: 12px;
      background: #f6f8fb;
      border-radius: 7px;
      white-space: pre-wrap;
      overflow-wrap: anywhere;
      color: #344054;
      font-size: 12px;
    }

    .empty-state,
    .success-message {
      padding: 16px;
      background: #f6f8fb;
      border-radius: 8px;
      color: var(--muted);
    }

    .success-message {
      color: var(--success);
      background: var(--success-bg);
      font-weight: 600;
    }

    .report-footer {
      text-align: center;
      color: var(--muted);
      font-size: 12px;
      padding: 18px;
    }

    .report-actions {
      display: flex;
      justify-content: flex-end;
      margin-bottom: 16px;
    }

    .print-button {
      border: none;
      background: var(--primary);
      color: white;
      padding: 10px 18px;
      border-radius: 7px;
      cursor: pointer;
      font-weight: 600;
    }

    .print-button:hover {
      background: #174dbb;
    }

    @media (max-width: 700px) {
      body {
        padding: 12px;
      }

      .header,
      .section,
      .feature-card {
        padding: 18px;
      }

      .header h1 {
        font-size: 26px;
      }

      .performance-grid,
      .performance-insight {
        grid-template-columns: 1fr;
      }

      .section-heading,
      .scenario-summary {
        align-items: flex-start;
      }

      .scenario-summary {
        flex-direction: column;
      }

      .scenario-statuses {
        justify-content: flex-start;
      }

      .bar-row {
        grid-template-columns: 55px minmax(50px, 1fr);
      }

      .bar-row strong {
        grid-column: 2;
      }
    }

    @media print {
      body {
        padding: 0;
        background: white;
      }

      .container {
        max-width: none;
      }

      .header,
      .section,
      .feature-card {
        box-shadow: none;
        border: 1px solid #ddd;
        break-inside: avoid;
      }

      .print-button,
      .report-actions {
        display: none;
      }

      details,
      details:not([open]) {
        display: block;
      }

      details > *:not(summary) {
        display: block;
      }

      .table-wrapper {
        overflow: visible;
      }

      table {
        min-width: 0;
        font-size: 9px;
      }

      th,
      td {
        padding: 5px;
      }
    }
  </style>
</head>

<body>
  <main class="container">

    <div class="report-actions">
      <button class="print-button" onclick="window.print()">
        Print / Save as PDF
      </button>
    </div>

    <header class="header">
      <h1>Browser Comparison Report</h1>

      <p class="metadata">
        <strong>Execution ID:</strong>
        ${escapeHtml(execution.executionId)}
      </p>

      <p class="metadata">
        <strong>Browsers:</strong>
        ${escapeHtml((execution.browsers ?? []).join(" vs "))}
      </p>

      <p class="metadata">
        <strong>Generated:</strong>
        ${escapeHtml(generatedAt)}
      </p>
    </header>

    <section class="section">
      <h2>Comparison Summary</h2>

      <div class="summary-grid">
        ${renderMetric("Matched Features", summary.features?.matched ?? 0)}
        ${renderMetric("Matched Scenarios", summary.scenarios?.matched ?? 0)}
        ${renderMetric("Matched Steps", summary.steps?.matched ?? 0)}
        ${renderMetric("Matched Hooks", summary.hooks?.matched ?? 0)}
        ${renderMetric(
          "Status Mismatches",
          totalMismatches,
          totalMismatches === 0 ? "success-text" : "failure-text"
        )}
        ${renderMetric("Passed on Both", summary.scenarioResults?.passedOnBoth ?? 0, "success-text")}
        ${renderMetric("Failed on Both", summary.scenarioResults?.failedOnBoth ?? 0, "failure-text")}
        ${renderMetric("Missing Features", (summary.features?.missingInEdge ?? 0) + (summary.features?.missingInChrome ?? 0))}
        ${renderMetric("Missing Scenarios", (summary.scenarios?.missingInEdge ?? 0) + (summary.scenarios?.missingInChrome ?? 0))}
      </div>
    </section>

    ${renderPerformanceComparison(summary)}

    <section class="section">
      <h2>Feature and Scenario Details</h2>
      ${renderFeatures(results.features)}
    </section>

    ${renderUnmatchedItems(results)}

    <footer class="report-footer">
      Browser Comparison Report · Generated from normalized comparison results
    </footer>

  </main>
</body>
</html>`;

  return html;
}

// 11. Main Execution
function main() {
  const executionDir = getExecutionDirectory();

  console.log(`Execution directory: ${executionDir}`);

  const comparisonResults = loadComparisonResults(executionDir);

  console.log("Comparison results loaded successfully.");

  const htmlReport = generateHtmlReport(comparisonResults);

  const reportPath = path.join(
    executionDir,
    "comparison",
    "comparison-report.html"
  );

  fs.writeFileSync(reportPath, htmlReport, "utf8");

  console.log("\nHTML comparison report generated successfully.");
  console.log(`Report location: ${reportPath}`);
}

// 12. Execute Script
try {
  main();
} catch (error) {
  console.error(`\nComparison report generation failed: ${error.message}`);
  process.exitCode = 1;
}
