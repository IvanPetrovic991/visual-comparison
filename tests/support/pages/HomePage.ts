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
    // Arm the wait BEFORE submitting: the grid is already showing the pre-search
    // products, so waiting on productCards would resolve instantly against stale
    // DOM. Key the wait to the actual search round-trip instead.
    const searchResponse = this.page.waitForResponse(
      (r) => r.url().includes('/products/search') && r.request().method() === 'GET',
    );
    if (await this.searchSubmit.isVisible().catch(() => false)) {
      await this.searchSubmit.click();
    } else {
      await this.searchInput.press('Enter');
    }
    await searchResponse;
    await stabilize(this.page);
  }

  /**
   * Open a product by its exact name rather than position. The catalog is
   * live/reseedable, so clicking `.first()` is non-deterministic — pin the
   * snapshot to a known product so a reseed can't silently swap the page.
   */
  async openProductByName(name: string): Promise<void> {
    await this.productCards.filter({ hasText: name }).first().click();
  }
}
