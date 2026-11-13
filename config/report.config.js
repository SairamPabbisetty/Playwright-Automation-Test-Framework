
const path = require("node:path");

// Environment Variable Parser
function getBooleanEnv(name, defaultValue) {
  const value = process.env[name];

  if (value === undefined) {
    return defaultValue;
  }

  return value.toLowerCase() === "true";
}

// Report Configuration
function getReportConfig() {
  const reportDir = process.env.REPORT_DIR
    ? path.resolve(process.env.REPORT_DIR)
    : path.resolve("reports", "manual-run");

  return {
    reportDir,

    files: {
      cucumberJson: "cucumber-report.json",
      normalizedJson: "normalized-results.json",
      html: "report.html",
    },

    generate: {
      cucumberJson: getBooleanEnv("REPORT_CUCUMBER_JSON", true),
      normalizedJson: getBooleanEnv("REPORT_NORMALIZED_JSON", true),
      html: getBooleanEnv("REPORT_HTML", true),
    },

    behaviour: {
      openHtml: getBooleanEnv("REPORT_OPEN_HTML", true),
    },
  };
}

// Export Configuration
module.exports = {
  getReportConfig,
};
