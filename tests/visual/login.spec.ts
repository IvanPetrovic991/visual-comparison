import { test, expect } from '@playwright/test';
import { LoginPage } from '../support/pages/LoginPage';

test.describe('Login page', () => {
  test('login form renders', async ({ page }) => {
    await new LoginPage(page).open();
    await expect(page).toHaveScreenshot('login-form.png', { fullPage: true });
  });
});
