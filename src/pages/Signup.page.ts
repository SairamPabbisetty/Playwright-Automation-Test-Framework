import { expect, Page } from "@playwright/test";
import { LoginSignupModel } from "../models/LoginSignup.model";
import { SignupModel } from "../models/Signup.model";

export class Signup {

    private readonly signupModel: SignupModel

    constructor(private readonly page: Page) {
        this.signupModel = new SignupModel(page);
    }

    async validateText(expectedText: string): Promise<void> {
        await expect(this.signupModel.text(expectedText)).toBeVisible();
    }
}