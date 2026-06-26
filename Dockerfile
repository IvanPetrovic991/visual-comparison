# Pin to the same Playwright version as package.json so local runs render
# identically to CI — same browser builds, fonts, and OS libraries.
FROM mcr.microsoft.com/playwright:v1.61.1-noble

WORKDIR /app

# Install dependencies first for better layer caching.
COPY package.json package-lock.json* ./
RUN npm ci

COPY . .

CMD ["npm", "test"]
