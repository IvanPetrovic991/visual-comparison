import type { Locator } from '@playwright/test';
import { BasePage } from './BasePage';

export class LoginPage extends BasePage {
  override readonly path = '/auth/login';

  readonly email: Locator = this.page.getByTestId('email');
  readonly password: Locator = this.page.getByTestId('password');
  readonly submit: Locator = this.page.getByTestId('login-submit');

  override async ready(): Promise<void> {
    await this.email.waitFor({ state: 'visible' });
  }

  /** Reach Sign in via the navbar so it works on hash-routed deployments too. */
  override async open(): Promise<this> {
    await this.openViaNav('nav-sign-in');
    return this;
  }
}
