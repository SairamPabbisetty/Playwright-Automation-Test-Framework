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
      "json:reports/cucumber-report.json"
    ],
    publishQuiet: true,
    setDefaultTimeout: 30000
  }
};
