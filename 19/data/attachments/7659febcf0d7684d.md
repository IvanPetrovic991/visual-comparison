# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: registry.visual.spec.ts >> auth >> login-form
- Location: tests/visual/registry.visual.spec.ts:21:5

# Error details

```
Error: expect(page).toHaveScreenshot(expected) failed

  Expected an image 1366px by 1025px, received 1366px by 895px. 97492 pixels (ratio 0.07 of all image pixels) are different.

  Snapshot: login-form.png

Call log:
  - Expect "toHaveScreenshot(login-form.png)" with timeout 20000ms
    - verifying given screenshot expectation
  - taking page screenshot
    - disabled all CSS animations
  - waiting for fonts to load...
  - fonts loaded
  - Expected an image 1366px by 1025px, received 1366px by 895px. 97492 pixels (ratio 0.07 of all image pixels) are different.
  - waiting 100ms before taking screenshot
  - taking page screenshot
    - disabled all CSS animations
  - waiting for fonts to load...
  - fonts loaded
  - captured a stable screenshot
  - Expected an image 1366px by 1025px, received 1366px by 895px. 97492 pixels (ratio 0.07 of all image pixels) are different.

```

# Page snapshot

```yaml
- generic [ref=e2]:
  - generic [ref=e3]:
    - text: View the
    - link "Documentation" [ref=e4] [cursor=pointer]:
      - /url: https://testsmith-io.github.io/practice-software-testing/#/
    - text: for this application.
  - generic [ref=e5]:
    - generic [ref=e7]:
      - generic [ref=e8]: 🐛 Bug Hunting Mode - Find & Report Bugs!
      - button "Bug Hunting Guide" [ref=e9] [cursor=pointer]
    - navigation [ref=e10]:
      - generic [ref=e11]:
        - link "Practice Software Testing - Toolshop" [ref=e12] [cursor=pointer]:
          - /url: /
        - menubar "Main menu" [ref=e15]:
          - menuitem [ref=e16]:
            - link "Home" [ref=e17] [cursor=pointer]:
              - /url: "#/contact"
          - menuitem [ref=e18]:
            - button "Categories" [ref=e19] [cursor=pointer]
          - menuitem [ref=e20]:
            - link "Contakt" [ref=e21] [cursor=pointer]:
              - /url: "#/contact"
          - menuitem [ref=e22]:
            - link "Sign in" [active] [ref=e23] [cursor=pointer]:
              - /url: "#/auth/login"
  - generic [ref=e28]:
    - heading "Login" [level=3] [ref=e29]
    - generic [ref=e30]:
      - textbox "Your E-mail *" [ref=e32]
      - generic [ref=e35]:
        - textbox "Your password *" [ref=e36]
        - button "" [ref=e38] [cursor=pointer]
      - button "Login" [ref=e41] [cursor=pointer]
      - paragraph [ref=e43]:
        - text: Not yet an account?
        - link "Register your account" [ref=e44] [cursor=pointer]:
          - /url: "#/auth/register"
        - link "Forgot your Password?" [ref=e45] [cursor=pointer]:
          - /url: "#/auth/forgot-password"
  - contentinfo [ref=e47]:
    - generic [ref=e49]:
      - generic [ref=e50]: Learn & Explore
      - generic [ref=e51]:
        - link "Learn Test Automation Hands-on courses for Playwright, Robot Framework, APIs and more" [ref=e53] [cursor=pointer]:
          - /url: https://onlinecourses.testsmith.io
          - generic [ref=e56]:
            - generic [ref=e57]: Learn Test Automation
            - text: Hands-on courses for Playwright, Robot Framework, APIs and more
        - link "API Spector Open-source API testing, mocking and contract testing" [ref=e59] [cursor=pointer]:
          - /url: https://api-spector.dev
          - generic [ref=e62]:
            - generic [ref=e63]: API Spector
            - text: Open-source API testing, mocking and contract testing
        - link "GitHub Source code, issues and contributions" [ref=e65] [cursor=pointer]:
          - /url: https://github.com/testsmith-io/practice-software-testing
          - generic [ref=e68]:
            - generic [ref=e69]: GitHub
            - text: Source code, issues and contributions
    - paragraph [ref=e71]:
      - text: This is a DEMO application, used for software testing training purpose. | Banner photo by
      - link "Barn Images" [ref=e72] [cursor=pointer]:
        - /url: https://unsplash.com/@barnimages
      - text: "on"
      - link "Unsplash" [ref=e73] [cursor=pointer]:
        - /url: https://unsplash.com/photos/t5YUoHW6zRo
      - text: .
  - button "Open chat" [ref=e75] [cursor=pointer]
```

# Test source

```ts
  1  | import { test, expect } from '../support/fixtures';
  2  | import { visualCases } from '../support/pageRegistry';
  3  | 
  4  | /**
  5  |  * One generated test per registry entry, multiplied across every project
  6  |  * (browser × viewport). To grow coverage, edit ../support/pageRegistry.ts —
  7  |  * this file never changes.
  8  |  */
  9  | for (const visualCase of visualCases) {
  10 |   test.describe(visualCase.category, () => {
  11 |     // Declaration-level skip: decided from the project's `viewport` option
  12 |     // before a browser page is ever created (still reported as "skipped").
  13 |     if (visualCase.minWidth !== undefined) {
  14 |       const minWidth = visualCase.minWidth;
  15 |       test.skip(
  16 |         ({ viewport }) => (viewport?.width ?? 0) < minWidth,
  17 |         `Requires viewport >= ${minWidth}px`,
  18 |       );
  19 |     }
  20 | 
  21 |     test(
  22 |       visualCase.name,
  23 |       { tag: visualCase.tags },
  24 |       async ({ page, homePage, productPage, contactPage, loginPage }) => {
  25 |         const fixtures = { page, homePage, productPage, contactPage, loginPage };
  26 |         await visualCase.run(fixtures);
  27 | 
> 28 |         await expect(page).toHaveScreenshot(`${visualCase.name}.png`, {
     |                            ^ Error: expect(page).toHaveScreenshot(expected) failed
  29 |           fullPage: visualCase.fullPage ?? true,
  30 |           mask: visualCase.mask?.(fixtures) ?? [],
  31 |         });
  32 |       },
  33 |     );
  34 |   });
  35 | }
  36 | 
```