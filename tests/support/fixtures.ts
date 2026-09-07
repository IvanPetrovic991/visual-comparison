import { test as base, expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import { HomePage } from './pages/HomePage';
import { ProductDetailPage } from './pages/ProductDetailPage';
import { ContactPage } from './pages/ContactPage';
import { LoginPage } from './pages/LoginPage';

/**
 * Every page object available to a test, pre-instantiated. The generated spec
 * destructures all of them, so each is built for every test — constructors are
 * trivially cheap; the value here is ergonomics and type-safety, not laziness.
 */
export type VisualFixtures = {
  page: Page;
  homePage: HomePage;
  productPage: ProductDetailPage;
  contactPage: ContactPage;
  loginPage: LoginPage;
};

/**
 * Extended `test` that injects page objects, removing `new HomePage(page)`
 * boilerplate from every spec. Import this instead of '@playwright/test'.
 * At 1000+ tests that is one destructuring per test instead of a constructor block.
 */
export const test = base.extend<Omit<VisualFixtures, 'page'>>({
  homePage: async ({ page }, use) => {
    await use(new HomePage(page));
  },
  productPage: async ({ page }, use) => {
    await use(new ProductDetailPage(page));
  },
  contactPage: async ({ page }, use) => {
    await use(new ContactPage(page));
  },
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },
});

export { expect };
