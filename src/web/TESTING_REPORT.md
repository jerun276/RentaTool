# React Web Application Testing Report

Scope: `RentaTool/src/web` only. The Flutter app, backend implementation, and database were not tested or modified. Browser API calls in UI tests use deterministic MSW or Playwright route mocks; no production API credentials or writes were used.

## Final execution summary

| Category | Executed | Passed | Failed |
|---|---:|---:|---:|
| Vitest + React Testing Library + MSW | 19 | 19 | 0 |
| Playwright functional workflows | 20 | 20 | 0 |
| Playwright non-functional browser checks | 6 | 6 | 0 |
| **Total test cases** | **45** | **45** | **0** |

The production build passed. The tests use Chromium only. See limitations below for security and load testing that could not be completed with available tools.

## Functional testing

- **Component:** Login UI content, labels, quick-fill buttons, password visibility toggle, busy/disabled submit state.
- **Form validation:** Required credentials, malformed email, empty submit; browser E2E covers equipment title, KYC NIC/file types, booking date order, and required adjudication notes.
- **Protected routes:** Actual `ProtectedRoute` with unauthenticated, Admin, Renter, and Owner states; browser checks direct access to operations, identity, catalog, booking, and claims routes.
- **API integration:** MSW tests the real identity API client for successful login, trust score, trust ledger failure/fallback, validation-style 400, 401, 403, 404, 500, network failure, empty/unexpected payload, and loading/success/error UI.
- **UI state:** Initial form, loading, success, API error, session expired, role denied, dialog open/close, and signed-out state.
- **Error state:** Each HTTP status and network/data failure listed above is asserted against visible user feedback. No production API is called.
- **E2E:** Login and redirect-after-login; authorization header/trust-score call; role denial; logout and protected-page denial; admin navigation; catalog, booking, KYC, and claims flows.

## Non-functional testing

- **Accessibility:** axe-core Playwright WCAG 2.1 A/AA scan of login; zero violations on the final run. Accessible names and keyboard focus also checked.
- **Browser/layout:** Responsive viewport checks at 375, 768, and 1440 px and horizontal overflow guard, all in Chromium.
- **Performance:** Local Vite development page DCL timing guard under five seconds. This is a local regression check, not a production Lighthouse score or load test. Production build succeeds but emits a 631.89 kB JavaScript chunk warning (170.03 kB gzip).
- **Dependency security:** `npm audit` found 11 dependency findings: 1 critical, 6 high, and 4 moderate. The raw audit is saved in `evidence/npm-audit.json`. Several findings affect direct web dependencies and need planned dependency upgrades.
- **Not run:** k6/JMeter load or stress testing and OWASP ZAP scanning; those executables were not installed and the Docker engine was unavailable. Lighthouse was not run. Firefox and WebKit were not installed, so browser compatibility results only cover Chromium. These are open test limitations, not passes.
- **Registration:** The current web routes redirect `/register` to `/login`; no separate registration workflow exists to test.

## Defect records

### WEB-A11Y-001 — Low contrast in login notice

- **Test Case ID:** E2E-NF-AXE-01
- **Description:** The small public-account notice on the login page did not meet WCAG AA text contrast.
- **Severity / Priority:** Medium / P2
- **Steps:** Open `/login`; run the axe WCAG 2.1 A/AA scan.
- **Expected:** Contrast at least 4.5:1 for normal text.
- **Actual:** Foreground `#6b7280` on `#181c24` measured 3.53:1.
- **Evidence:** `evidence/defect-WEB-A11Y-001-observed.json` preserves the initial measured axe finding; the final axe JSON is attached to the passing test in `playwright-report/index.html`.
- **Status:** Fixed.
- **Fix:** Changed the notice text color to `#9ca3af` in `src/modules/identity/pages/LoginPage.tsx`.
- **Retest:** Passed. Final full Playwright run: 26/26 passed, including E2E-NF-AXE-01.

### WEB-SEC-001 — Vulnerable web dependency tree

- **Test Case ID:** NFR-SEC-NPM-AUDIT
- **Description:** `npm audit` reports 11 vulnerable dependency entries (1 critical, 6 high, 4 moderate), including direct development/runtime dependencies. Details and advisories are in `evidence/npm-audit.json`.
- **Severity / Priority:** Critical / P1
- **Steps:** From `RentaTool/src/web`, run `npm audit`.
- **Expected:** No known vulnerable dependency versions.
- **Actual:** 11 findings; direct affected packages include Vitest, Vite, Tailwind CSS, and React Router DOM.
- **Evidence:** `evidence/npm-audit.json`.
- **Status:** Open.
- **Fix:** Not applied. Available remediation includes major version upgrades and needs a separate compatibility/change review.
- **Retest:** Not applicable; open.

## Evidence and reproduction

- Vitest console output: `evidence/vitest-run.log`
- Vitest JUnit: `evidence/vitest-junit.xml`
- Playwright console output: `evidence/playwright-final-run.log`
- Earlier troubleshooting output: `evidence/playwright-intermediate-run.log` (contains intermediate failures; use the final log and HTML report for final results)
- Playwright HTML report: `playwright-report/index.html`
- Playwright screenshots and failure traces: `test-results/` (screenshots are attached for each final case; traces are retained on failure)
- Dependency audit JSON: `evidence/npm-audit.json`

Run from `RentaTool/src/web`:

```powershell
npm test                 # RTL/Vitest + MSW
npm run test:e2e         # Playwright, starts Vite automatically
npm run test:e2e:report  # open the latest HTML report
npm run build            # TypeScript and production build
npm audit                # dependency security audit
```

## Viva demonstration

1. Run `npm test` and explain the MSW handlers and the login success, validation, role, network, and HTTP error assertions.
2. Run `npm run test:e2e`; demonstrate protected-route redirection, admin sign-in, catalog dialog, booking validation, KYC validation, claims adjudication, and logout.
3. Open `playwright-report/index.html`; show screenshots and the axe JSON result.
4. Show the contrast defect, its text-color fix, and the passing axe retest.
5. Explain that npm audit has 11 open findings and that load testing, ZAP, Lighthouse, and non-Chromium engines remain unverified.
