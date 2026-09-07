import type { Page } from '@playwright/test';
import { dismissOverlays, stabilize } from '../stabilize';

/**
 * Shared navigation + stabilization for every page object.
 * Subclasses declare their `path` and how to detect that the page is `ready()`.
 */
export abstract class BasePage {
  /**
   * Deep-link route used by `open()`. Leave it undefined for pages that have
   * no stable URL (product detail — ids are seeded ULIDs) and must be reached
   * through the UI; calling `open()` on such a page fails loudly instead of
   * navigating to a route that doesn't exist.
   */
  readonly path?: string;

  constructor(protected readonly page: Page) {}

  /** Resolve once the page's key content is present. */
  abstract ready(): Promise<void>;

  /** Navigate, clear overlays, wait for content, and stabilize for snapshotting. */
  async open(): Promise<this> {
    if (this.path === undefined) {
      throw new Error(
        `${this.constructor.name} has no deep-link path — reach it through the UI instead.`,
      );
    }
    await this.page.goto(this.path, { waitUntil: 'domcontentloaded' });
    await dismissOverlays(this.page);
    await this.ready();
    await stabilize(this.page);
    return this;
  }

  /**
   * Reach a page by clicking through the app's own navigation from home. Use
   * this instead of `open()` for routes a deep-link `goto()` can't reach — e.g.
   * the with-bugs deployment uses hash routing, so direct navigation to
   * `/contact` returns a server 404. Going through the UI works on every
   * deployment and exercises the real client-side router.
   */
  protected async openViaNav(navTestId: string): Promise<void> {
    await this.page.goto('/', { waitUntil: 'domcontentloaded' });
    await dismissOverlays(this.page);
    await this.page.getByTestId('product-name').first().waitFor({ state: 'visible' });

    // On narrow viewports the nav links are hidden behind a hamburger toggle.
    const toggler = this.page.locator('.navbar-toggler').first();
    if (await toggler.isVisible().catch(() => false)) {
      await toggler.click();
    }

    await this.page.getByTestId(navTestId).click();
    await this.ready();
    await stabilize(this.page);
  }
}
