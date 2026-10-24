import { Locator, Page } from "@playwright/test";

export class SignupModel {

    readonly text: (expectedText: string) => Locator;
    readonly radioButton: (radioName: string) => Locator;
    readonly inputField: (fieldName: string) => Locator;
    readonly dropdown: (fieldName: string) => Locator;
    readonly checkbox: (name: string) => Locator;
    readonly button: (name: string) => Locator;

    constructor(private readonly page: Page) {
        this.text = (expectedText: string) => this.page.getByText(expectedText, {exact: true});
        this.radioButton = (radioName: string) => this.page.getByRole("radio", { name: radioName, exact: true });
        this.inputField = (fieldName: string) => this.page.locator(`input[name="${fieldName}"]`);
        this.dropdown = (fieldName: string) => this.page.locator(`select[name="${fieldName}"]`);
        this.checkbox = (name: string) => this.page.getByRole("checkbox", {name, exact: true});
        this.button = (name: string) => this.page.getByRole("button", {name, exact: true, });
    }
}