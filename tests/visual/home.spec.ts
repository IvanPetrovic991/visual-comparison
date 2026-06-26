import { test, expect } from '@playwright/test';
import { HomePage } from '../support/pages/HomePage';

test.describe('Home page', () => {
  test('product grid renders as expected', async ({ page }) => {
    await new HomePage(page).open();
    await expect(page).toHaveScreenshot('home-grid.png', { fullPage: true });
  });
});
