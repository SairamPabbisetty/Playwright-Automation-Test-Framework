import { Then } from "@cucumber/cucumber";
import { CustomWorld } from "../support/world";

Then("Signup: User validates the text {string} is visble", async function (this: CustomWorld, expectedText: string) {
    if (!this.signup) {
      throw new Error("Signup is not initialized. Check the Before hook.");
  }
  await this.signup.validateText(expectedText);
})