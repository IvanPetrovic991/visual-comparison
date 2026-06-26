import { test, expect } from '@playwright/test';
import { ContactPage } from '../support/pages/ContactPage';

test.describe('Contact page', () => {
  test('empty contact form', async ({ page }) => {
    await new ContactPage(page).open();
    await expect(page).toHaveScreenshot('contact-empty.png', { fullPage: true });
  });

  test('filled contact form', async ({ page }) => {
    const contact = await new ContactPage(page).open();
    await contact.fillSample();
    await expect(page).toHaveScreenshot('contact-filled.png', { fullPage: true });
  });
});
