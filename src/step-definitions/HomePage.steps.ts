import { Given, Then } from "@cucumber/cucumber";
import type { CustomWorld } from "../support/world.js";

Given("HomePage: User navigate to Automation Exercise homepage", async function (this: CustomWorld) {
    if (!this.homePage) {
      throw new Error("HomePage is not initialized. Check the Before hook.");
    }

    await this.homePage.navigate();
  }
);

Then("HomePage: User validates the homepage title should contain {string}", async function (this: CustomWorld, expectedTitle: string) {
    if (!this.homePage) {
      throw new Error("HomePage is not initialized. Check the Before hook.");
    }

    await this.homePage.verifyTitleContains(expectedTitle);
  }
);