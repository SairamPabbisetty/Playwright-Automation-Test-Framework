import { test, expect } from "@playwright/test";

test("Automation Exercise homepage loads", async ({ page }) => {
  await page.goto("/");

  await expect(page).toHaveTitle(/automation exercise/i);
});
