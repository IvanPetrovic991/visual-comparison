import type { Locator } from '@playwright/test';
import { BasePage } from './BasePage';
import { stabilize } from '../stabilize';

export class ContactPage extends BasePage {
  override readonly path = '/contact';

  readonly firstName: Locator = this.page.getByTestId('first-name');
  readonly lastName: Locator = this.page.getByTestId('last-name');
  readonly email: Locator = this.page.getByTestId('email');
  readonly subject: Locator = this.page.getByTestId('subject');
  readonly message: Locator = this.page.getByTestId('message');
  readonly submit: Locator = this.page.getByTestId('contact-submit');

  override async ready(): Promise<void> {
    await this.firstName.waitFor({ state: 'visible' });
  }

  /** Reach Contact via the navbar so it works on hash-routed deployments too. */
  override async open(): Promise<this> {
    await this.openViaNav('nav-contact');
    return this;
  }

  /** Fill the form with deterministic data for a "filled state" snapshot. */
  async fillSample(): Promise<void> {
    await this.firstName.fill('Ada');
    await this.lastName.fill('Lovelace');
    await this.email.fill('ada@example.com');
    // Not swallowed: if the subject dropdown ever loses its options, this must
    // fail loudly rather than baseline a screenshot with an empty select.
    await this.subject.selectOption({ index: 1 });
    await this.message.fill(
      'This is a deterministic message used for visual regression testing.',
    );
    await stabilize(this.page);
  }
}
