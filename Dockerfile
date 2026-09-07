# Pin to the same Playwright version as package.json so local runs render
# identically to CI — same browser builds, fonts, and OS libraries. The image
# also bundles Node 24 (see .nvmrc). scripts/check-playwright-version.mjs keeps
# this tag, package.json and the CI container image in lockstep.
FROM mcr.microsoft.com/playwright:v1.63.0-noble

WORKDIR /app

# Install dependencies first for better layer caching. `npm ci` requires the
# lockfile, so it is copied unconditionally; no dependency here needs install
# scripts, and skipping them keeps a compromised package from running code at
# build time.
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts

COPY . .

CMD ["npm", "test"]
