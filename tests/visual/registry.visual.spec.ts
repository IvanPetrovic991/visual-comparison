import { test, expect } from '../support/fixtures';
import { visualCases } from '../support/pageRegistry';

/**
 * One generated test per registry entry, multiplied across every project
 * (browser × viewport). To grow coverage, edit ../support/pageRegistry.ts —
 * this file never changes.
 */
for (const visualCase of visualCases) {
  test.describe(visualCase.category, () => {
    // Declaration-level skip: decided from the project's `viewport` option
    // before a browser page is ever created (still reported as "skipped").
    if (visualCase.minWidth !== undefined) {
      const minWidth = visualCase.minWidth;
      test.skip(
        ({ viewport }) => (viewport?.width ?? 0) < minWidth,
        `Requires viewport >= ${minWidth}px`,
      );
    }

    test(
      visualCase.name,
      { tag: visualCase.tags },
      async ({ page, homePage, productPage, contactPage, loginPage }) => {
        const fixtures = { page, homePage, productPage, contactPage, loginPage };
        await visualCase.run(fixtures);

        await expect(page).toHaveScreenshot(`${visualCase.name}.png`, {
          fullPage: visualCase.fullPage ?? true,
          mask: visualCase.mask?.(fixtures) ?? [],
        });
      },
    );
  });
}
