import type { Locator } from '@playwright/test';
import { BasePage } from './BasePage';

export class LoginPage extends BasePage {
  readonly path = '/auth/login';

  readonly email: Locator = this.page.locator('[data-test="email"]');
  readonly password: Locator = this.page.locator('[data-test="password"]');
  readonly submit: Locator = this.page.locator('[data-test="login-submit"]');

  async ready(): Promise<void> {
    await this.email.waitFor({ state: 'visible' });
  }

  /** Reach Sign in via the navbar so it works on hash-routed deployments too. */
  async open(): Promise<this> {
    await this.openViaNav('[data-test="nav-sign-in"]');
    return this;
  }
}
