import { expect, Page } from "@playwright/test";
import { SignupModel } from "../models/Signup.model";

export class Signup {

    private readonly signupModel: SignupModel

    constructor(private readonly page: Page) {
        this.signupModel = new SignupModel(page);
    }

    async validateText(expectedText: string): Promise<void> {
        await expect(this.signupModel.text(expectedText)).toBeVisible();
    }

    async selectRadioButton(radioName: string): Promise<void> {
        await this.signupModel.radioButton(radioName).check();
    }

    async enterTextByName(fieldName: string, value: string): Promise<void> {
        await this.signupModel.inputField(fieldName).fill(value);
    }

    async selectDropdownOption(fieldName: string, value: string): Promise<void> {
        await this.signupModel.dropdown(fieldName).selectOption(value);
    }

    async selectCheckbox(name: string): Promise<void> {
        await this.signupModel.checkbox(name).check();
    }

    async clickButton(name: string): Promise<void> {
        await this.signupModel.button(name).click();
    }
}