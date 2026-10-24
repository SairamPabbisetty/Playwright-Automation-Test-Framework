import { expect, Page } from "@playwright/test";
import { LoginSignupModel } from "../models/LoginSignup.model";

export class LoginSignup {

    private readonly loginSignupModel: LoginSignupModel

    constructor(private readonly page: Page) {
        this.loginSignupModel = new LoginSignupModel(page);
    }

    async validateText(expectedText: string): Promise<void> {
        await expect(this.loginSignupModel.text(expectedText)).toBeVisible();
    }

    async enterText(fieldName: string, fieldValue: string): Promise<void> {
        await this.loginSignupModel.textField(fieldName).fill(fieldValue);
    }

    async clickButton(buttonName: string): Promise<void> {
        await this.loginSignupModel.button(buttonName).click();
    }
}