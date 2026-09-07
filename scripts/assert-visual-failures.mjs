// Guards the credibility of the with-bugs run (and the public Allure dashboard
// it feeds): a shard is only "green" if it failed for the RIGHT reason.
//
// The `continue-on-error` with-bugs step is EXPECTED to fail — every snapshot
// should diff against the buggy build. But a site outage, DNS error, a removed
// selector, or a plain timeout would ALSO make it fail, and the old
// outcome-only check happily passed on those — publishing navigation crashes to
// the dashboard instead of visual diffs.
//
// This asserts on the Playwright JSON report instead:
//   1. there is at least one failure (else the run proved nothing), and
//   2. EVERY failure is a screenshot comparison — no timeouts / navigation / etc.
//
// Usage: node scripts/assert-visual-failures.mjs [results.json]

import { readFileSync } from 'node:fs';

const file = process.argv[2] ?? 'results.json';

let report;
try {
  report = JSON.parse(readFileSync(file, 'utf8'));
} catch (err) {
  console.error(`::error::Could not read Playwright JSON report at "${file}": ${err.message}`);
  console.error('The with-bugs run produced no report — it likely crashed before testing.');
  process.exit(1);
}

// A screenshot MISMATCH is the one failure we WANT. Match only the comparator's
// own verdict — the pixel count, or the dimensions when the two images differ in
// size. Matching the matcher's NAME instead would wave through the failures that
// also mention `toHaveScreenshot` while comparing nothing at all: a page that
// never stabilised ("Timeout 20000ms exceeded"), or a baseline that was missing
// ("A snapshot doesn't exist at …, writing actual"). Covered by
// scripts/assert-visual-failures.test.mjs.
const SCREENSHOT_MISMATCH =
  /\d+ pixels \(ratio [\d.]+ of all image pixels\) are different|Expected an image \d+px by \d+px, received \d+px by \d+px/i;

// Playwright colourises error messages in CI, and the ANSI escapes land inside
// the JSON report (e.g. "expect(\u001b[31mpage\u001b[39m).toHaveScreenshot").
// Strip them so the markers above match the plain text, whatever the colour mode.
const stripAnsi = (text) => text.replace(/\u001b\[[0-9;]*m/g, '');

/** Walk the (recursively nested) suite tree and yield every spec. */
function* eachSpec(suite) {
  for (const spec of suite.specs ?? []) yield spec;
  for (const child of suite.suites ?? []) yield* eachSpec(child);
}

const failures = []; // { title, project, messages }
for (const suite of report.suites ?? []) {
  for (const spec of eachSpec(suite)) {
    if (spec.ok) continue; // passed / skipped specs are fine
    for (const test of spec.tests ?? []) {
      const bad = (test.results ?? []).filter(
        (r) => r.status !== 'passed' && r.status !== 'skipped',
      );
      if (bad.length === 0) continue;
      const messages = bad
        .flatMap((r) => [r.error?.message ?? '', ...(r.errors ?? []).map((e) => e.message ?? '')])
        .map(stripAnsi);
      failures.push({ title: spec.title, project: test.projectName ?? '?', messages });
    }
  }
}

if (failures.length === 0) {
  console.error(
    '::error::The with-bugs run produced NO failures. Either the clean and buggy ' +
      'builds now render identically, or the site was unreachable — the suite ' +
      'proved nothing this run.',
  );
  process.exit(1);
}

// `some`, not `every`: with retries enabled a test may carry a transient timeout
// alongside the attempt that did produce a diff — the diff is what matters.
const nonVisual = failures.filter((f) => !f.messages.some((m) => SCREENSHOT_MISMATCH.test(m)));

if (nonVisual.length > 0) {
  console.error(
    `::error::${nonVisual.length} of ${failures.length} failures are NOT screenshot ` +
      'diffs (timeout / navigation / broken selector). The demo is misreporting — ' +
      'the dashboard would show crashes, not visual regressions:',
  );
  for (const f of nonVisual) {
    const first = (f.messages.find(Boolean) ?? 'no error message').split('\n')[0];
    console.error(`  ✗ [${f.project}] ${f.title}: ${first}`);
  }
  process.exit(1);
}

console.log(
  `✅ ${failures.length} failure(s), all genuine screenshot comparison diffs — ` +
    'regressions correctly caught.',
);
