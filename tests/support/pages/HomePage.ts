import type { Locator } from '@playwright/test';
import { BasePage } from './BasePage';
import { stabilize } from '../stabilize';

/** Escape a product name for use inside a RegExp (names may contain '(' or '+'). */
const escapeRegExp = (text: string): string => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export class HomePage extends BasePage {
  override readonly path = '/';

  readonly productCards: Locator = this.page.getByTestId('product-name');
  readonly searchInput: Locator = this.page.getByTestId('search-query');
  readonly searchSubmit: Locator = this.page.getByTestId('search-submit');
  /** The app stamps its own result state onto the results container. */
  readonly searchResults: Locator = this.page.getByTestId('search_completed');
  readonly searchResultCount: Locator = this.page.getByTestId('search-result-count');

  override async ready(): Promise<void> {
    await this.productCards.first().waitFor({ state: 'visible' });
  }

  async search(term: string): Promise<void> {
    await this.searchInput.fill(term);
    if (await this.searchSubmit.isVisible().catch(() => false)) {
      await this.searchSubmit.click();
    } else {
      await this.searchInput.press('Enter');
    }

    // Wait on the state the app itself derives from the search response: it
    // renders the results container as `data-test="search_completed"` from
    // inside the HTTP subscribe callback (before the call it is absent, so this
    // can't match the pre-search grid).
    //
    // Deliberately NOT a `waitForResponse` predicate: the clean v5.0 build
    // searches with an HTTP `QUERY` request carrying a JSON body while the
    // with-bugs build still sends `GET ?q=`, and a wait pinned to one HTTP verb
    // silently timed out for ten weeks of CI. The DOM state is the same signal
    // without a copy of the API's shape to keep in sync.
    await this.searchResults.waitFor({ state: 'attached' });
    // `search_completed` is also set when the request FAILS. The result count
    // only renders once results actually arrived, so an API outage fails here
    // instead of quietly baselining an empty grid.
    await this.searchResultCount.waitFor({ state: 'visible' });
    await stabilize(this.page);
  }

  /**
   * Open a product by its exact name rather than position. The catalog is
   * live/reseedable, so clicking `.first()` is non-deterministic — pin the
   * snapshot to a known product so a reseed can't silently swap the page.
   * Whole-title match: a substring would let 'Pliers' open 'Combination Pliers'.
   */
  async openProductByName(name: string): Promise<void> {
    const exactTitle = new RegExp(`^\\s*${escapeRegExp(name)}\\s*$`);
    await this.productCards.filter({ hasText: exactTitle }).first().click();
  }
}
