# Playwright Automation Test Framework

A TypeScript UI automation framework for [Automation Exercise](https://automationexercise.com) using Playwright, Cucumber.js, Gherkin, and the Page Object Model (POM). The repository contains both a Cucumber-based BDD suite and a small Playwright Test smoke suite.

## What is included

- Gherkin feature files for homepage title validation and end-to-end user registration.
- Cucumber step definitions written in TypeScript.
- Page objects and locator models that keep browser interactions out of step definitions.
- Per-scenario browser setup and teardown through Cucumber hooks.
- Chromium execution in headed or headless mode.
- Timestamped HTML reports for Cucumber runs.
- A Playwright Test smoke test with HTML reporting, screenshots, and traces on failure.
- Strict TypeScript compiler settings for the test and framework source.

## Technology stack

| Technology | Purpose |
| --- | --- |
| Node.js and npm | Runtime and dependency management |
| TypeScript | Test, page-object, and framework implementation |
| Playwright | Browser automation and assertions |
| Chromium | Browser used by the Cucumber and Playwright Test suites |
| Cucumber.js | BDD test runner |
| Gherkin | Human-readable feature and scenario definitions |
| `ts-node` | Loads TypeScript files while Cucumber runs |
| `multiple-cucumber-html-reporter` | Declared reporting dependency for Cucumber reporting |

## Project structure

```text
Playwright Repo/
├── features/
│   └── ui/
│       ├── RegisterUser.feature
│       └── TitleValidation.feature
├── scripts/
│   ├── generate-cucumber-report.js
│   └── run-cucumber.js
├── src/
│   ├── models/
│   │   ├── AccountCreated.model.ts
│   │   ├── HomePage.model.ts
│   │   ├── LoginSignup.model.ts
│   │   └── Signup.model.ts
│   ├── pages/
│   │   ├── AccountCreated.page.ts
│   │   ├── HomePage.page..ts
│   │   ├── LoginSignup.page.ts
│   │   └── Signup.page.ts
│   ├── step-definitions/
│   │   ├── AccountCreated.step.ts
│   │   ├── HomePage.steps.ts
│   │   ├── LoginSignup.step.ts
│   │   └── Signup.step.ts
│   └── support/
│       ├── hooks.ts
│       └── world.ts
├── tests/
│   └── smoke.spec.ts
├── cucumber.js
├── playwright.config.ts
├── package.json
├── package-lock.json
├── tsconfig.json
└── README.md
```

Generated output directories are not source code:

- `reports/` contains timestamped Cucumber HTML reports.
- `playwright-report/` contains the Playwright Test HTML report.
- `test-results/` contains Playwright Test artifacts such as traces and screenshots.

These directories are excluded by `.gitignore`.

## Architecture

### Cucumber execution flow

```text
Feature file
    ↓
Cucumber tag selection
    ↓
Step definitions
    ↓
Page object
    ↓
Locator model
    ↓
Playwright browser
    ↓
Cucumber JSON → generated HTML report
```

`src/support/hooks.ts` launches Chromium before each scenario, creates the browser context and page objects, and closes all resources afterward. `src/support/world.ts` exposes those objects to step definitions through the custom Cucumber World.

Page objects represent the user-facing areas used by the current registration flow:

- `HomePage`: navigation, title validation, links, and logged-in username.
- `LoginSignup`: signup form text, fields, and buttons.
- `Signup`: account details, radio buttons, dropdowns, checkboxes, and account creation.
- `AccountCreated`: account-created/deleted messages and the Continue link.

The accompanying `models/` classes centralize locators used by these page objects.

### Playwright Test execution flow

`tests/smoke.spec.ts` uses `playwright.config.ts`. It runs against the configured base URL, `https://automationexercise.com`, in Chromium and verifies that the homepage title contains “Automation Exercise”.

The Playwright Test configuration enables:

- Parallel execution.
- Two retries and two workers in CI.
- An HTML report that is not opened automatically.
- Traces retained on failure.
- Screenshots captured only on failure.
- 10-second action and 30-second navigation timeouts.

## Prerequisites

- Node.js and npm.
- Git.
- Internet access for npm packages and the Chromium browser binary.
- VS Code is recommended, but not required.

Use a current Node.js LTS release where possible. The project is currently developed with Node.js 24.21.0.

## Installation

Clone the repository and install the locked dependency versions:

```powershell
git clone https://github.com/SairamPabbisetty/Playwright-Automation-Test-Framework.git
cd Playwright-Automation-Test-Framework
npm ci
npx playwright install chromium
```

The equivalent project setup script performs both installation steps:

```powershell
npm run setup
```

`npm ci` uses `package-lock.json`; do not use `npm install` when a reproducible installation from the lockfile is required.

## Running tests

### Run the default Cucumber registration scenario

```powershell
npm test
```

The `test` script runs:

```text
node scripts/run-cucumber.js --tag=@RegisterUser --headless=false
```

This executes the `@RegisterUser` scenario in headed Chromium mode. The scenario creates a user with the data in `features/ui/RegisterUser.feature`, verifies the account, and deletes the account at the end.

### Run Cucumber with a different tag or browser mode

The runner accepts `--tag` and `--headless` options:

```powershell
node scripts/run-cucumber.js --tag="@SmokeTest" --headless=true
node scripts/run-cucumber.js --tag="@HomePage" --headless=false
```

Use `--headless=true` or `--headless=false` explicitly. The Cucumber hooks default to headless mode when `HEADLESS` is not set.

Available tags in the current feature files are:

- `@RegisterUser`: complete registration, account verification, and account deletion flow.
- `@SmokeTest`: homepage title validation.
- `@HomePage`: homepage title validation.

To run all Cucumber scenarios, omit `--tag`:

```powershell
node scripts/run-cucumber.js --headless=true
```

### Run the Playwright Test smoke suite

```powershell
npx playwright test
```

Useful Playwright Test commands:

```powershell
npx playwright test tests/smoke.spec.ts
npx playwright test --headed
npx playwright show-report
```

The Playwright Test suite uses the settings in `playwright.config.ts`, which are independent of the Cucumber runner and its `HEADLESS` environment variable.

## Cucumber reports

Every Cucumber run creates a unique report directory:

```text
reports/
└── Oct2026/
    └── 29-10-2026-23-21-59/
        └── report.html
```

The directory name is generated from the local machine date and time as `reports/<MonYYYY>/<DD-MM-YYYY-HH-mm-ss>/`. The runner:

1. Creates the timestamped directory.
2. Writes the temporary Cucumber JSON report there.
3. Generates `report.html` using `scripts/generate-cucumber-report.js`.
4. Removes the temporary JSON file after successful HTML generation.
5. Opens the HTML report in the default Windows browser.

If the browser does not open automatically, open the generated `report.html` manually. The report shows scenario and step statuses, durations, totals, and failure details.

To inspect generated reports from PowerShell:

```powershell
tree /F reports
```

## TypeScript validation

Run the TypeScript compiler without emitting JavaScript:

```powershell
npx tsc --noEmit
```

The compiler includes `src/**/*.ts`, `tests/**/*.ts`, and `features/**/*.ts` and uses strict type checking as configured in `tsconfig.json`.

## Configuration reference

| File | Responsibility |
| --- | --- |
| `package.json` | Dependency manifest and `setup`/`test` npm scripts |
| `cucumber.js` | Cucumber feature paths, TypeScript loading, hooks, step definitions, timeout, and JSON output |
| `scripts/run-cucumber.js` | Tag/headless argument parsing, report directories, Cucumber launch, and report opening |
| `scripts/generate-cucumber-report.js` | Converts Cucumber JSON into the local HTML report |
| `playwright.config.ts` | Playwright Test discovery, browser, URL, retries, workers, timeouts, and reporters |
| `tsconfig.json` | Strict TypeScript compiler settings and included source paths |

## Adding coverage

To add a Cucumber scenario:

1. Add or update a `.feature` file under `features/`.
2. Add matching step definitions under `src/step-definitions/`.
3. Add or extend a page object under `src/pages/`.
4. Keep selectors in the corresponding model under `src/models/`.
5. Run the tagged scenario and `npx tsc --noEmit`.

For an independent Playwright Test, add a `.spec.ts` file under `tests/` and use the fixtures and configuration provided by `@playwright/test`.

## Git workflow

Check the working tree before and after changes:

```powershell
git status
```

Generated reports, `node_modules/`, Playwright artifacts, and local environment files are ignored by `.gitignore`. Do not commit those generated files.

## Current scope

The framework currently covers:

- Homepage title validation.
- User registration with account information and preferences.
- Logged-in username verification.
- Account deletion.
- A standalone homepage smoke test.

API testing, environment-specific configuration, CI/CD workflows, additional page objects, and expanded test data management are not currently implemented.

## Repository

GitHub: https://github.com/SairamPabbisetty/Playwright-Automation-Test-Framework
