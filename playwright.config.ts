import { defineConfig, devices } from '@playwright/test';

/**
 * Target under test.
 *
 * - CLEAN build  -> https://practicesoftwaretesting.com         (records baselines)
 * - BUGGY build  -> https://with-bugs.practicesoftwaretesting.com (proves regressions are caught)
 *
 * Override at runtime:  BASE_URL=https://with-bugs.practicesoftwaretesting.com npm test
 */
const CLEAN_URL = 'https://practicesoftwaretesting.com';
const BASE_URL = process.env.BASE_URL ?? CLEAN_URL;
const IS_CI = !!process.env.CI;

export default defineConfig({
  testDir: './tests/visual',

  /** All baselines live in one predictable tree, keyed by spec / project / platform. */
  snapshotPathTemplate:
    'tests/visual/__screenshots__/{testFileName}/{arg}-{projectName}-{platform}{ext}',

  // Distribute the 1000+ tests across shards/workers at test-level granularity.
  fullyParallel: true,
  forbidOnly: IS_CI,
  retries: IS_CI ? 2 : 0,
  workers: IS_CI ? '50%' : undefined,
  timeout: 60_000,

  // Never silently create or overwrite baselines in CI; locally, fill in missing ones.
  // Update intentionally with `npm run baseline` / `npm run baseline:changed`.
  updateSnapshots: IS_CI ? 'none' : 'missing',

  // Reporters:
  //  - `blob`  → mergeable across shards into the native HTML report (best diff UX).
  //  - `allure-playwright` → SECONDARY: trends/history dashboard, published to
  //    GitHub Pages from CI. The native report stays primary for visual diffs.
  //  - `html`/`list` locally for instant feedback.
  reporter: IS_CI
    ? [
        ['blob'],
        ['allure-playwright', { resultsDir: 'allure-results', detail: true, suiteTitle: false }],
      ]
    : [
        ['html', { open: 'never' }],
        ['list'],
        ['allure-playwright', { resultsDir: 'allure-results', detail: true, suiteTitle: false }],
      ],

  /** Defaults for every visual assertion — tune the whole suite from one place. */
  expect: {
    timeout: 10_000,
    toHaveScreenshot: {
      animations: 'disabled',
      caret: 'hide',
      scale: 'css', // 1 device-pixel per CSS-pixel — identical on HiDPI/Retina CI.
      // One shared stylesheet (freeze animations, hide the chat widget) instead
      // of repeating mask arrays across every test.
      stylePath: './tests/support/visual-stabilize.css',
      // Resolution-independent tolerance: absorbs anti-aliasing noise, still
      // fails on any real change. Scales sanely from component to full-page shots.
      threshold: 0.2,
      maxDiffPixelRatio: 0.01,
    },
  },

  use: {
    baseURL: BASE_URL,
    // The Toolshop app uses data-test attributes, so getByTestId() targets them.
    testIdAttribute: 'data-test',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    ignoreHTTPSErrors: true,
    // Deterministic locale / timezone / theme keep dates, numbers and colors stable.
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
