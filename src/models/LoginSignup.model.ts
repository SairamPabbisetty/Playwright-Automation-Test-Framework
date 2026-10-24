import { Locator, Page } from "@playwright/test";

export class LoginSignupModel {

    readonly text: (expectedText: string) => Locator;
    readonly textField: (fieldName: string) => Locator;
    readonly button: (buttonName: string) => Locator;

    constructor(private readonly page: Page) {
        this.text = (expectedText: string) => this.page.getByText(expectedText, {exact: true});
        this.textField = (fieldName: string) => this.page.locator("form").filter({hasText: "Signup"}).getByPlaceholder(fieldName, {exact: true});
        this.button = (name: string) => this.page.getByRole("button", {name, exact: true})
    }
}