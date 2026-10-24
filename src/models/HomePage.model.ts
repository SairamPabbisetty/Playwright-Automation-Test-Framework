import { Locator, Page } from "@playwright/test";

export class HomePageModel {
    readonly link: (name: string) => Locator;

    constructor(private readonly page: Page) {
        this.link = (name: string) => this.page.getByRole("link", {name, exact: false});
    }
}