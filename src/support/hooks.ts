import {
  Before,
  After,
  setDefaultTimeout
} from "@cucumber/cucumber";
import { chromium } from "@playwright/test";
import { HomePage } from "../pages/HomePage";
import type { CustomWorld } from "./world";

setDefaultTimeout(30000);

Before(async function (this: CustomWorld) {
  this.browser = await chromium.launch({ headless: false });
  this.page = await this.browser.newPage();
  this.homePage = new HomePage(this.page);
});

After(async function (this: CustomWorld) {
  await this.browser?.close();
});
