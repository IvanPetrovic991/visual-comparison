import { defineConfig, devices } from '@playwright/test';

/**
 * Target under test.
 *
 * - CLEAN build  -> https://practicesoftwaretesting.com        (used to record baselines)
 * - BUGGY build  -> https://with-bugs.practicesoftwaretesting.com (used to prove the suite
 *                                                                  catches real visual regressions)
 *
 * Override at runtime:  BASE_URL=https://with-bugs.practicesoftwaretesting.com npm test
 */
const CLEAN_URL = 'https://practicesoftwaretesting.com';
const BASE_URL = process.env.BASE_URL ?? CLEAN_URL;

const IS_CI = !!process.env.CI;

export default defineConfig({
  testDir: './tests/visual',

  /** All baselines live in one tidy tree, keyed by spec / project / platform. */
  snapshotPathTemplate:
    'tests/visual/__screenshots__/{testFileName}/{arg}-{projectName}-{platform}{ext}',

  fullyParallel: true,
  forbidOnly: IS_CI,
  retries: IS_CI ? 1 : 0,
  workers: IS_CI ? 2 : undefined,
  timeout: 60_000,

  reporter: IS_CI
    ? [['github'], ['html', { open: 'never' }], ['list']]
    : [['html', { open: 'never' }], ['list']],

  /** Defaults for every visual assertion. */
  expect: {
    timeout: 10_000,
    toHaveScreenshot: {
      animations: 'disabled',
      caret: 'hide',
      scale: 'css',
      // Tolerate sub-pixel anti-aliasing noise, but flag any meaningful change.
      threshold: 0.2,
      maxDiffPixelRatio: 0.01,
    },
  },

  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    ignoreHTTPSErrors: true,
    // Deterministic locale/timezone keep dates & number formats stable across machines.
    locale: 'en-US',
    timezoneId: 'UTC',
    colorScheme: 'light',
  },

  projects: [
    {
      name: 'desktop-chromium',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1366, height: 768 } },
    },
    {
      name: 'desktop-firefox',
      use: { ...devices['Desktop Firefox'], viewport: { width: 1366, height: 768 } },
    },
    {
      name: 'desktop-webkit',
      use: { ...devices['Desktop Safari'], viewport: { width: 1366, height: 768 } },
    },
    {
      // Chromium-based tablet — keeps the engine consistent with desktop-chromium.
      name: 'tablet-chromium',
      use: { ...devices['Galaxy Tab S4'] },
    },
    {
      // Chromium-based phone — fast & deterministic, ideal for CI.
      name: 'mobile-chromium',
      use: { ...devices['Pixel 7'] },
    },
  ],
});
