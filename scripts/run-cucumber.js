
const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const { execFile } = require("node:child_process");

const args = process.argv.slice(2);

const headlessArg = args.find((arg) =>
  arg.startsWith("--headless=")
);

if (headlessArg) {
  const value = headlessArg.split("=")[1];

  if (value !== "true" && value !== "false") {
    console.error("Invalid option. Use --headless=true or --headless=false.");
    process.exit(1);
  }

  process.env.HEADLESS = value;
}

const browserArg = args.find((arg) =>
  arg.startsWith("--browser=")
);

const supportedBrowsers = ["chrome", "edge"];

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
    console.error("Invalid Grid URL. Example: --grid=http://localhost:4444");
    process.exit(1);
  }

  process.env.SELENIUM_REMOTE_URL = gridUrl;

  console.log(`Execution mode: Selenium Grid`);
  console.log(`Grid URL: ${gridUrl}`);
} else {
  delete process.env.SELENIUM_REMOTE_URL;

  console.log("Execution mode: Local");
}


async function validateGrid(gridUrl) {
  try {
    const statusUrl = new URL("/status", gridUrl);

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
    console.error(`The provided Grid URL '${gridUrl}' is not reachable.`);
    console.error("Please verify that Docker and Selenium Grid are running.");
    console.error("\nTest execution aborted.");

    return false;
  }
}


const tagArg = args.find((arg) => arg.startsWith("--tag="));

let tagExpression;

if (tagArg) {
  tagExpression = tagArg.slice("--tag=".length).trim();

  if (!tagExpression) {
    console.error('Invalid tag option. Example: --tag="@SmokeTest"');
    process.exit(1);
  }
}

async function main() {
  if (gridUrl) {
    const isGridAvailable = await validateGrid(gridUrl);

    if (!isGridAvailable) {
      process.exitCode = 1;
      return;
    }
  }

  const now = new Date();
  const pad = (value) => String(value).padStart(2, "0");

  const year = String(now.getFullYear());
  const monthName = now.toLocaleString("en-US", { month: "long" });
  const timestamp =
    `${pad(now.getDate())}-${pad(now.getMonth() + 1)}-${year}-` +
    `${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}`;

  const reportMonth = `${monthName.slice(0, 3)}${year}`;
  const reportDir = path.resolve("reports", reportMonth, timestamp);
  fs.mkdirSync(reportDir, { recursive: true });

  const env = {
    ...process.env,
    REPORT_DIR: reportDir,
  };

  console.log(`\nCucumber reports: ${reportDir}\n`);

  const cucumberArgs = [
    "node_modules/@cucumber/cucumber/bin/cucumber.js",
  ];

  if (tagExpression) {
    cucumberArgs.push("--tags", tagExpression);
  }

  const cucumber = spawnSync(
    process.execPath,
    cucumberArgs,
    { stdio: "inherit", env }
  );

  if (cucumber.error) {
    console.error("Failed to start Cucumber:", cucumber.error);
    process.exit(1);
  }

  let reportExitCode = 0;
  const jsonPath = path.join(reportDir, "cucumber-report.json");

  if (fs.existsSync(jsonPath)) {
    const report = spawnSync(
      process.execPath,
      ["scripts/generate-cucumber-report.js"],
      { stdio: "inherit", env }
    );

    if (report.error || report.status !== 0) {
      console.error("Failed to generate the HTML report.");
      reportExitCode = 1;
    } else {
      fs.unlinkSync(jsonPath);
      console.log("Temporary JSON report removed.");

      const htmlPath = path.join(reportDir, "report.html");

      if (fs.existsSync(htmlPath)) {
        console.log("Opening HTML report in your default browser...");

        execFile("cmd", ["/c", "start", "", htmlPath], (error) => {
          if (error) {
            console.error("Could not open the HTML report:", error.message);
            console.log(`Open it manually: ${htmlPath}`);
          }
        });
      }
    }
  } else {
    console.error("Cucumber JSON report was not created.");
    reportExitCode = 1;
  }

  process.exitCode =
    cucumber.status === 0 && reportExitCode === 0 ? 0 : 1;
}

main().catch((error) => {
  console.error("Test runner failed:", error);
  process.exitCode = 1;
});