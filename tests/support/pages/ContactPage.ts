import type { Locator } from '@playwright/test';
import { BasePage } from './BasePage';
import { stabilize } from '../stabilize';

export class ContactPage extends BasePage {
  readonly path = '/contact';

  readonly firstName: Locator = this.page.getByTestId('first-name');
  readonly lastName: Locator = this.page.getByTestId('last-name');
  readonly email: Locator = this.page.getByTestId('email');
  readonly subject: Locator = this.page.getByTestId('subject');
  readonly message: Locator = this.page.getByTestId('message');
  readonly submit: Locator = this.page.getByTestId('contact-submit');

  async ready(): Promise<void> {
    await this.firstName.waitFor({ state: 'visible' });
  }

  /** Reach Contact via the navbar so it works on hash-routed deployments too. */
  async open(): Promise<this> {
    await this.openViaNav('nav-contact');
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
