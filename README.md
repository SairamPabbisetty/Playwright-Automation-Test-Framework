# Playwright Automation Test Framework

A UI test automation framework built with **Playwright, Cucumber, TypeScript, and the Page Object Model (POM)**. It uses Gherkin feature files to describe test scenarios, TypeScript step definitions to execute them, and page objects to encapsulate browser interactions.

## Features

- BDD-style test scenarios using Cucumber and Gherkin.
- Browser automation using Playwright and Chromium.
- TypeScript-based step definitions and page objects.
- Reusable browser setup and teardown through Cucumber hooks.
- Configurable Cucumber step timeout.
- HTML execution reports with individual step statuses and failure details.
- Timestamped report directories to preserve historical runs.
- Dependency installation for setting up the framework on another PC.

## Technology Stack

| Technology | Purpose |
|---|---|
| Node.js | JavaScript runtime |
| npm | Dependency management |
| TypeScript | Type-safe test implementation |
| Cucumber.js | BDD test runner |
| Playwright | Browser automation |
| Chromium | Browser used for UI tests |
| HTML | Test execution reports |
| Git and GitHub | Version control and source management |

## Project Structure

```text
Playwright Repo/
├── features/
│   └── ui/
│       └── TitleValidation.feature
├── scripts/
│   ├── run-cucumber.js
│   └── generate-cucumber-report.js
├── src/
│   ├── pages/
│   │   └── HomePage.ts
│   ├── step-definitions/
│   │   └── HomePage.steps.ts
│   └── support/
│       ├── hooks.ts
│       └── world.ts
├── reports/
│   └── Oct2026/
│       └── DD-MM-YYYY-HH-mm-ss/
│           └── report.html
├── .gitignore
├── cucumber.js
├── package.json
├── package-lock.json
├── tsconfig.json
└── README.md
```

The `reports/` directory is generated during test execution and is excluded from Git tracking.

## Architecture

The framework follows this execution flow:

```text
Feature File
    ↓
Step Definitions
    ↓
Page Object
    ↓
Playwright Browser
    ↓
Cucumber Results
    ↓
HTML Report
```

### Feature Files

Location: `features/`

Feature files describe scenarios using Gherkin syntax.

Example:

```gherkin
Feature: Homepage title validation

  Scenario: Verify the Automation Exercise homepage title
    Given HomePage: Navigate to Automation Exercise homepage
    Then HomePage: The homepage title should contain "Automation Exercise"
```

### Step Definitions

Location: `src/step-definitions/`

Step definitions map Gherkin steps to TypeScript functions. They call the relevant page-object methods instead of directly implementing browser interactions.

### Page Objects

Location: `src/pages/`

Page objects encapsulate page-specific navigation, locators, and actions. The current `HomePage` class provides homepage navigation and title verification.

### Support Files

Location: `src/support/`

- `world.ts` defines the custom Cucumber World and stores scenario-specific browser objects.
- `hooks.ts` launches Chromium before a scenario and closes the browser afterward.

## Prerequisites

Install the following on a new Windows PC:

- Node.js and npm.
- Git or GitHub Desktop.
- Visual Studio Code (recommended).
- Internet access to download dependencies and Chromium.

The current development machine uses Node.js 24.21.0. Use a compatible Node.js version and keep it consistent across environments.

## Setup on a New PC

### 1. Clone the repository

```powershell
git clone https://github.com/SairamPabbisetty/Playwright-Automation-Test-Framework.git
```

### 2. Open the project

```powershell
cd Playwright-Automation-Test-Framework
code .
```

Alternatively, open the cloned folder using VS Code or GitHub Desktop.

### 3. Install dependencies and Chromium

```powershell
npm.cmd ci
npx.cmd playwright install chromium
```

`npm ci` installs the dependency versions recorded in `package-lock.json`.

Chromium is installed separately because browser binaries are not included in the npm dependency installation.

### 4. Run the tests

```powershell
npm.cmd test
```

The test command executes `scripts/run-cucumber.js`, which launches the Cucumber test runner.

## Test Execution

The primary test command is:

```powershell
npm.cmd test
```

Cucumber discovers feature files under `features/**/*.feature`, loads the TypeScript support files and step definitions, and executes the scenarios.

The current UI test validates the title of [Automation Exercise](https://automationexercise.com).

The browser is configured in the Cucumber hooks. Headed mode can be enabled by setting `headless: false` in `src/support/hooks.ts`.

## Test Reports

Each test run is intended to create a unique report directory under:

```text
reports/
└── Oct2026/
    └── DD-MM-YYYY-HH-mm-ss/
        └── report.html
```

The month folder uses the abbreviated month followed by the year, such as `Oct2026` or `Sept2026`.

The HTML report includes:

- Feature and scenario names.
- Individual step results.
- Passed, failed, skipped, and undefined statuses.
- Step duration.
- Error messages and stack details for failed steps.

The report is opened automatically in the default browser after successful report generation.

To inspect report folders from PowerShell:

```powershell
tree /F reports
```

Reports are generated locally and are not committed to Git.

## TypeScript Validation

To check the TypeScript files for compilation errors:

```powershell
npx.cmd tsc --noEmit
```

## Git Workflow

Check the current branch and working tree:

```powershell
git status
```

Stage and commit changes:

```powershell
git add .
git commit -m "Describe your changes"
```

Push changes to GitHub:

```powershell
git push
```

Ensure generated reports, `node_modules/`, and local environment files remain excluded by `.gitignore`.

## Current Scope

The current implementation covers a Cucumber-driven UI test framework using Playwright and Chromium.

API testing, additional page objects, environment configuration, CI/CD integration, and expanded test coverage can be added as the framework evolves.

## Repository

GitHub: https://github.com/SairamPabbisetty/Playwright-Automation-Test-Framework
