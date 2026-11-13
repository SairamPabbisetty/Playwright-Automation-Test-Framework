
const fs = require("node:fs");
const path = require("node:path");
const { spawnSync, execFile } = require("node:child_process");
const { randomUUID } = require("node:crypto");
const { getReportConfig } = require("../config/report.config");

const args = process.argv.slice(2);

// Report Configuration
const reportConfig = getReportConfig();

if (
  !reportConfig.generate.cucumberJson &&
  (reportConfig.generate.normalizedJson || reportConfig.generate.html)
) {
  console.error(
    "Invalid report configuration: normalized JSON and HTML reports require Cucumber JSON."
  );
  process.exit(1);
}

// Headless Configuration
const headlessArg = args.find((arg) =>
  arg.startsWith("--headless=")
);

if (headlessArg) {
  const value = headlessArg.split("=")[1];

  if (value !== "true" && value !== "false") {
    console.error(
      "Invalid option. Use --headless=true or --headless=false."
    );
    process.exit(1);
  }

  process.env.HEADLESS = value;
}

// Browser Configuration
const browserArg = args.find((arg) =>
  arg.startsWith("--browser=")
);

const supportedBrowsers = ["chrome", "edge", "all"];

let browserName = "chrome";

if (browserArg) {
  browserName = browserArg.split("=")[1].toLowerCase();

  if (!supportedBrowsers.includes(browserName)) {
    console.error(
      `Invalid browser: ${browserName}. Supported browsers: ${supportedBrowsers.join(", ")}`
    );
    process.exit(1);
  }
}

process.env.BROWSER = browserName;

console.log(`Selected browser: ${browserName}`);

const browsersToRun =
  browserName === "all"
    ? ["chrome", "edge"]
    : [browserName];

console.log(`Browsers to execute: ${browsersToRun.join(", ")}`);

// Selenium Grid Configuration
const gridArg = args.find((arg) =>
  arg.startsWith("--grid=")
);

let gridUrl;

if (gridArg) {
  gridUrl = gridArg.slice("--grid=".length).trim();

  try {
    const parsedUrl = new URL(gridUrl);

    if (!["http:", "https:"].includes(parsedUrl.protocol)) {
      throw new Error("Invalid protocol");
    }
  } catch {
    console.error(
      "Invalid Grid URL. Example: --grid=http://localhost:4444"
    );
    process.exit(1);
  }

  process.env.SELENIUM_REMOTE_URL = gridUrl;

  console.log("Execution mode: Selenium Grid");
  console.log(`Grid URL: ${gridUrl}`);
} else {
  delete process.env.SELENIUM_REMOTE_URL;

  console.log("Execution mode: Local");
}

// Grid Availability Validation
async function validateGrid(url) {
  try {
    const statusUrl = new URL("/status", url);

    const response = await fetch(statusUrl, {
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const result = await response.json();

    if (result.value?.ready !== true) {
      throw new Error("Selenium Grid is not ready");
    }

    console.log("Selenium Grid status: READY");
    return true;
  } catch (error) {
    console.error("\nERROR: Selenium Grid is unavailable!");
    console.error(`The provided Grid URL '${url}' is not reachable.`);
    console.error("Please verify that Docker and Selenium Grid are running.");
    console.error(`Reason: ${error.message}`);
    console.error("\nTest execution aborted.");

    return false;
  }
}

// Cucumber Tag Configuration
const tagArg = args.find((arg) =>
  arg.startsWith("--tag=")
);

let tagExpression;

if (tagArg) {
  tagExpression = tagArg.slice("--tag=".length).trim();

  if (!tagExpression) {
    console.error(
      'Invalid tag option. Example: --tag="@SmokeTest"'
    );
    process.exit(1);
  }
}

// Main Execution
async function main() {
  // Validate Grid before starting browser executions.
  if (gridUrl) {
    const isGridAvailable = await validateGrid(gridUrl);

    if (!isGridAvailable) {
      process.exitCode = 1;
      return;
    }
  }

  // Generate a unique execution ID.
  const now = new Date();

  const pad = (value) => String(value).padStart(2, "0");

  const year = String(now.getFullYear());

  const monthName = now.toLocaleString("en-US", {
    month: "long",
  });

  const timestamp =
    `${pad(now.getDate())}-${pad(now.getMonth() + 1)}-${year}-` +
    `${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}`;

  const executionId = `${timestamp}-${randomUUID().slice(0, 8)}`;

  const reportMonth = `${monthName.slice(0, 3)}${year}`;

  const executionDir = path.resolve(
    "reports",
    reportMonth,
    executionId
  );

  // Create the common execution directory.
  fs.mkdirSync(executionDir, { recursive: true });

  // Create comparison directory only for multi-browser execution.
  let comparisonDir;

  if (browsersToRun.length > 1) {
    comparisonDir = path.join(executionDir, "comparison");

    fs.mkdirSync(comparisonDir, { recursive: true });
  }

  console.log(`\nExecution ID: ${executionId}`);
  console.log(`Execution directory: ${executionDir}`);

  if (comparisonDir) {
    console.log(`Comparison directory: ${comparisonDir}`);
  }

  console.log("\nReport configuration:");
  console.log(`Cucumber JSON: ${reportConfig.generate.cucumberJson}`);
  console.log(`Normalized JSON: ${reportConfig.generate.normalizedJson}`);
  console.log(`HTML report: ${reportConfig.generate.html}`);
  console.log(`Open HTML: ${reportConfig.behaviour.openHtml}`);

  let overallExitCode = 0;

  // Sequential Browser Execution
  for (const currentBrowser of browsersToRun) {
    console.log("\n========================================");
    console.log(`Starting ${currentBrowser.toUpperCase()} execution`);
    console.log("========================================\n");

    // Create a separate report directory for this browser.
    const browserReportDir = path.join(
      executionDir,
      currentBrowser
    );

    fs.mkdirSync(browserReportDir, { recursive: true });

    // Pass browser-specific configuration to child processes.
    const env = {
      ...process.env,
      BROWSER: currentBrowser,
      REPORT_DIR: browserReportDir,
      EXECUTION_ID: executionId,
    };

    console.log(`Cucumber reports: ${browserReportDir}\n`);

    // Prepare Cucumber command.
    const cucumberArgs = [
      "node_modules/@cucumber/cucumber/bin/cucumber.js",
    ];

    if (tagExpression) {
      cucumberArgs.push("--tags", tagExpression);
    }

    // Execute Cucumber.
    const cucumber = spawnSync(
      process.execPath,
      cucumberArgs,
      {
        stdio: "inherit",
        env,
      }
    );

    let browserExitCode = 0;

    if (cucumber.error) {
      console.error(
        `Failed to start Cucumber for ${currentBrowser}:`,
        cucumber.error.message
      );

      browserExitCode = 1;
    } else if (cucumber.status !== 0) {
      console.error(
        `${currentBrowser} Cucumber execution failed.`
      );

      browserExitCode = 1;
    }

    // Report Paths
    const jsonPath = path.join(
      browserReportDir,
      reportConfig.files.cucumberJson
    );

    const normalizedJsonPath = path.join(
      browserReportDir,
      reportConfig.files.normalizedJson
    );

    const htmlPath = path.join(
      browserReportDir,
      reportConfig.files.html
    );

    // JSON Validation
    let jsonAvailable = false;
    let normalizationExitCode = 0;
    let reportExitCode = 0;

    if (reportConfig.generate.cucumberJson) {
      if (fs.existsSync(jsonPath)) {
        jsonAvailable = true;
        console.log(`Cucumber JSON retained: ${jsonPath}`);
      } else {
        console.error(
          `Cucumber JSON report was not created for ${currentBrowser}.`
        );

        reportExitCode = 1;
      }
    }

    // Normalize Cucumber Results
    if (reportConfig.generate.normalizedJson && jsonAvailable) {
      const normalizer = spawnSync(
        process.execPath,
        ["scripts/normalize-cucumber-results.js"],
        {
          stdio: "inherit",
          env,
        }
      );

      if (normalizer.error || normalizer.status !== 0) {
        console.error(
          `Failed to normalize Cucumber results for ${currentBrowser}.`
        );

        normalizationExitCode = 1;
      } else if (fs.existsSync(normalizedJsonPath)) {
        console.log(
          `Normalized JSON generated: ${normalizedJsonPath}`
        );
      } else {
        console.error(
          `Normalized JSON file was not created: ${normalizedJsonPath}`
        );

        normalizationExitCode = 1;
      }
    } else if (!reportConfig.generate.normalizedJson) {
      console.log("Normalized JSON generation is disabled.");
    }

    // HTML Report Generation
    if (reportConfig.generate.html && jsonAvailable) {
      const report = spawnSync(
        process.execPath,
        ["scripts/generate-cucumber-report.js"],
        {
          stdio: "inherit",
          env,
        }
      );

      if (report.error || report.status !== 0) {
        console.error(
          `Failed to generate the HTML report for ${currentBrowser}.`
        );

        reportExitCode = 1;
      } else if (fs.existsSync(htmlPath)) {
        console.log(
          `HTML report generated for ${currentBrowser}: ${htmlPath}`
        );

        // Open the HTML report only when configured.
        if (reportConfig.behaviour.openHtml) {
          execFile(
            "cmd",
            ["/c", "start", "", htmlPath],
            (error) => {
              if (error) {
                console.error(
                  "Could not open the HTML report:",
                  error.message
                );

                console.log(`Open it manually: ${htmlPath}`);
              }
            }
          );
        }
      } else {
        console.error(
          `HTML report file was not created: ${htmlPath}`
        );

        reportExitCode = 1;
      }
    } else if (!reportConfig.generate.html) {
      console.log("HTML report generation is disabled.");
    }

    // Browser Execution Status
    browserExitCode =
      browserExitCode === 0 &&
      reportExitCode === 0 &&
      normalizationExitCode === 0
        ? 0
        : 1;

    if (browserExitCode !== 0) {
      overallExitCode = 1;
    }

    console.log(
      `\n${currentBrowser.toUpperCase()} execution exit code: ${browserExitCode}`
    );
  }
  
  // Browser Comparison
  if (browsersToRun.length > 1) {
    console.log("\n========================================");
    console.log("BROWSER COMPARISON");
    console.log("========================================");

    const chromeResultsPath = path.join(
      executionDir,
      "chrome",
      reportConfig.files.normalizedJson
    );

    const edgeResultsPath = path.join(
      executionDir,
      "edge",
      reportConfig.files.normalizedJson
    );

    // Validate normalized results before comparison.
    if (
      !fs.existsSync(chromeResultsPath) ||
      !fs.existsSync(edgeResultsPath)
    ) {
      console.error(
        "Browser comparison aborted: normalized results are missing."
      );

      overallExitCode = 1;
    } else {
      // Generate Aggregate Comparison JSON.
      const comparison = spawnSync(
        process.execPath,
        [
          "scripts/compare-browser-results.js",
          executionDir,
        ],
        {
          stdio: ["ignore", "ignore", "inherit"],
          env: process.env,
        }
      );

      if (comparison.error || comparison.status !== 0) {
        console.error("Browser comparison failed.");

        if (comparison.error) {
          console.error(comparison.error.message);
        }

        overallExitCode = 1;
      } else {
        const comparisonJsonPath = path.join(
          comparisonDir,
          "comparison-results.json"
        );

        if (!fs.existsSync(comparisonJsonPath)) {
          console.error(
            "Comparison JSON was not generated."
          );

          overallExitCode = 1;
        } else {
          console.log(
            `Comparison JSON generated: ${comparisonJsonPath}`
          );

          // Generate Browser Comparison HTML.
          const comparisonReport = spawnSync(
            process.execPath,
            [
              "scripts/generate-browser-comparison-report.js",
              executionDir,
            ],
            {
              stdio: ["ignore", "ignore", "inherit"],
              env: process.env,
            }
          );

          if (
            comparisonReport.error ||
            comparisonReport.status !== 0
          ) {
            console.error(
              "Browser comparison HTML generation failed."
            );

            if (comparisonReport.error) {
              console.error(comparisonReport.error.message);
            }

            overallExitCode = 1;
          } else {
            const comparisonHtmlPath = path.join(
              comparisonDir,
              "comparison-report.html"
            );

            if (fs.existsSync(comparisonHtmlPath)) {
              console.log(
                `Comparison HTML generated: ${comparisonHtmlPath}`
              );

              // Open Comparison HTML when configured.
              if (reportConfig.behaviour.openHtml) {
                execFile(
                  "cmd",
                  ["/c", "start", "", comparisonHtmlPath],
                  (error) => {
                    if (error) {
                      console.error(
                        "Could not open the comparison HTML:",
                        error.message
                      );

                      console.log(
                        `Open it manually: ${comparisonHtmlPath}`
                      );
                    }
                  }
                );
              }
            } else {
              console.error(
                "Comparison HTML file was not created."
              );

              overallExitCode = 1;
            }
          }
        }
      }
    }
  }

  // Final Execution Status
  process.exitCode = overallExitCode;

  console.log("\n========================================");
  console.log("BROWSER EXECUTION SUMMARY");
  console.log("========================================");

  console.log(`Browsers executed: ${browsersToRun.join(", ")}`);
  console.log(`Overall exit code: ${overallExitCode}`);

  console.log(
    overallExitCode === 0
      ? "All browser executions completed successfully."
      : "One or more browser executions failed."
  );
}

// Error Handling
main().catch((error) => {
  console.error("Test runner failed:", error);
  process.exitCode = 1;
});
