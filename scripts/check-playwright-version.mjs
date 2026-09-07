// The Playwright version is pinned in FOUR places that must move in lockstep:
//
//   package.json            "@playwright/test": "1.63.0"
//   package-lock.json       the resolved version of that dependency
//   Dockerfile              FROM mcr.microsoft.com/playwright:v1.63.0-noble
//   visual-tests.yml        container image: mcr.microsoft.com/playwright:v1.63.0-noble
//
// The container image bundles the exact browser builds for one Playwright
// version; if the npm package drifts from it, Playwright refuses to launch the
// browsers (or, worse, silently renders with a different build). A Dependabot
// PR bumps only package.json + lock, so this check is what turns that into a
// loud "bump the image tags too" failure instead of a red shard.
//
// Usage: node scripts/check-playwright-version.mjs   (exit 1 on any mismatch)

import { readFileSync } from 'node:fs';

const read = (file) => readFileSync(new URL(`../${file}`, import.meta.url), 'utf8');

const pkg = JSON.parse(read('package.json'));
const lock = JSON.parse(read('package-lock.json'));

const seen = {
  'package.json': pkg.devDependencies?.['@playwright/test'],
  'package-lock.json': lock.packages?.['node_modules/@playwright/test']?.version,
  Dockerfile: read('Dockerfile').match(/^FROM mcr\.microsoft\.com\/playwright:v([\d.]+)-noble/m)?.[1],
  '.github/workflows/visual-tests.yml': read('.github/workflows/visual-tests.yml').match(
    /image:\s*mcr\.microsoft\.com\/playwright:v([\d.]+)-noble/,
  )?.[1],
};

const versions = new Set(Object.values(seen));
const table = Object.entries(seen)
  .map(([file, version]) => `  ${file.padEnd(38)} ${version ?? '<not found>'}`)
  .join('\n');

if (versions.size !== 1 || versions.has(undefined)) {
  console.error('::error::Playwright version is out of lockstep:\n' + table);
  console.error(
    '\nBump all four together (package.json + `npm install`, the Dockerfile FROM tag and the CI container image).',
  );
  process.exit(1);
}

console.log(`✅ Playwright ${[...versions][0]} is pinned consistently:\n${table}`);
