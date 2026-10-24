import { expect, type Page } from "@playwright/test";
import { HomePageModel } from "../models/HomePage.model";

export class HomePage {

  private readonly homePagemodel: HomePageModel

  constructor(private readonly page: Page) {
    this.homePagemodel = new HomePageModel(page);
  }

  async navigate(): Promise<void> {
    await this.page.goto("https://automationexercise.com", {
      waitUntil: "domcontentloaded",
      timeout: 60_000
    });
  }

  async verifyTitleContains(expectedTitle: string): Promise<void> {
    await expect(this.page).toHaveTitle(
      new RegExp(expectedTitle, "i"),
    );
  }

  async clickLink(name: string): Promise<void> {
    await this.homePagemodel.link(name).click();
  }
}
