
const fs = require("node:fs");
const path = require("node:path");

// 1. Get Execution Directory
function getExecutionDirectory() {
  const executionPath = process.argv[2];

  if (!executionPath) {
    throw new Error(
      "Execution directory is required.\n" +
      "Usage: node scripts/compare-browser-results.js <execution-directory>"
    );
  }

  const executionDir = path.resolve(executionPath);

  if (!fs.existsSync(executionDir)) {
    throw new Error(`Execution directory not found: ${executionDir}`);
  }

  if (!fs.statSync(executionDir).isDirectory()) {
    throw new Error(`Execution path is not a directory: ${executionDir}`);
  }

  return executionDir;
}

// 2. Load Normalized Browser Results
function loadBrowserResults(executionDir, browser) {
  const reportPath = path.join(
    executionDir,
    browser,
    "normalized-results.json"
  );

  if (!fs.existsSync(reportPath)) {
    throw new Error(
      `Normalized results not found for ${browser}: ${reportPath}`
    );
  }

  let results;

  try {
    results = JSON.parse(fs.readFileSync(reportPath, "utf8"));
  } catch (error) {
    throw new Error(
      `Invalid JSON in ${browser} report: ${error.message}`
    );
  }

  if (
    !results.execution ||
    !results.summary ||
    !Array.isArray(results.features)
  ) {
    throw new Error(`Invalid normalized report structure for ${browser}.`);
  }

  if (results.execution.browser !== browser) {
    throw new Error(
      `Browser mismatch: expected ${browser}, found ${results.execution.browser}`
    );
  }

  return results;
}

// 3. Validate Execution Consistency
function validateExecution(chromeResults, edgeResults) {
  const chromeExecutionId = chromeResults.execution.executionId;
  const edgeExecutionId = edgeResults.execution.executionId;

  if (
    !chromeExecutionId ||
    !edgeExecutionId ||
    chromeExecutionId !== edgeExecutionId
  ) {
    throw new Error(
      "Chrome and Edge reports do not belong to the same execution."
    );
  }
}

// 4. Main Execution
function main() {
  const executionDir = getExecutionDirectory();

  console.log("Execution directory:", executionDir);

  const chromeResults = loadBrowserResults(executionDir, "chrome");
  console.log("Chrome normalized results loaded successfully.");

  const edgeResults = loadBrowserResults(executionDir, "edge");
  console.log("Edge normalized results loaded successfully.");

  validateExecution(chromeResults, edgeResults);
  console.log("Execution consistency validated.");

  const comparison = compareFeatures(chromeResults, edgeResults);

  console.log("\nFEATURE AND SCENARIO COMPARISON");
  console.log("--------------------------------");
  console.log(
    "Matched features:",
    comparison.matchedFeatures.length
  );
  console.log(
    "Features missing in Edge:",
    comparison.missingInEdge.length
  );
  console.log(
    "Features missing in Chrome:",
    comparison.missingInChrome.length
  );

  for (const feature of comparison.matchedFeatures) {
    console.log(`\nFeature: ${feature.name}`);
    console.log(
      "Matched scenarios:",
      feature.scenarios.length
    );
    console.log(
      "Scenarios missing in Edge:",
      feature.missingInEdge.length
    );
    console.log(
      "Scenarios missing in Chrome:",
      feature.missingInChrome.length
    );
  }

  const aggregateResults = buildComparisonResults(
    chromeResults,
    edgeResults,
    comparison
  );

  // Save Comparison Results
  const comparisonDir = path.join(executionDir, "comparison");

  fs.mkdirSync(comparisonDir, { recursive: true });

  const comparisonReportPath = path.join(
    comparisonDir,
    "comparison-results.json"
  );

  fs.writeFileSync(
    comparisonReportPath,
    JSON.stringify(aggregateResults, null, 2),
    "utf8"
  );

  console.log("\nComparison results saved successfully:");
  console.log(comparisonReportPath);

  console.log("\nAGGREGATE COMPARISON MODEL");
  console.log("--------------------------");
  console.log(
    "\nExecution:",
    JSON.stringify(aggregateResults.execution, null, 2)
  );
  console.log(
    "\nSummary:",
    JSON.stringify(aggregateResults.summary, null, 2)
  );
  console.log(
    "\nMatched features:",
    aggregateResults.features.length
  );
  console.log(
    "Unmatched features:",
    aggregateResults.unmatchedFeatures.length
  );
  console.log(
    "Unmatched scenarios:",
    aggregateResults.unmatchedScenarios.length
  );

  for (const feature of aggregateResults.features) {
    console.log(`\nFeature: ${feature.name}`);
    console.log("Scenarios:", feature.scenarios.length);

    for (const scenario of feature.scenarios) {
      console.log(`Scenario: ${scenario.name}`);
      console.log("Matched steps:", scenario.steps.matched.length);
      console.log("Matched hooks:", scenario.hooks.matched.length);
    }
  }

  console.log("\nINDIVIDUAL STEP COMPARISON");
  console.log("--------------------------");

  let totalMatchedSteps = 0;
  let totalMissingInEdge = 0;
  let totalMissingInChrome = 0;
  let totalStepStatusMismatches = 0;

  for (const scenario of comparison.matchedFeatures.flatMap(
    (feature) => feature.scenarios
  )) {
    const stepComparison = compareSteps(
      scenario.chrome,
      scenario.edge
    );

    totalMatchedSteps += stepComparison.matchedSteps.length;
    totalMissingInEdge += stepComparison.missingInEdge.length;
    totalMissingInChrome += stepComparison.missingInChrome.length;

    console.log(`\nScenario: ${scenario.name}`);

    for (const step of stepComparison.matchedSteps) {
      if (step.comparison.functionalStatus === "status_mismatch") {
        totalStepStatusMismatches++;
      }

      console.log(`\n${step.keyword}${step.name}`);
      console.log(
        `Chrome: ${step.chrome.status} (${step.chrome.durationMs} ms)`
      );
      console.log(
        `Edge: ${step.edge.status} (${step.edge.durationMs} ms)`
      );
      console.log(
        `Duration difference: ${step.comparison.durationDifferenceMs} ms`
      );
      console.log(
        `Duration difference (%): ${step.comparison.durationDifferencePercentage}%`
      );
      console.log(
        `Functional result: ${step.comparison.functionalStatus}`
      );
    }
  }

  console.log("\nHOOK COMPARISON");
  console.log("---------------");

  let totalMatchedHooks = 0;
  let totalMissingHooksInEdge = 0;
  let totalMissingHooksInChrome = 0;
  let totalHookStatusMismatches = 0;

  for (const scenario of comparison.matchedFeatures.flatMap(
    (feature) => feature.scenarios
  )) {
    const hookComparison = compareHooks(
      scenario.chrome,
      scenario.edge
    );

    totalMatchedHooks += hookComparison.matchedHooks.length;
    totalMissingHooksInEdge += hookComparison.missingInEdge.length;
    totalMissingHooksInChrome += hookComparison.missingInChrome.length;

    console.log(`\nScenario: ${scenario.name}`);

    for (const hook of hookComparison.matchedHooks) {
      if (hook.comparison.functionalStatus === "status_mismatch") {
        totalHookStatusMismatches++;
      }

      console.log(`\n${hook.keyword} Hook (${hook.occurrence})`);
      console.log(
        `Chrome: ${hook.chrome.status} (${hook.chrome.durationMs} ms)`
      );
      console.log(
        `Edge: ${hook.edge.status} (${hook.edge.durationMs} ms)`
      );
      console.log(
        `Duration difference: ${hook.comparison.durationDifferenceMs} ms`
      );
      console.log(
        `Functional result: ${hook.comparison.functionalStatus}`
      );
    }
  }

  console.log("\nHOOK COMPARISON SUMMARY");
  console.log("-----------------------");
  console.log("Matched hooks:", totalMatchedHooks);
  console.log("Missing in Edge:", totalMissingHooksInEdge);
  console.log("Missing in Chrome:", totalMissingHooksInChrome);
  console.log("Status mismatches:", totalHookStatusMismatches);

  console.log("\nSTEP COMPARISON SUMMARY");
  console.log("-----------------------");
  console.log("Matched steps:", totalMatchedSteps);
  console.log("Missing in Edge:", totalMissingInEdge);
  console.log("Missing in Chrome:", totalMissingInChrome);
  console.log("Status mismatches:", totalStepStatusMismatches);

  const scenarioComparisons = compareScenarios(
    comparison.matchedFeatures
  );

  console.log("\nSCENARIO RESULT COMPARISON");
  console.log("--------------------------");

  for (const scenario of scenarioComparisons) {
    console.log(`\nScenario: ${scenario.name}`);

    console.log(
      `Chrome: ${scenario.chrome.status} (${scenario.chrome.durationMs} ms)`
    );

    console.log(
      `Edge: ${scenario.edge.status} (${scenario.edge.durationMs} ms)`
    );

    console.log(
      "Functional result:",
      scenario.comparison.functionalStatus
    );

    console.log(
      "Duration difference:",
      `${scenario.comparison.durationDifferenceMs} ms`
    );

    console.log(
      "Duration difference (%):",
      `${scenario.comparison.durationDifferencePercentage}%`
    );
  }

  console.log("\nInput validation completed successfully.");
}

try {
  main();
} catch (error) {
  console.error("\nComparison input validation failed:");
  console.error(error.message);
  process.exitCode = 1;
}

// 5. Match Features and Scenarios
function compareFeatures(chromeResults, edgeResults) {
  const chromeFeatures = chromeResults.features;
  const edgeFeatures = edgeResults.features;

  const edgeFeatureMap = new Map(
    edgeFeatures.map((feature) => [feature.uri, feature])
  );

  const matchedFeatures = [];
  const missingInEdge = [];
  const missingInChrome = [];

  for (const chromeFeature of chromeFeatures) {
    const edgeFeature = edgeFeatureMap.get(chromeFeature.uri);

    if (!edgeFeature) {
      missingInEdge.push(chromeFeature.uri);
      continue;
    }

    const edgeScenarioMap = new Map(
      edgeFeature.scenarios.map((scenario) => [
        scenario.identity,
        scenario
      ])
    );

    const matchedScenarios = [];
    const missingScenariosInEdge = [];

    for (const chromeScenario of chromeFeature.scenarios) {
      const edgeScenario = edgeScenarioMap.get(chromeScenario.identity);

      if (!edgeScenario) {
        missingScenariosInEdge.push(chromeScenario.identity);
        continue;
      }

      matchedScenarios.push({
        identity: chromeScenario.identity,
        name: chromeScenario.name,
        chrome: chromeScenario,
        edge: edgeScenario
      });
    }

    const chromeScenarioMap = new Map(
      chromeFeature.scenarios.map((scenario) => [
        scenario.identity,
        scenario
      ])
    );

    const missingScenariosInChrome = edgeFeature.scenarios
      .filter((scenario) => !chromeScenarioMap.has(scenario.identity))
      .map((scenario) => scenario.identity);

    matchedFeatures.push({
      uri: chromeFeature.uri,
      name: chromeFeature.name,
      scenarios: matchedScenarios,
      missingInEdge: missingScenariosInEdge,
      missingInChrome: missingScenariosInChrome
    });
  }

  const chromeFeatureUris = new Set(
    chromeFeatures.map((feature) => feature.uri)
  );

  for (const edgeFeature of edgeFeatures) {
    if (!chromeFeatureUris.has(edgeFeature.uri)) {
      missingInChrome.push(edgeFeature.uri);
    }
  }

  return {
    matchedFeatures,
    missingInEdge,
    missingInChrome
  };
}

// 6. Compare Scenario Results
function compareScenarios(matchedFeatures) {
  const scenarioComparisons = [];

  for (const feature of matchedFeatures) {
    for (const scenario of feature.scenarios) {
      const chrome = scenario.chrome;
      const edge = scenario.edge;

      const durationDifferenceMs =
        edge.durationMs - chrome.durationMs;

      const durationDifferencePercentage =
        chrome.durationMs > 0
          ? (durationDifferenceMs / chrome.durationMs) * 100
          : null;

      let functionalStatus;

      if (
        chrome.status === "passed" &&
        edge.status === "passed"
      ) {
        functionalStatus = "matched";
      } else if (
        chrome.status === "failed" &&
        edge.status === "failed"
      ) {
        functionalStatus = "failed_on_both";
      } else if (chrome.status !== edge.status) {
        functionalStatus = "status_mismatch";
      } else {
        functionalStatus = "same_status";
      }

      scenarioComparisons.push({
        feature: feature.name,
        identity: scenario.identity,
        name: scenario.name,

        chrome: {
          status: chrome.status,
          durationMs: chrome.durationMs,
          errorMessage: chrome.errorMessage ?? null
        },

        edge: {
          status: edge.status,
          durationMs: edge.durationMs,
          errorMessage: edge.errorMessage ?? null
        },

        comparison: {
          functionalStatus,
          durationDifferenceMs: Number(
            durationDifferenceMs.toFixed(3)
          ),
          durationDifferencePercentage:
            durationDifferencePercentage === null
              ? null
              : Number(durationDifferencePercentage.toFixed(2))
        }
      });
    }
  }

  return scenarioComparisons;
}

// 7. Compare Individual Steps
function compareSteps(chromeScenario, edgeScenario) {
  const edgeStepMap = new Map(
    edgeScenario.steps.map((step) => [
      `${step.keyword}::${step.name}::${step.line}`,
      step
    ])
  );

  const matchedSteps = [];
  const missingInEdge = [];
  const missingInChrome = [];

  for (const chromeStep of chromeScenario.steps) {
    const stepIdentity =
      `${chromeStep.keyword}::${chromeStep.name}::${chromeStep.line}`;

    const edgeStep = edgeStepMap.get(stepIdentity);

    if (!edgeStep) {
      missingInEdge.push(chromeStep);
      continue;
    }

    const durationDifferenceMs =
      edgeStep.durationMs - chromeStep.durationMs;

    const durationDifferencePercentage =
      chromeStep.durationMs > 0
        ? (durationDifferenceMs / chromeStep.durationMs) * 100
        : null;

    matchedSteps.push({
      identity: stepIdentity,
      keyword: chromeStep.keyword,
      name: chromeStep.name,
      line: chromeStep.line,

      chrome: {
        status: chromeStep.status,
        durationMs: chromeStep.durationMs,
        errorMessage: chromeStep.errorMessage ?? null,
        screenshots: chromeStep.screenshots ?? []
      },

      edge: {
        status: edgeStep.status,
        durationMs: edgeStep.durationMs,
        errorMessage: edgeStep.errorMessage ?? null,
        screenshots: edgeStep.screenshots ?? []
      },

      comparison: {
        functionalStatus:
          chromeStep.status === edgeStep.status
            ? "matched"
            : "status_mismatch",

        durationDifferenceMs: Number(
          durationDifferenceMs.toFixed(3)
        ),

        durationDifferencePercentage:
          durationDifferencePercentage === null
            ? null
            : Number(durationDifferencePercentage.toFixed(2))
      }
    });
  }

  const chromeStepIdentities = new Set(
    chromeScenario.steps.map(
      (step) => `${step.keyword}::${step.name}::${step.line}`
    )
  );

  for (const edgeStep of edgeScenario.steps) {
    const stepIdentity =
      `${edgeStep.keyword}::${edgeStep.name}::${edgeStep.line}`;

    if (!chromeStepIdentities.has(stepIdentity)) {
      missingInChrome.push(edgeStep);
    }
  }

  return {
    matchedSteps,
    missingInEdge,
    missingInChrome
  };
}

// 8. Compare Scenario Hooks
function compareHooks(chromeScenario, edgeScenario) {
  const hookTypes = ["Before", "After"];

  const matchedHooks = [];
  const missingInEdge = [];
  const missingInChrome = [];

  for (const hookType of hookTypes) {
    const chromeHooks = chromeScenario.hooks.filter(
      (hook) => hook.keyword === hookType
    );

    const edgeHooks = edgeScenario.hooks.filter(
      (hook) => hook.keyword === hookType
    );

    const maxCount = Math.max(
      chromeHooks.length,
      edgeHooks.length
    );

    for (let index = 0; index < maxCount; index++) {
      const chromeHook = chromeHooks[index];
      const edgeHook = edgeHooks[index];

      if (!chromeHook) {
        missingInChrome.push(edgeHook);
        continue;
      }

      if (!edgeHook) {
        missingInEdge.push(chromeHook);
        continue;
      }

      const durationDifferenceMs =
        edgeHook.durationMs - chromeHook.durationMs;

      const durationDifferencePercentage =
        chromeHook.durationMs > 0
          ? (durationDifferenceMs / chromeHook.durationMs) * 100
          : null;

      matchedHooks.push({
        keyword: hookType,
        occurrence: index + 1,

        chrome: {
          status: chromeHook.status,
          durationMs: chromeHook.durationMs,
          errorMessage: chromeHook.errorMessage ?? null
        },

        edge: {
          status: edgeHook.status,
          durationMs: edgeHook.durationMs,
          errorMessage: edgeHook.errorMessage ?? null
        },

        comparison: {
          functionalStatus:
            chromeHook.status === edgeHook.status
              ? "matched"
              : "status_mismatch",

          durationDifferenceMs: Number(
            durationDifferenceMs.toFixed(3)
          ),

          durationDifferencePercentage:
            durationDifferencePercentage === null
              ? null
              : Number(durationDifferencePercentage.toFixed(2))
        }
      });
    }
  }

  return {
    matchedHooks,
    missingInEdge,
    missingInChrome
  };
}

// 9. Build Aggregate Comparison Results
function buildComparisonResults(
  chromeResults,
  edgeResults,
  featureComparison
) {
  const features = [];

  let totalMatchedScenarios = 0;
  let totalMissingScenariosInEdge = 0;
  let totalMissingScenariosInChrome = 0;

  let totalMatchedSteps = 0;
  let totalMissingStepsInEdge = 0;
  let totalMissingStepsInChrome = 0;
  let totalStepStatusMismatches = 0;

  let totalMatchedHooks = 0;
  let totalMissingHooksInEdge = 0;
  let totalMissingHooksInChrome = 0;
  let totalHookStatusMismatches = 0;

  let totalScenarioStatusMismatches = 0;
  let totalScenariosPassedOnBoth = 0;
  let totalScenariosFailedOnBoth = 0;

  let totalChromeScenarioDurationMs = 0;
  let totalEdgeScenarioDurationMs = 0;

  // Process Matched Features
  for (const feature of featureComparison.matchedFeatures) {
    const scenarios = [];

    totalMissingScenariosInEdge += feature.missingInEdge.length;
    totalMissingScenariosInChrome += feature.missingInChrome.length;

    for (const scenario of feature.scenarios) {
      const stepComparison = compareSteps(
        scenario.chrome,
        scenario.edge
      );

      const hookComparison = compareHooks(
        scenario.chrome,
        scenario.edge
      );

      const scenarioComparison = compareScenarios([
        {
          ...feature,
          scenarios: [scenario]
        }
      ])[0];

      if (
        scenarioComparison.comparison.functionalStatus === "status_mismatch"
      ) {
        totalScenarioStatusMismatches++;
      }

      if (
        scenarioComparison.comparison.functionalStatus === "matched"
      ) {
        totalScenariosPassedOnBoth++;
      }

      if (
        scenarioComparison.comparison.functionalStatus === "failed_on_both"
      ) {
        totalScenariosFailedOnBoth++;
      }

      totalChromeScenarioDurationMs += scenario.chrome.durationMs;
      totalEdgeScenarioDurationMs += scenario.edge.durationMs;

      totalMatchedScenarios++;

      totalMatchedSteps += stepComparison.matchedSteps.length;
      totalMissingStepsInEdge += stepComparison.missingInEdge.length;
      totalMissingStepsInChrome += stepComparison.missingInChrome.length;

      totalStepStatusMismatches +=
        stepComparison.matchedSteps.filter(
          (step) =>
            step.comparison.functionalStatus === "status_mismatch"
        ).length;

      totalMatchedHooks += hookComparison.matchedHooks.length;
      totalMissingHooksInEdge += hookComparison.missingInEdge.length;
      totalMissingHooksInChrome += hookComparison.missingInChrome.length;

      totalHookStatusMismatches +=
        hookComparison.matchedHooks.filter(
          (hook) =>
            hook.comparison.functionalStatus === "status_mismatch"
        ).length;

      scenarios.push({
        identity: scenario.identity,
        name: scenario.name,

        scenarioComparison,

        steps: {
          matched: stepComparison.matchedSteps,
          missingInEdge: stepComparison.missingInEdge,
          missingInChrome: stepComparison.missingInChrome
        },

        hooks: {
          matched: hookComparison.matchedHooks,
          missingInEdge: hookComparison.missingInEdge,
          missingInChrome: hookComparison.missingInChrome
        }
      });
    }

    features.push({
      uri: feature.uri,
      name: feature.name,
      status: "matched",
      scenarios
    });
  }

  // Preserve Unmatched Features
  const chromeFeatureMap = new Map(
    chromeResults.features.map(
      (feature) => [feature.uri, feature]
    )
  );

  const edgeFeatureMap = new Map(
    edgeResults.features.map(
      (feature) => [feature.uri, feature]
    )
  );

  const unmatchedFeatures = [];

  for (const uri of featureComparison.missingInEdge) {
    unmatchedFeatures.push({
      uri,
      status: "missing_in_edge",
      chrome: chromeFeatureMap.get(uri),
      edge: null
    });
  }

  for (const uri of featureComparison.missingInChrome) {
    unmatchedFeatures.push({
      uri,
      status: "missing_in_chrome",
      chrome: null,
      edge: edgeFeatureMap.get(uri)
    });
  }

  // Preserve Unmatched Scenarios
  const unmatchedScenarios = [];

  for (const feature of featureComparison.matchedFeatures) {
    const chromeFeature = chromeFeatureMap.get(feature.uri);
    const edgeFeature = edgeFeatureMap.get(feature.uri);

    for (const identity of feature.missingInEdge) {
      const scenario = chromeFeature.scenarios.find(
        (item) => item.identity === identity
      );

      unmatchedScenarios.push({
        identity,
        status: "missing_in_edge",
        chrome: scenario,
        edge: null
      });
    }

    for (const identity of feature.missingInChrome) {
      const scenario = edgeFeature.scenarios.find(
        (item) => item.identity === identity
      );

      unmatchedScenarios.push({
        identity,
        status: "missing_in_chrome",
        chrome: null,
        edge: scenario
      });
    }
  }

  const totalScenarioDurationDifferenceMs =
    totalEdgeScenarioDurationMs - totalChromeScenarioDurationMs;

  const totalScenarioDurationDifferencePercentage =
    totalChromeScenarioDurationMs > 0
      ? (
        totalScenarioDurationDifferenceMs /
        totalChromeScenarioDurationMs
      ) * 100
      : null;

  // Build Final Result
  return {
    execution: {
      executionId: chromeResults.execution.executionId,
      browsers: ["chrome", "edge"],
      generatedAt: new Date().toISOString()
    },

    summary: {
      features: {
        chrome: chromeResults.summary.totalFeatures,
        edge: edgeResults.summary.totalFeatures,
        matched: featureComparison.matchedFeatures.length,
        missingInEdge: featureComparison.missingInEdge.length,
        missingInChrome: featureComparison.missingInChrome.length
      },

      performance: {
        durationUnit: "milliseconds",
        durationSource: "normalized scenario duration",
        matchedScenarioDuration: {
          chrome: Number(totalChromeScenarioDurationMs.toFixed(3)),
          edge: Number(totalEdgeScenarioDurationMs.toFixed(3)),
          differenceMs: Number(
            totalScenarioDurationDifferenceMs.toFixed(3)
          ),
          differencePercentage:
            totalScenarioDurationDifferencePercentage === null
              ? null
              : Number(
                totalScenarioDurationDifferencePercentage.toFixed(2)
              )
        }
      },

      scenarios: {
        matched: totalMatchedScenarios,
        missingInEdge: totalMissingScenariosInEdge,
        missingInChrome: totalMissingScenariosInChrome
      },

      scenarioResults: {
        passedOnBoth: totalScenariosPassedOnBoth,
        failedOnBoth: totalScenariosFailedOnBoth,
        statusMismatches: totalScenarioStatusMismatches
      },

      steps: {
        matched: totalMatchedSteps,
        missingInEdge: totalMissingStepsInEdge,
        missingInChrome: totalMissingStepsInChrome,
        statusMismatches: totalStepStatusMismatches
      },

      hooks: {
        matched: totalMatchedHooks,
        missingInEdge: totalMissingHooksInEdge,
        missingInChrome: totalMissingHooksInChrome,
        statusMismatches: totalHookStatusMismatches
      },

      functionalComparison: {
        totalStatusMismatches:
          totalScenarioStatusMismatches +
          totalStepStatusMismatches +
          totalHookStatusMismatches
      }
    },

    features,
    unmatchedFeatures,
    unmatchedScenarios
  };
}
