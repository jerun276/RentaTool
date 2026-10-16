# SE3090 Non-functional testing

This folder contains only NFR test assets and evidence. The browser checks target the actual React app and the API checks use read-only health/catalog requests plus non-mutating auth/authorization probes. The local API startup uses the project's configured PostgreSQL database and normal startup schema/seed checks; no test performs a create/update/delete business operation.

## Recorded test environment

- API: ASP.NET Core, `http://127.0.0.1:5000` (Development profile), with the local PostgreSQL service.
- Web: Vite/React, `http://127.0.0.1:3000`.
- Playwright Chromium/Firefox/WebKit, k6, Lighthouse, and axe were used for the recorded checks. The Samsung SM-E556B Android 16/API 36 phone disconnected before the latest mobile retest. OWASP ZAP scanning was blocked by Windows security, and the Python/AI runtime was unavailable, so no live AI NFR checks were run. See `RUN_GUIDE.md` and `FINAL_REPORT.md` for results and limits.
- Do not report unavailable checks as passed. No numeric performance SLA was found, so timings are measurements rather than invented pass thresholds.

## Commands

For the full command-by-command guide, tools used, actual statuses, and evidence locations, see [RUN_GUIDE.md](RUN_GUIDE.md).

For Flutter unit/widget and device integration test cases, recorded results, and rerun commands, see [FLUTTER_TEST_REPORT.md](FLUTTER_TEST_REPORT.md).

Run these from `RentaTool/src/web` for web checks:

```powershell
npx playwright test e2e/nonfunctional.spec.ts --reporter=list
npx playwright install firefox webkit
npx playwright test nfr-tests/browser-compat.spec.ts --config=playwright.nfr.config.ts --project=chromium
npx playwright test nfr-tests/browser-compat.spec.ts --config=playwright.nfr.config.ts
npm exec lighthouse -- http://127.0.0.1:3000/login --only-categories=accessibility,performance --output=json --output-path=../../nfr-testing/evidence/lighthouse.json
```

Run the read-only k6 load profile from `RentaTool`:

```powershell
k6 run nfr-testing/k6/read_only.js --summary-export nfr-testing/evidence/k6-summary.json
```

Flutter NFR instrumentation and available devices are documented in the final report; keep Flutter unit/widget functional checks separate from this NFR campaign.
