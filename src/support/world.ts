import { World, setWorldConstructor } from "@cucumber/cucumber";
import type { Browser, BrowserContext, Page } from "@playwright/test";
import { HomePage } from "../pages/HomePage";

export class CustomWorld extends World {
  browser?: Browser;
  context?: BrowserContext;
  page?: Page;
  homePage?: HomePage;
}

setWorldConstructor(CustomWorld);
