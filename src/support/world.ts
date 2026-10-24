import { World, setWorldConstructor } from "@cucumber/cucumber";
import type { Browser, BrowserContext, Page } from "@playwright/test";
import { HomePage } from "../pages/HomePage.page.";
import { LoginSignup } from "../pages/LoginSignup.page";
import { Signup } from "../pages/Signup.page";

export class CustomWorld extends World {
  browser?: Browser;
  context?: BrowserContext;
  page?: Page;
  homePage?: HomePage;
  loginSignup?: LoginSignup;
  signup?: Signup;
}

setWorldConstructor(CustomWorld);
