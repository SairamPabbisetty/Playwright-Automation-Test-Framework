
const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const { execFile } = require("node:child_process");

const now = new Date();
const pad = (value) => String(value).padStart(2, "0");

const year = String(now.getFullYear());
const monthName = now.toLocaleString("en-US", { month: "long" });
const timestamp =
  `${pad(now.getDate())}-${pad(now.getMonth() + 1)}-${year}-` +
  `${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}`;

const reportDir = path.resolve("reports", year, monthName, timestamp);
fs.mkdirSync(reportDir, { recursive: true });

const env = {
  ...process.env,
  REPORT_DIR: reportDir
};

console.log(`\nCucumber reports: ${reportDir}\n`);

const cucumber = spawnSync(
  process.execPath,
  ["node_modules/@cucumber/cucumber/bin/cucumber.js"],
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
