
const fs = require("node:fs");
const { getReportConfig } = require("../config/report.config");

// Input Configuration
const reportConfig = getReportConfig();

const reportDir = reportConfig.reportDir;
const browser = process.env.BROWSER;
const executionId = process.env.EXECUTION_ID;

if (!browser || !executionId) {
  console.error(
    "Missing configuration. BROWSER and EXECUTION_ID are required."
  );
  process.exit(1);
}

// Check whether normalized JSON generation is enabled.
if (!reportConfig.generate.normalizedJson) {
  console.log("Normalized JSON generation is disabled.");
  process.exit(0);
}

// Get filenames from centralized configuration.
const inputPath = require("node:path").join(
  reportDir,
  reportConfig.files.cucumberJson
);

const outputPath = require("node:path").join(
  reportDir,
  reportConfig.files.normalizedJson
);

if (!fs.existsSync(inputPath)) {
  console.error(`Cucumber JSON report not found: ${inputPath}`);
  process.exit(1);
}

// Read Original Cucumber JSON
let cucumberData;

try {
  const rawData = fs.readFileSync(inputPath, "utf8");
  cucumberData = JSON.parse(rawData);

  if (!Array.isArray(cucumberData)) {
    throw new Error("Expected the Cucumber report to be an array.");
  }

} catch (error) {
  console.error("Failed to read Cucumber JSON:", error.message);
  process.exit(1);
}

// Status Normalization
function normalizeStatus(status) {
  const supportedStatuses = [
    "passed",
    "failed",
    "skipped",
    "pending",
    "undefined",
    "ambiguous",
  ];

  if (!status) {
    return "unknown";
  }

  return supportedStatuses.includes(status)
    ? status
    : "unknown";
}

// Duration Normalization
function normalizeDuration(duration) {
  if (typeof duration !== "number" || !Number.isFinite(duration)) {
    return null;
  }

  // Cucumber records durations in nanoseconds.
  // Convert nanoseconds to milliseconds.
  return Number((duration / 1_000_000).toFixed(3));
}

// Error Extraction
function normalizeError(result) {
  if (!result) {
    return null;
  }

  const message =
    result.error_message ||
    result.message ||
    null;

  return message;
}

// Scenario Status Aggregation
function determineScenarioStatus(items) {
  const statuses = items.map((item) => item.status);

  const statusPriority = [
    "failed",
    "ambiguous",
    "undefined",
    "pending",
    "unknown",
    "skipped",
    "passed",
  ];

  for (const status of statusPriority) {
    if (statuses.includes(status)) {
      return status;
    }
  }

  return "unknown";
}

// Normalize Features And Scenarios
function normalizeFeature(feature) {
  const scenarios = (feature.elements || []).map(
    (scenario) => normalizeScenario(feature, scenario)
  );

  return {
    uri: feature.uri || null,
    name: feature.name || null,
    keyword: feature.keyword || null,
    line: feature.line ?? null,
    scenarios,
  };
}

function normalizeScenario(feature, scenario) {
  const hooks = [];
  const steps = [];

  for (const item of scenario.steps || []) {

    const isHook =
      item.keyword === "Before" ||
      item.keyword === "After";

    const screenshots = (item.embeddings || [])
      .filter(
        (embedding) =>
          embedding.mime_type?.startsWith("image/") &&
          embedding.data
      )
      .map((embedding) => ({
        mimeType: embedding.mime_type,
        data: embedding.data,
      }));

    const normalizedItem = {
      keyword: item.keyword || null,
      name: item.name || null,
      line: item.line ?? null,
      status: normalizeStatus(item.result?.status),
      durationMs: normalizeDuration(item.result?.duration),
      errorMessage: normalizeError(item.result),
      hidden: item.hidden ?? false,
      screenshots,
    };

    if (isHook) {
      hooks.push(normalizedItem);
    } else {
      steps.push(normalizedItem);
    }
  }

  const allResults = [...hooks, ...steps];

  const totalDurationMs = allResults.reduce(
    (total, item) => total + (item.durationMs || 0),
    0
  );

  const scenarioIdentity = [
    feature.uri || "",
    scenario.name || "",
    scenario.line ?? "",
  ].join("::");

  return {
    identity: scenarioIdentity,
    name: scenario.name || null,
    keyword: scenario.keyword || null,
    type: scenario.type || null,
    line: scenario.line ?? null,

    status: determineScenarioStatus(allResults),

    durationMs: Number(totalDurationMs.toFixed(3)),

    hooks,
    steps,
  };
}

// Build Normalized Result
const normalizedResult = {
  execution: {
    executionId,
    browser,
    generatedAt: new Date().toISOString(),
    sourceFile: reportConfig.files.cucumberJson,
  },

  summary: {
    totalFeatures: cucumberData.length,
    totalScenarios: 0,
    totalSteps: 0,
    totalHooks: 0,
  },

  features: cucumberData.map(normalizeFeature),
};

// Build Execution Summary
for (const feature of normalizedResult.features) {
  for (const scenario of feature.scenarios) {
    normalizedResult.summary.totalScenarios += 1;
    normalizedResult.summary.totalSteps += scenario.steps.length;
    normalizedResult.summary.totalHooks += scenario.hooks.length;
  }
}

// Write Normalized JSON
try {
  fs.writeFileSync(
    outputPath,
    JSON.stringify(normalizedResult, null, 2),
    "utf8"
  );

  console.log("\nNormalized Cucumber results generated.");
  console.log(`Browser: ${browser}`);
  console.log(`Features: ${normalizedResult.summary.totalFeatures}`);
  console.log(`Scenarios: ${normalizedResult.summary.totalScenarios}`);
  console.log(`Steps: ${normalizedResult.summary.totalSteps}`);
  console.log(`Hooks: ${normalizedResult.summary.totalHooks}`);
  console.log(`Output: ${outputPath}`);

} catch (error) {
  console.error(
    "Failed to write normalized results:",
    error.message
  );

  process.exit(1);
}
