import { test, expect } from '../support/fixtures';
import { visualCases } from '../support/pageRegistry';

/**
 * One generated test per registry entry, multiplied across every project
 * (browser × viewport). To grow coverage, edit ../support/pageRegistry.ts —
 * this file never changes.
 */
for (const visualCase of visualCases) {
  test.describe(visualCase.category, () => {
    test(
      visualCase.name,
      { tag: visualCase.tags },
      async ({ page, homePage, productPage, contactPage, loginPage }) => {
        if (visualCase.minWidth) {
          test.skip(
            (page.viewportSize()?.width ?? 0) < visualCase.minWidth,
            `Requires viewport >= ${visualCase.minWidth}px`,
          );
        }

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
