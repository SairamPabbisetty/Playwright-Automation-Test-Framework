import { Then } from "@cucumber/cucumber";
import { CustomWorld } from "../support/world";

Then("Signup: User validates the text {string} is visble", async function(this: CustomWorld, expectedText: string) {
  if (!this.signup) {
    throw new Error("Signup is not initialized. Check the Before hook.");
  }
  await this.signup.validateText(expectedText);
})

Then("Signup: User selects the {string} radio button", async function(this: CustomWorld, radioName: string) {
  if (!this.signup) {
      throw new Error("Signup is not initialized. Check the Before hook.");
  }
  await this.signup.selectRadioButton(radioName);
})

Then('Signup: User enters {string} into the input named {string}', async function(this: CustomWorld, value: string, fieldName: string) {
  if (!this.signup) {
    throw new Error("RegisterUserPage is not initialized");
  }

  await this.signup.enterTextByName(fieldName, value);
});


Then('Signup: User selects {string} from the {string} dropdown', async function(this: CustomWorld, value: string, fieldName: string) {
  if (!this.signup) {
    throw new Error("RegisterUserPage is not initialized");
  }

  await this.signup.selectDropdownOption(fieldName, value);
});

Then('Signup: User checks the {string} checkbox', async function(this: CustomWorld, name: string) {
  if (!this.signup) {
    throw new Error("RegisterUserPage is not initialized");
  }

  await this.signup.selectCheckbox(name);
});

Then('Signup: User clicks the {string} button', async function(this: CustomWorld, name: string) {
  if (!this.signup) {
    throw new Error("RegisterUserPage is not initialized");
  }

  await this.signup.clickButton(name);
});