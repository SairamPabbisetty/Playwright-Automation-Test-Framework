import { Locator, Page } from "@playwright/test";

export class HomePageModel {
    readonly link: (name: string) => Locator;
    readonly loggedInUsername: (username: string) => Locator;

    constructor(private readonly page: Page) {
        this.link = (name: string) => this.page.getByRole("link", {name, exact: false});
        this.loggedInUsername = (username: string) => this.page.locator("li").filter({ hasText: "Logged in as" }).getByText(username, { exact: true });
    }
}