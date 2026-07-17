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

// A screenshot mismatch is the one failure we WANT. Anything else is rot.
const SCREENSHOT_MARKERS =
  /screenshot comparison failed|toHaveScreenshot|expected an image|of all image pixels/i;

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
      const messages = bad.flatMap((r) => [
        r.error?.message ?? '',
        ...(r.errors ?? []).map((e) => e.message ?? ''),
      ]);
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

const nonVisual = failures.filter(
  (f) => !f.messages.some((m) => SCREENSHOT_MARKERS.test(m)),
);

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
