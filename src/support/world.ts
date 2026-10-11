import { World, setWorldConstructor } from "@cucumber/cucumber";
import type { Browser, Page } from "@playwright/test";
import { HomePage } from "../pages/HomePage";

export class CustomWorld extends World {
  browser?: Browser;
  page?: Page;
  homePage?: HomePage;
}

setWorldConstructor(CustomWorld);
