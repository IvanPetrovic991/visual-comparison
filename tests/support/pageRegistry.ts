import type { VisualFixtures } from './fixtures';

export interface VisualCase {
  /** Feature group — used for the describe() block. */
  category: string;
  /** Stable snapshot name. Baselines key off this, so don't rename casually. */
  name: string;
  /** Playwright tags for selective runs, e.g. ['@smoke', '@visual']. */
  tags: string[];
  /** Skip on viewports narrower than this (px) — for desktop-only flows. */
  minWidth?: number;
  /** Capture the full scrollable page (default true). */
  fullPage?: boolean;
  /** Drive the app into the exact state to snapshot. */
  run: (fixtures: VisualFixtures) => Promise<void>;
}

/**
 * The single source of truth for visual coverage.
 *
 * Adding a screenshot to the suite = adding ONE entry here — no new spec file,
 * no new test function. This data-driven registry is what lets the suite scale
 * to 1000+ snapshots without 1000 hand-written tests. Each case is multiplied
 * across every project (browser × viewport) automatically.
 */
export const visualCases: VisualCase[] = [
  {
    category: 'home',
    name: 'home-grid',
    tags: ['@smoke', '@visual'],
    run: async ({ homePage }) => {
      await homePage.open();
    },
  },
  {
    category: 'catalog',
    name: 'search-pliers',
    tags: ['@visual'],
    minWidth: 1000, // search/filters panel is collapsed on narrow viewports
    run: async ({ homePage }) => {
      await homePage.open();
      await homePage.search('Pliers');
    },
  },
  {
    category: 'catalog',
    name: 'product-detail',
    tags: ['@visual'],
    run: async ({ homePage, productPage }) => {
      await homePage.open();
      await homePage.openFirstProduct();
      await productPage.waitUntilLoaded();
    },
  },
  {
    category: 'contact',
    name: 'contact-empty',
    tags: ['@smoke', '@visual'],
    run: async ({ contactPage }) => {
      await contactPage.open();
    },
  },
  {
    category: 'contact',
    name: 'contact-filled',
    tags: ['@visual'],
    run: async ({ contactPage }) => {
      await contactPage.open();
      await contactPage.fillSample();
    },
  },
  {
    category: 'auth',
    name: 'login-form',
    tags: ['@smoke', '@visual'],
    run: async ({ loginPage }) => {
      await loginPage.open();
    },
  },
];
