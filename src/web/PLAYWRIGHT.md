# Web UI testing with Playwright

The browser suite covers the login component, native form validation, protected-route redirects, the login and trust-score API contract, API and role errors, and the expired-session state. Non-functional browser checks cover responsive layout at mobile, tablet, and desktop widths, basic accessible names and keyboard focus, and local page-load timing. API responses are mocked, so tests are repeatable and do not need the backend or production credentials.

## Current browser test coverage

| Test file | Cases | Coverage |
|---|---:|---|
| `e2e/login.spec.ts` | 8 | Login UI and password visibility; required and malformed credentials; protected-route return; successful login and trust-score authorization; rejected credentials; non-admin denial; expired-session message. |
| `e2e/nonfunctional.spec.ts` | 6 | Mobile/tablet/desktop layout; no horizontal overflow; accessible login names and keyboard focus; local page-load timing guard; axe WCAG 2.1 A/AA scan. |
| `e2e/portal.spec.ts` | 12 | Unauthenticated protection for every admin route; Operations shell navigation and logout; Catalog empty state, equipment dialog open/close, and required title; Booking empty state, conflict tab, and date validation; Identity applicant filtering/document preview and NIC/file validation; Claims filters, adjudication dialog, and required staff notes. |

The suite currently has 26 cases. Screenshots are captured for every case and attached to the HTML report. The axe scan result is attached as JSON.

## Run

From `RentaTool/src/web`:

```powershell
npm install
npx playwright install chromium
npm run test:e2e
```

Vite starts automatically on `http://127.0.0.1:3000`. After every test, Playwright saves a full-page PNG at `test-results/<test-name>/screenshot.png` and attaches it to the HTML report. The HTML report is written to `playwright-report/`.

These are browser-level non-functional checks, not load or penetration tests. The page-load threshold measures local Vite development mode, so it is a regression guard rather than a production performance benchmark.

Open the latest report with:

```powershell
npm run test:e2e:report
```

The report and screenshots are local test artifacts; they are not committed as source files.

For SE3090 live API/database and cross-component integration cases, see [INTEGRATION_E2E_TEST_REPORT.md](INTEGRATION_E2E_TEST_REPORT.md). Those cases use the Development API and seeded PostgreSQL data; the Flutter shared-catalog test is documented separately as pending device execution.
