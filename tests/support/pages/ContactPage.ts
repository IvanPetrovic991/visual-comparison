import type { Locator } from '@playwright/test';
import { BasePage } from './BasePage';
import { stabilize } from '../stabilize';

export class ContactPage extends BasePage {
  readonly path = '/contact';

  readonly firstName: Locator = this.page.locator('[data-test="first-name"]');
  readonly lastName: Locator = this.page.locator('[data-test="last-name"]');
  readonly email: Locator = this.page.locator('[data-test="email"]');
  readonly subject: Locator = this.page.locator('[data-test="subject"]');
  readonly message: Locator = this.page.locator('[data-test="message"]');
  readonly submit: Locator = this.page.locator('[data-test="contact-submit"]');

  async ready(): Promise<void> {
    await this.firstName.waitFor({ state: 'visible' });
  }

  /** Reach Contact via the navbar so it works on hash-routed deployments too. */
  async open(): Promise<this> {
    await this.openViaNav('[data-test="nav-contact"]');
    return this;
  }

  /** Fill the form with deterministic data for a "filled state" snapshot. */
  async fillSample(): Promise<void> {
    await this.firstName.fill('Ada');
    await this.lastName.fill('Lovelace');
    await this.email.fill('ada@example.com');
    await this.subject.selectOption({ index: 1 }).catch(() => undefined);
    await this.message.fill(
      'This is a deterministic message used for visual regression testing.',
    );
    await stabilize(this.page);
  }
}
