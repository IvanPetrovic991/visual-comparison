import type { Page } from '@playwright/test';
import { dismissOverlays, stabilize } from '../stabilize';

/**
 * Shared navigation + stabilization for every page object.
 * Subclasses declare their `path` and how to detect that the page is `ready()`.
 */
export abstract class BasePage {
  abstract readonly path: string;

  constructor(protected readonly page: Page) {}

  /** Resolve once the page's key content is present. */
  abstract ready(): Promise<void>;

  /** Navigate, clear overlays, wait for content, and stabilize for snapshotting. */
  async open(): Promise<this> {
    await this.page.goto(this.path, { waitUntil: 'domcontentloaded' });
    await dismissOverlays(this.page);
    await this.ready();
    await stabilize(this.page);
    return this;
  }

  /**
   * Reach a page by clicking through the app's own navigation from the home
   * page. Use this instead of `open()` for routes that a deep-link `goto()`
   * can't reach — e.g. the with-bugs deployment uses hash routing, so direct
   * navigation to `/contact` returns a server 404. Going through the UI works
   * on every deployment and exercises the real client-side router.
   */
  protected async openViaNav(navTestId: string): Promise<void> {
    await this.page.goto('/', { waitUntil: 'domcontentloaded' });
    await dismissOverlays(this.page);
    await this.page.locator('[data-test="product-name"]').first().waitFor({ state: 'visible' });

    // On narrow viewports the nav links are hidden behind a hamburger toggle.
    const toggler = this.page.locator('.navbar-toggler').first();
    if (await toggler.isVisible().catch(() => false)) {
      await toggler.click();
    }

    await this.page.locator(navTestId).click();
    await this.ready();
    await stabilize(this.page);
  }
}
