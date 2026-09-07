import type { Locator } from '@playwright/test';
import { BasePage } from './BasePage';
import { stabilize } from '../stabilize';

/**
 * Product detail has no stable public URL (ids are seeded ULIDs), so it is
 * reached by clicking through from the home grid — `HomePage.openProductByName()`
 * then `waitUntilLoaded()`. It deliberately declares no `path`, so `open()`
 * throws instead of deep-linking to a route that doesn't exist.
 */
export class ProductDetailPage extends BasePage {
  readonly title: Locator = this.page.getByTestId('product-name');
  readonly price: Locator = this.page.getByTestId('unit-price');
  readonly addToCart: Locator = this.page.getByTestId('add-to-cart');

  override async ready(): Promise<void> {
    await this.title.waitFor({ state: 'visible' });
    await this.addToCart.waitFor({ state: 'visible' });
  }

  /** Wait for the detail content and stabilize, after arriving via a click-through. */
  async waitUntilLoaded(): Promise<void> {
    await this.ready();
    await stabilize(this.page);
  }
}
