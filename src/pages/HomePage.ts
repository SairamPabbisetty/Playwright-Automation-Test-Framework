import { expect, type Page } from "@playwright/test";

export class HomePage {
  constructor(private readonly page: Page) {}

  async navigate(): Promise<void> {
    await this.page.goto("https://automationexercise.com");
  }

  async verifyTitleContains(expectedTitle: string): Promise<void> {
    await expect(this.page).toHaveTitle(
      new RegExp(expectedTitle, "i")
    );
  }
}
