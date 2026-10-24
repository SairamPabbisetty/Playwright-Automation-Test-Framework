import { expect, Page } from "@playwright/test";
import { AccountCreatedModel } from "../models/AccountCreated.model";

export class AccountCreated {

    private readonly accountCreatedModel: AccountCreatedModel;

    constructor(private readonly page: Page) {
        this.accountCreatedModel = new AccountCreatedModel(page);
    }

    async validateText(expectedText: string): Promise<void> {
        await expect(this.accountCreatedModel.text(expectedText)).toBeVisible();
    }

    async clickLink(name: string): Promise<void> {
        await this.accountCreatedModel.link(name).click();
    }

}