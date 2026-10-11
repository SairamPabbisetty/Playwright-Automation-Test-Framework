
const path = require("node:path");

const reportDir = process.env.REPORT_DIR
  ? path.resolve(process.env.REPORT_DIR)
  : path.resolve("reports", "manual-run");

module.exports = {
  default: {
    paths: ["features/**/*.feature"],
    requireModule: ["ts-node/register"],
    require: [
      "src/support/world.ts",
      "src/support/hooks.ts",
      "src/step-definitions/**/*.ts"
    ],
    format: [
      "progress",
      `json:${path.relative(process.cwd(), path.join(reportDir, "cucumber-report.json"))}`
    ],
    publishQuiet: true,
    setDefaultTimeout: 30000
  }
};
