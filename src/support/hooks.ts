import {
  Before,
  After,
  setDefaultTimeout,
} from "@cucumber/cucumber";
import { chromium } from "@playwright/test";
import { HomePage } from "../pages/HomePage.page.";
import { LoginSignup } from "../pages/LoginSignup.page";
import { Signup } from "../pages/Signup.page";
import type { CustomWorld } from "./world";
import { AccountCreated } from "../pages/AccountCreated.page";

setDefaultTimeout(30_000);

function getHeadlessMode(): boolean {
  const value = process.env.HEADLESS?.toLowerCase();

  if (value === "true") return true;
  if (value === "false") return false;

  return true;
}

Before(async function (this: CustomWorld) {
  this.browser = await chromium.launch({
    headless: getHeadlessMode(),
  });

  try {
    this.context = await this.browser.newContext();
    this.page = await this.context.newPage();
    this.homePage = new HomePage(this.page);
    this.loginSignup = new LoginSignup(this.page);
    this.signup = new Signup(this.page);
    this.accountCreated = new AccountCreated(this.page);
  } catch (error) {
    try {
      await this.context?.close();
    } finally {
      await this.browser.close();
      this.browser = undefined;
      this.context = undefined;
      this.page = undefined;
      this.homePage = undefined;
      this.loginSignup = undefined;
      this.signup = undefined;
      this.accountCreated = undefined;
    }

    throw error;
  }
});

After(async function (this: CustomWorld) {
  try {
    await this.context?.close();
  } finally {
    try {
      await this.browser?.close();
    } finally {
      this.context = undefined;
      this.page = undefined;
      this.browser = undefined;
      this.homePage = undefined;
      this.loginSignup = undefined;
      this.signup = undefined;
      this.accountCreated = undefined;
    }
  }
});