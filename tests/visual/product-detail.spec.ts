import { test, expect } from '@playwright/test';
import { HomePage } from '../support/pages/HomePage';
import { ProductDetailPage } from '../support/pages/ProductDetailPage';

test.describe('Product detail', () => {
  test('first product detail page', async ({ page }) => {
    const home = await new HomePage(page).open();
    await home.openFirstProduct();

    const detail = new ProductDetailPage(page);
    await detail.waitUntilLoaded();

    await expect(page).toHaveScreenshot('product-detail.png', { fullPage: true });
  });
});
