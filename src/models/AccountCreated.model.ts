import { Locator, Page } from "@playwright/test";

export class AccountCreatedModel {

    readonly text: (expectedText: string) => Locator;
    readonly link: (name: string) => Locator;

    constructor(private readonly page: Page) {
        this.text = (expectedText: string) => this.page.getByText(expectedText, {exact: true});
        this.link = (name: string) => this.page.getByRole("link", {name, exact: true});
    }
}