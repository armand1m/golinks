---
name: golinks-testing
description: Use when testing the GoLinks application after code changes. Covers linting, type checking, unit tests, and visual verification with Playwright headless browser. Trigger when the user asks to verify changes, run tests, check if something works, or test in the browser.
---

# GoLinks Testing

## Code Quality

```bash
yarn lint              # Check formatting (Prettier)
yarn lint:fix          # Fix formatting
yarn build             # Type check + build (catches TS errors)
yarn test              # Run Jest tests
yarn test:run          # Run Jest tests sequentially
```

## Visual Verification with Playwright

The dev server must be running (see golinks-dev-environment skill).

### Navigate to pages

```
playwright_browser_navigate -> http://localhost:3000
```

### Key pages to test

- `http://localhost:3000` — home page with link table
- `http://localhost:3000/help` — help page
- `http://localhost:3000/api/graphiql` — GraphiQL IDE (dev only)

### Test a redirect

```
playwright_browser_navigate -> http://localhost:3000/gh/armand1m
```

Should redirect to `https://github.com/armand1m`.

### Verify page content

```
playwright_browser_snapshot -> check UI elements rendered correctly
```

### Test link creation

1. Navigate to home page
2. Click "Create Link" or equivalent button
3. Fill form with alias + URL
4. Submit and verify new link appears in table

## After Making Code Changes

Run this verification sequence:

1. **If `.graphql` files changed**: `yarn codegen`
2. **If migrations changed**: `dbmate up` + regenerate schema + `yarn codegen`
3. **Lint**: `yarn lint`
4. **Type check**: `yarn build`
5. **Unit tests**: `yarn test`
6. **Visual check** with Playwright on affected pages

## Testing Patterns

- Use `playwright_browser_snapshot` for accessibility-based assertions (element text, roles)
- Use `playwright_browser_take_screenshot` when visual layout matters
- Use `playwright_browser_console_messages` to check for JS errors
- Use `playwright_browser_network_requests` to debug API calls
