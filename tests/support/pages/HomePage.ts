import type { Locator } from '@playwright/test';
import { BasePage } from './BasePage';
import { stabilize } from '../stabilize';

export class HomePage extends BasePage {
  readonly path = '/';

  readonly productCards: Locator = this.page.getByTestId('product-name');
  readonly searchInput: Locator = this.page.getByTestId('search-query');
  readonly searchSubmit: Locator = this.page.getByTestId('search-submit');

  async ready(): Promise<void> {
    await this.productCards.first().waitFor({ state: 'visible' });
  }

  async search(term: string): Promise<void> {
    await this.searchInput.fill(term);
    if (await this.searchSubmit.isVisible().catch(() => false)) {
      await this.searchSubmit.click();
    } else {
      await this.searchInput.press('Enter');
    }
    await this.productCards.first().waitFor({ state: 'visible' });
    await stabilize(this.page);
  }

  async openFirstProduct(): Promise<void> {
    await this.productCards.first().click();
  }
}
