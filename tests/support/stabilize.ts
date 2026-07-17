import type { Page } from '@playwright/test';

/**
 * Best-effort dismissal of any consent / newsletter overlay so it never
 * pollutes a screenshot. Silent no-op when nothing is present.
 */
export async function dismissOverlays(page: Page): Promise<void> {
  const candidates = [
    '[data-test="cookie-accept"]',
    '#cookieconsent button',
    'button:has-text("Accept all")',
    'button:has-text("Accept")',
    'button:has-text("Got it")',
  ];

  for (const selector of candidates) {
    const button = page.locator(selector).first();
    if (await button.isVisible().catch(() => false)) {
      await button.click({ timeout: 2_000 }).catch(() => undefined);
    }
  }
}

/**
 * Make a page pixel-deterministic before snapshotting:
 *  - kill animations / transitions / smooth-scroll / text caret
 *  - wait for web fonts to finish loading
 *  - force lazy-loaded images into view, then wait for them to decode
 *  - settle the network
 */
export async function stabilize(page: Page): Promise<void> {
  // NB: animation-freezing and chat-widget hiding now live in
  // tests/support/visual-stabilize.css, applied by Playwright at capture time
  // via expect.toHaveScreenshot.stylePath. Here we only handle runtime concerns
  // that a stylesheet can't: fonts, lazy images and overlays.

  // Wait for web fonts (resolve to nothing serializable).
  await page.evaluate(() => document.fonts.ready.then(() => undefined));

  // Nudge lazy-loaded imagery into the viewport, then return to the top.
  await page.evaluate(async () => {
    const distance = 400;
    const delay = 50;
    for (let y = 0; y < document.body.scrollHeight; y += distance) {
      window.scrollTo(0, y);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
    window.scrollTo(0, 0);
  });

  // Wait until every <img> has SETTLED — loaded OR errored. A broken image
  // (404: complete === true but naturalWidth === 0) still counts as settled, so
  // this can't burn the full timeout on the with-bugs build, which ships
  // deliberately broken images (the old `naturalWidth > 0` predicate never went
  // true for those and ate the whole wait). Bounded and best-effort: a genuinely
  // stuck request just falls through after 5s.
  //
  // NB: do NOT `img.decode()` here — decode() waits for load, so a hanging image
  // request would never resolve and would hang the whole test to its timeout.
  await page
    .waitForFunction(() => Array.from(document.images).every((img) => img.complete), undefined, {
      timeout: 5_000,
    })
    .catch(() => undefined);

  // NB: we deliberately do NOT wait for 'networkidle' — this app keeps a chat
  // poll open, so the network is never idle. No fixed settle sleep either:
  // toHaveScreenshot re-captures until two consecutive frames are identical.
}
