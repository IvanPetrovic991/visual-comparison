import { defineConfig, devices } from '@playwright/test';
import type { ReporterDescription } from '@playwright/test';

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
/** Baselines describe the CLEAN build. Recording from anything else is a bug. */
const IS_CLEAN_TARGET = BASE_URL === CLEAN_URL;

/**
 * Allure is the SECONDARY reporter (trends/history dashboard on GitHub Pages);
 * the native HTML report stays primary for visual diffs. `environmentInfo`
 * lands on the dashboard's Environment widget so it is obvious WHICH build a
 * published run targeted.
 */
const allureReporter: ReporterDescription = [
  'allure-playwright',
  {
    resultsDir: 'allure-results',
    detail: true,
    suiteTitle: false,
    environmentInfo: { 'Target URL': BASE_URL, Node: process.version, OS: process.platform },
  },
];

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

  // Never silently create or overwrite baselines in CI — and never record from a
  // target that isn't the clean build, or `npm run test:bugs` on a fresh clone
  // would quietly enshrine the INTENTIONALLY BROKEN UI as the baseline and then
  // report success. Locally, against the clean build, missing baselines are
  // filled in. Update intentionally with `npm run baseline` / `baseline:changed`.
  updateSnapshots: IS_CI || !IS_CLEAN_TARGET ? 'none' : 'missing',

  // Reporters:
  //  - `blob`  → mergeable across shards into the native HTML report (best diff UX).
  //  - `allure-playwright` → SECONDARY: trends/history dashboard, published to
  //    GitHub Pages from CI. The native report stays primary for visual diffs.
  //  - `html`/`list` locally for instant feedback.
  reporter: IS_CI
    ? [
        ['blob'],
        allureReporter,
        // Machine-readable summary so CI can assert every with-bugs failure is a
        // real screenshot diff (not a timeout / outage) — see scripts/assert-visual-failures.mjs.
        ['json', { outputFile: 'results.json' }],
      ]
    : [['html', { open: 'never' }], ['list'], allureReporter],

  /** Defaults for every visual assertion — tune the whole suite from one place. */
  expect: {
    // Also the budget `toHaveScreenshot` gets to reach two identical consecutive
    // frames. A full-page shot of an image-heavy page on a cold CI container
    // (five browsers, parallel workers, first request to the CDN) can need well
    // over 10s to settle — too tight a budget shows up as a "failed" record step,
    // not as a slow one.
    timeout: 20_000,
    toHaveScreenshot: {
      animations: 'disabled',
      caret: 'hide',
      scale: 'css', // 1 device-pixel per CSS-pixel — identical on HiDPI/Retina CI.
      // One shared stylesheet (freeze animations, hide the chat widget) instead
      // of repeating mask arrays across every test.
      stylePath: './tests/support/visual-stabilize.css',
      // Per-pixel colour distance that still counts as "same": absorbs
      // sub-pixel anti-aliasing noise without hiding a real colour change.
      threshold: 0.2,
      // Two caps; Playwright fails on whichever is STRICTER.
      //  - the absolute cap is what bites on full-page shots (~2.6M px, where 1%
      //    would be a ~26k px budget — enough to hide a recolored button or a
      //    wrong price, which are only hundreds of px);
      //  - the ratio only becomes the stricter one on small element shots
      //    (< 100k px), where a flat 1000 px would be far too generous.
      maxDiffPixelRatio: 0.01,
      maxDiffPixels: 1000,
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
    // Ask the app to skip its own animations from page load (Bootstrap honours
    // prefers-reduced-motion); the stylePath stylesheet remains the guarantee
    // at capture time.
    reducedMotion: 'reduce',
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
