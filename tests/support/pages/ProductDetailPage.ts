import type { Locator } from '@playwright/test';
import { BasePage } from './BasePage';
import { stabilize } from '../stabilize';

/**
 * Product detail has no stable public URL (ids are seeded UUIDs), so this page
 * is normally reached by clicking through from the home grid. Use
 * `waitUntilLoaded()` after navigating instead of `open()`.
 */
export class ProductDetailPage extends BasePage {
  readonly path = '/product';

  readonly title: Locator = this.page.locator('[data-test="product-name"]');
  readonly price: Locator = this.page.locator('[data-test="unit-price"]');
  readonly addToCart: Locator = this.page.locator('[data-test="add-to-cart"]');

  async ready(): Promise<void> {
    await this.title.waitFor({ state: 'visible' });
    await this.addToCart.waitFor({ state: 'visible' });
  }

  /** Wait for the detail content and stabilize, after arriving via a click-through. */
  async waitUntilLoaded(): Promise<void> {
    await this.ready();
    await stabilize(this.page);
  }
}
