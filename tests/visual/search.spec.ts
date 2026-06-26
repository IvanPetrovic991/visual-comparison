import { test, expect } from '@playwright/test';
import { HomePage } from '../support/pages/HomePage';

test.describe('Search', () => {
  test('results for "Pliers"', async ({ page }) => {
    // The search/filters panel is collapsed on narrow viewports, so this
    // desktop-centric flow only runs on wide layouts.
    test.skip((page.viewportSize()?.width ?? 0) < 1000, 'Search panel collapsed on narrow viewports');

    const home = await new HomePage(page).open();
    await home.search('Pliers');
    await expect(page).toHaveScreenshot('search-pliers.png', { fullPage: true });
  });
});
