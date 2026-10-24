import { Locator, Page } from "@playwright/test";

export class SignupModel {

    readonly text: (expectedText: string) => Locator;

    constructor(private readonly page: Page) {
        this.text = (expectedText: string) => this.page.getByText(expectedText, {exact: true});
    }
}