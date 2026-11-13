
const path = require("node:path");
const { getReportConfig } = require("./config/report.config");

// Load Report Configuration
const reportConfig = getReportConfig();

// Build Cucumber Formatters
const formatters = ["pretty"];

if (reportConfig.generate.cucumberJson) {
  const jsonPath = path.join(
    reportConfig.reportDir,
    reportConfig.files.cucumberJson
  );

  formatters.push(
    `json:${path.relative(process.cwd(), jsonPath)}`
  );
}

// Cucumber Configuration
module.exports = {
  default: {
    paths: ["features/**/*.feature"],

    requireModule: ["ts-node/register"],

    require: [
      "src/support/world.ts",
      "src/support/hooks.ts",
      "src/step-definitions/**/*.ts"
    ],

    format: formatters,

    publishQuiet: true,

    setDefaultTimeout: 30000
  }
};
