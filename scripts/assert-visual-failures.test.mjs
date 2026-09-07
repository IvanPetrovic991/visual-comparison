// The CI guard is the only thing standing between a broken run and a public
// dashboard that claims the broken run "caught regressions" — so the guard
// itself is tested. Run with `npm run test:scripts` (node:test, no dependencies).

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const SCRIPT = fileURLToPath(new URL('./assert-visual-failures.mjs', import.meta.url));
const WORKDIR = mkdtempSync(join(tmpdir(), 'assert-visual-failures-'));

/** Playwright colourises error messages in CI; ESC survives into the JSON report. */
const ESC = String.fromCharCode(27);
const red = (text) => `${ESC}[31m${text}${ESC}[39m`;

const MISMATCH =
  'Error: expect(page).toHaveScreenshot(expected) failed\n\n' +
  '  Expected an image 1366px by 1888px, received 1366px by 1887px. ' +
  '12108 pixels (ratio 0.01 of all image pixels) are different.';

const STABILISE_TIMEOUT =
  'Error: expect(page).toHaveScreenshot(expected) failed\n\n  Timeout 20000ms exceeded.';

const MISSING_BASELINE =
  'Error: expect(page).toHaveScreenshot(expected) failed\n\n' +
  "  A snapshot doesn't exist at /repo/tests/visual/__screenshots__/home-grid.png, writing actual.";

const NAVIGATION_ERROR = 'Error: page.goto: net::ERR_NAME_NOT_RESOLVED at https://practicesoftware…';

/** Build a Playwright JSON report with one nested suite level, like the real one. */
function report(specs) {
  return {
    suites: [
      {
        title: 'registry.visual.spec.ts',
        suites: [
          {
            title: 'home',
            specs: specs.map(({ title, message, project = 'desktop-chromium', status }) => ({
              title,
              ok: message === undefined,
              tests: [
                {
                  projectName: project,
                  results: [
                    message === undefined
                      ? { status: status ?? 'passed' }
                      : { status: 'failed', error: { message } },
                  ],
                },
              ],
            })),
          },
        ],
      },
    ],
  };
}

function runGuard(name, contents) {
  const file = join(WORKDIR, `${name}.json`);
  writeFileSync(file, JSON.stringify(contents));
  const { status, stdout, stderr } = spawnSync(process.execPath, [SCRIPT, file], {
    encoding: 'utf8',
  });
  return { status, output: `${stdout}${stderr}` };
}

test('passes when every failure is a genuine pixel mismatch', () => {
  const { status, output } = runGuard(
    'all-mismatches',
    report([
      { title: 'home-grid', message: MISMATCH },
      { title: 'login-form', message: MISMATCH, project: 'desktop-webkit' },
    ]),
  );
  assert.equal(status, 0, output);
  assert.match(output, /2 failure\(s\)/);
});

test('sees through the ANSI colouring Playwright adds in CI', () => {
  const coloured = MISMATCH.replace('page', red('page'));
  const { status, output } = runGuard('coloured', report([{ title: 'home-grid', message: coloured }]));
  assert.equal(status, 0, output);
});

test('fails when the run produced no failures at all', () => {
  const { status, output } = runGuard('no-failures', report([{ title: 'home-grid' }]));
  assert.equal(status, 1);
  assert.match(output, /NO failures/);
});

test('fails when a test timed out instead of diffing', () => {
  // The message still names toHaveScreenshot, but nothing was ever compared —
  // publishing this as a "caught regression" is exactly what the guard prevents.
  const { status, output } = runGuard(
    'stabilise-timeout',
    report([
      { title: 'home-grid', message: MISMATCH },
      { title: 'search-pliers', message: STABILISE_TIMEOUT },
    ]),
  );
  assert.equal(status, 1);
  assert.match(output, /1 of 2 failures are NOT screenshot diffs/);
  assert.match(output, /search-pliers/);
});

test('fails when a baseline was missing rather than different', () => {
  const { status } = runGuard('missing-baseline', report([{ title: 'home-grid', message: MISSING_BASELINE }]));
  assert.equal(status, 1);
});

test('fails when the site was unreachable', () => {
  const { status, output } = runGuard('navigation', report([{ title: 'home-grid', message: NAVIGATION_ERROR }]));
  assert.equal(status, 1);
  assert.match(output, /ERR_NAME_NOT_RESOLVED/);
});

test('ignores skipped specs (they are reported as ok)', () => {
  const { status } = runGuard(
    'skipped',
    report([
      { title: 'home-grid', message: MISMATCH },
      { title: 'search-pliers', status: 'skipped' },
    ]),
  );
  assert.equal(status, 0);
});

test('fails when the report is missing entirely (the run crashed)', () => {
  const { status, stdout, stderr } = spawnSync(
    process.execPath,
    [SCRIPT, join(WORKDIR, 'does-not-exist.json')],
    { encoding: 'utf8' },
  );
  assert.equal(status, 1);
  assert.match(`${stdout}${stderr}`, /Could not read Playwright JSON report/);
});
