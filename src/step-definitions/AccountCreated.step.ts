import { Then } from "@cucumber/cucumber";
import { CustomWorld } from "../support/world";

Then("AccountCreated: User validates the text {string} is visble", async function(this: CustomWorld, expectedText: string) {
  if (!this.accountCreated) {
    throw new Error("Signup is not initialized. Check the Before hook.");
  }
  await this.accountCreated.validateText(expectedText);
})

Then('AccountCreated: User clicks the {string} link', async function (this: CustomWorld, name: string) {
    if (!this.accountCreated) {
      throw new Error("RegisterUserPage is not initialized");
    }

    await this.accountCreated.clickLink(name);
});