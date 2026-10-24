import { Then } from "@cucumber/cucumber";
import { CustomWorld } from "../support/world";

Then("LoginSignup: User validates the text {string} is visble", async function (this: CustomWorld, expectedText: string) {
    if (!this.loginSignup) {
      throw new Error("LoginSignup is not initialized. Check the Before hook.");
  }
  await this.loginSignup.validateText(expectedText);
})

Then("LoginSignup: User enters {string} in to {string} field", async function (this: CustomWorld, fieldValue: string, fieldName: string) {
    if(!this.loginSignup) {
        throw new Error("LoginSignup is not initialized. Check the Before hook.");
    }
    await this.loginSignup.enterText(fieldName, fieldValue);
})

Then("LoginSignup: User clicks on the {string} button", async function (this: CustomWorld, buttonName: string) {
    if(!this.loginSignup) {
        throw new Error("LoginSignup is not initialized. Check the Before hook.");
    }
    await this.loginSignup.clickButton(buttonName);
})