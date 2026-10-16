# SE3090 Non-functional testing report

## Scope and real-system inventory

This report covers only non-functional testing. Functional unit, widget, and routine E2E suites are out of scope and are not counted as NFR evidence.

Flutter unit/widget, functional E2E, and catalog API integration cases are documented separately in `FLUTTER_TEST_REPORT.md`; those results are not counted in the NFR summary below.

- React app: `src/web` (React 18/Vite); login `/login`; protected operations, catalog, bookings, identity/KYC, claims, escrow and arbitration routes. User journeys found include login, equipment browsing/management, KYC, booking/handover, claims and escrow.
- ASP.NET Core API: `src/backend/Host/RentaTool.API`; modular Identity, Catalog, Booking and Escrow APIs. The auth endpoints are `POST /api/v1/auth/login` and `/register`; public reads include `GET /api/v1/equipment`; admin/identity endpoints include `GET /api/v1/users` (Admin role), `GET /api/v1/users/{id}` (authenticated, self/Admin).
- PostgreSQL: local Windows service `postgresql-x64-18`, configured by the API connection string. Credentials are not reproduced here.
- Flutter app: sibling repo `../RentaTool-mobile`; login/register/KYC, catalog, booking/handover and escrow/claims screens. Connected physical device: Samsung SM-E556B (Android 16, API 36; ADB serial `R9ZXA0206LN`).
- Agentic AI: `src/ai_service/main.py`, FastAPI health and `/api/v1/ai/*` routes. Python runtime was unavailable, so no live AI service test was possible.

The API was started in Development at `http://127.0.0.1:5000`; Vite served the actual React app at `http://127.0.0.1:3000`. API startup ran the existing `EnsureCreated`/schema compatibility and seed checks against the configured local PostgreSQL database. Test requests were read-only apart from an invalid login; no business records were created or changed.

## Summary

| ID | NFR Type | Component | Tool | Result |
| --- | --- | --- | --- | --- |
| NFR-PERF-001 | Performance | Web | Playwright | PASS, 230.60 ms DOMContentLoaded on latest local run |
| NFR-PERF-002 | Performance | API | curl | PASS, observed response timings |
| NFR-PERF-003 | Performance | Flutter | Flutter profile/integration tooling | NOT RUN, frame metrics not collected |
| NFR-LOAD-001 | Load | API | k6 | PASS, 280 requests, zero errors |
| NFR-STRESS-001 | Stress | API | k6 | PASS, exploratory read-only profile through 30 configured VUs; no failure observed |
| NFR-SEC-001 | Security | API | curl | PASS, tested probes only |
| NFR-SEC-002 | Security | API | curl | PASS after fix; allowlisted origin accepted, untrusted origin denied |
| NFR-SEC-003 | Security | Web/API | OWASP ZAP | BLOCKED, installer blocked by Windows security |
| NFR-SEC-004 | Security | API | dotnet build + PowerShell HTTP probes | PASS, production Swagger disabled; security headers present; unauthenticated user read 401; untrusted CORS origin denied |
| NFR-USE-001 | Usability | Web | Playwright | PASS, targeted login checks |
| NFR-USE-002 | Usability | Flutter | Flutter integration_test | PASS (limited), semantics/keyboard and viewport checks passed on Samsung Android 16 |
| NFR-A11Y-001 | Accessibility | Web | Lighthouse/axe | PASS, six scans across login default/session-expired states and three browsers; zero detected violations; Lighthouse accessibility 1.00 |
| NFR-A11Y-002 | Accessibility | Web | Playwright | PASS, limited names/focus check |
| NFR-COMP-001 | Compatibility | Web | Playwright Chromium | PASS, three viewport sizes |
| NFR-COMP-002 | Compatibility | Web | Playwright | PASS, 24 route/render/redirect checks across Chromium, Firefox, WebKit; authenticated dashboards remain outside scope |
| NFR-COMP-003 | Compatibility | Flutter | Flutter integration_test | PASS (limited), login checks passed on Android 16 at 1080x2400 |
| NFR-COMP-004 | Compatibility | Web | Playwright Chromium | PASS, login route/control render |
| NFR-REL-001 | Reliability | API | PowerShell + curl | PASS, 20/20 reads succeeded |
| NFR-REL-002 | Reliability | Flutter | Flutter integration_test | NOT RUN, repeated/offline scenario not executed |
| NFR-REC-001 | Recovery | API | PowerShell process restart + HTTP probes | PASS (limited API scope), 5 checks passed; health recovered in 1.59 seconds |

The exploratory k6 stress profile was read-only and reached a measured maximum of 29 active VUs out of 30 configured. It is not a capacity certification because no expected production load or SLA is specified.

## Tools used

| Tool | NFR use | Status/evidence |
| --- | --- | --- |
| Playwright Test + Chromium/Firefox/WebKit | Web usability, responsive layout, axe scan, compatibility and navigation timing assertion | Executed; three-browser checks passed; screenshots/output under `src/web/test-results/`, `src/web/nfr-test-results/`, `evidence/web/`, and `evidence/axe-login-*.png` |
| curl.exe | Live API response timing, authentication/authorization and CORS probes | Executed; see `evidence/api-probes.txt` and `evidence/security-probes.txt` |
| k6 | Read-only API load and exploratory stress profiles | Load 1→3→5 VUs and stress 5→10→20→30 VUs executed; see `evidence/k6-summary.json` and `evidence/k6-stress-summary.json` |
| PowerShell | 20 sequential API reliability requests and CSV/JSON summary creation | Executed; see `evidence/reliability-catalog-20.csv` and `evidence/reliability-summary.json` |
| Flutter `integration_test` / `flutter test` | Mobile login semantics/keyboard usability and viewport-fit checks on Samsung SM-E556B, Android 16/API 36 | TC-NF-M01 and M02 both passed on 8 Oct; repeat/offline reliability and frame performance remain untested |
| ADB | Detect connected Android target and read model/OS information | Executed; serial `R9ZXA0206LN` |
| `dotnet run` / ASP.NET Core | Start the real API under test | Executed locally on port 5000 |
| PostgreSQL | Database dependency for the API | Local PostgreSQL service was running; no test business data was changed |
| npm/Vite | Serve the real React application | Executed locally on port 3000 |
| OWASP ZAP | Planned passive security scanning | Installer attempt was blocked by Windows security (flagged as malware/PUP); no scan report |
| Lighthouse/axe | Web accessibility and performance audit | Executed; axe had 0 detected violations in all three browsers; Lighthouse HTML/JSON saved |
| Firefox/WebKit | Cross-browser testing | Installed; login/browser and axe checks passed on both |
| Flutter profile tooling | Planned mobile performance/frame analysis | Not run; no Flutter performance result |

### CORS finding fix and retest (7 October 2026)

The original probe found that `https://untrusted.invalid` was echoed with `Access-Control-Allow-Credentials: true`. Replaced wildcard origin handling with `Cors:AllowedOrigins` configuration and `WithOrigins(...)`. Configured local origins are `localhost` and `127.0.0.1` on ports 3000 and 5173; deployments must set their actual frontend origins.

Build: `dotnet build .\Host\RentaTool.API\RentaTool.API.csproj --no-restore` succeeded with 0 warnings and 0 errors. OPTIONS retest to `/api/v1/equipment`: `http://127.0.0.1:3000` returned 204 with matching `Access-Control-Allow-Origin` and credentials headers; `https://untrusted.invalid` returned 204 with neither CORS permission header. Evidence: `evidence/cors-allowlist-retest.txt`. This verifies these CORS policy cases; it is not a replacement for ZAP or a broader security review.

### Production API security hardening and retest (8 October 2026)

Review found Swagger was enabled unconditionally because its Development-only guard included `|| true`. Removed that override so Swagger UI and its schema are exposed only in Development. The API also had no baseline browser-facing response headers, so responses now include `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, and `Referrer-Policy: no-referrer`.

`dotnet build .\src\backend\Host\RentaTool.API\RentaTool.API.csproj --no-restore` passed with 0 warnings/errors. A Production-mode runtime retest on port 5011 recorded `/health` HTTP 200; `/swagger`, `/swagger/index.html`, and `/swagger/v1/swagger.json` HTTP 404; unauthenticated `GET /api/v1/users` HTTP 401; and an untrusted-origin preflight with no allow-origin/credentials headers. All three new headers were present. Evidence: `evidence/production-security-retest.txt`. Strict-Transport-Security was absent because this local probe used plain HTTP; HTTPS deployment should enable HTTPS/HSTS at the hosting edge. Startup logged PostgreSQL password authentication failure for the locally configured `postgres` user, but the API remained responsive; no DB-backed business endpoint was used. This targeted manual evidence does not replace the blocked ZAP scan.

### API recovery test (7 October 2026)

Ran `nfr-testing/recovery/api_restart_recovery.ps1`. The script launched the local API, verified `/health` and `/api/v1/equipment` returned 200, stopped the process and observed the expected connection failure, then restarted it. `/health` returned 200 after **1.59 seconds** and the read-only equipment catalog returned 200. **All five recorded checks passed.** CSV/JSON results and process logs are in `evidence/recovery/`. This is API process recovery evidence only; browser/mobile retry behavior, recovery from an interrupted write, and mobile reconnection were not tested.

## Executed commands and results

1. API (started with the locally configured Development environment):

   ```powershell
   $env:ASPNETCORE_ENVIRONMENT='Development'; dotnet run --no-launch-profile --project src/backend/Host/RentaTool.API/RentaTool.API.csproj --urls http://127.0.0.1:5000 --verbosity quiet
   ```

   The initial sandboxed restore was denied access to NuGet (NU1301). It was retried with approved elevated execution and succeeded. API startup completed. `/health`, `/swagger/index.html`, and `/api/v1/equipment` returned HTTP 200; single-observation times were 6.88 ms, 2.20 ms, and 11.75 ms, respectively. The API startup/schema operations are the only database writes in this campaign.

2. Web server:

   ```powershell
   npm.cmd run dev -- --host 127.0.0.1
   ```

   Vite became available at `http://127.0.0.1:3000`.

3. Targeted NFR browser checks (real React page; no mocked API was needed by these page-load/layout checks):

   ```powershell
   npx.cmd playwright test e2e/nonfunctional.spec.ts --reporter=list
   ```

   Result: **5 passed**: mobile, tablet and desktop fit; login accessible names and keyboard focus; login page timing. The performance case now logs and attaches the measured navigation timing. The latest isolated retest recorded **230.60 ms DOMContentLoaded**; `src/web/evidence/nfr-performance-run.log` contains the output and the Playwright result has a `navigation-timing.json` attachment. Screenshots are in `nfr-testing/evidence/web/`; original Playwright outputs remain in `src/web/test-results/`. The existing 5,000 ms guard is not a project SLA; 230.60 ms is one local observation.

   Additional independent browser-engine check:

   ```powershell
   npx.cmd playwright test nfr-tests/browser-compat.spec.ts --config=playwright.nfr.config.ts --project=chromium
   ```

   Result: **1 passed** in Chromium; screenshot saved in `nfr-testing/evidence/web/chromium-compat-login.png` and original in `src/web/nfr-test-results/`. Its first attempt timed out while Playwright waited for an external Google font during screenshot capture. The test was adjusted to abort external font requests (as the existing NFR spec already does), then rerun successfully. This was test harness setup, not an application defect.

   After browser installation, the full login compatibility suite was run:

   ```powershell
   npx.cmd playwright test nfr-tests --config=playwright.nfr.config.ts --reporter=list
   ```

   Earlier result: **6 passed** for the original login compatibility and axe checks on Chromium, Firefox, and WebKit. Expanded full-suite rerun on 8 October: **30 passed**: six axe checks (default login and session-expired error state on three engines), 21 route checks (seven public/protected route behaviors on three engines), and three original login browser-render checks. Raw output: `src/web/evidence/nfr-expanded-web-run.log`; HTML report: `src/web/nfr-playwright-report/`; per-browser axe state JSON/screenshots: `evidence/axe-login-*` and `evidence/axe-login-session-expired-*`. Protected dashboards require authentication and were not rendered in this route/redirect matrix.

   The main NFR page suite, including its added axe test, returned six passing test lines:

   ```powershell
   npx.cmd playwright test e2e/nonfunctional.spec.ts --reporter=list
   ```

   Log: `src/web/evidence/nfr-web-playwright-final.log`. PowerShell wrapped a Node color warning as an error record, although Playwright printed **6 passed**; treat the six individual Playwright test outcomes as passed and the shell pipeline exit as non-clean.

4. Lighthouse production-preview audit:

   ```powershell
   npm.cmd run build
   npm.cmd run preview -- --host 127.0.0.1 --port 4173
   npm.cmd exec -- lighthouse http://127.0.0.1:4173/login --only-categories=accessibility,performance --output=json,html --output-path=../../nfr-testing/evidence/lighthouse-login-final --chrome-path="$chrome" --chrome-flags="--no-sandbox --ignore-certificate-errors"
   ```

   Results: Lighthouse accessibility **1.00**, performance **0.86** on the local production preview. The earlier first audit identified the Show Password hit target as 22×28 px, below the 24×24 minimum used by Lighthouse's target-size audit (accessibility score 0.95). The button hit area was enlarged in `LoginPage.tsx`; the production retest reached accessibility 1.00. axe had zero automatically detected WCAG A/AA violations before and after. Lighthouse still reports performance opportunities such as unused JavaScript; no performance SLA is defined. HTML/JSON reports: `evidence/lighthouse-login-final.report.html` and `.report.json`.

5. API load test (read-only k6 profile):

   ```powershell
   k6 run .\nfr-testing\k6\read_only.js --summary-export .\nfr-testing\evidence\k6-summary.json
   ```

   The profile sends GET requests to `/health` and `/api/v1/equipment` while ramping through 1, 3, and 5 VUs. The saved summary dated 6 October records **280 requests**, **280 checks passed**, **0 failed**, throughput **4.65 requests/s**, average response time **1.18 ms**, p95 **2.65 ms**, and maximum **28.31 ms**. No project latency SLA is defined, so this is a scenario result, not an SLA verdict. Evidence: `evidence/k6-summary.json`.

6. API security probes (equivalent calls were run individually with curl):

   ```powershell
   curl.exe -sS -o NUL -w '%{http_code}' http://127.0.0.1:5000/api/v1/users
   curl.exe -sS -o NUL -w '%{http_code}' http://127.0.0.1:5000/api/v1/users/00000000-0000-0000-0000-000000000001
   curl.exe -sS -H 'Content-Type: application/json' --data-binary '@nfr-testing/evidence/invalid-login.json' -o nfr-testing/evidence/invalid-login-response.json -w '%{http_code}' http://127.0.0.1:5000/api/v1/auth/login
   curl.exe -sS -D - -o NUL -X OPTIONS -H 'Origin: https://untrusted.invalid' -H 'Access-Control-Request-Method: GET' -H 'Access-Control-Request-Headers: authorization' http://127.0.0.1:5000/api/v1/equipment
   ```

   Results: both protected user reads and invalid login returned **401**. The original CORS probe returned **204** while echoing the arbitrary origin; this was later fixed and retested as documented above. See `evidence/security-probes.txt` for the original finding and `evidence/cors-allowlist-retest.txt` for the passing retest.

7. API reliability: a PowerShell loop sent 20 sequential read-only GETs to `/api/v1/equipment`, saving each status and elapsed time to `evidence/reliability-catalog-20.csv`. Latest run: 20/20 returned HTTP 200 with curl exit code 0. Summary: min 2.11 ms, mean 4.91 ms, p95 12.19 ms, max 38.13 ms, 0 transport/non-200 failures. The CSV stores time in seconds; the summary converts it to milliseconds. This is a small local repetition check, not a load/stress test and has no project SLA. To reproduce after starting the API:

   ```powershell
   $timings = @(); for ($i = 1; $i -le 20; $i++) { $result = & curl.exe -sS -o NUL -w '%{http_code} %{time_total}' --max-time 10 http://127.0.0.1:5000/api/v1/equipment; $parts = $result -split ' '; $timings += [pscustomobject]@{Iteration=$i; Status=[int]$parts[0]; Seconds=[double]$parts[1]} }; $timings | Export-Csv -NoTypeInformation -Path nfr-testing/evidence/reliability-catalog-20.csv
   ```

8. Flutter device NFR checks on Samsung SM-E556B (Android 16/API 36):

   ```powershell
   flutter test integration_test/auth_flow_test.dart -d R9ZXA0206LN --plain-name 'TC-NF-M01' 2>&1 | Tee-Object -FilePath 'nfr_mobile_m01_retest_20261008.txt'
   flutter test integration_test/auth_flow_test.dart -d R9ZXA0206LN --plain-name 'TC-NF-M02' 2>&1 | Tee-Object -FilePath 'nfr_mobile_m02_retest_20261008.txt'
   ```

   Both device NFR cases were rerun on 8 October and passed on Samsung SM-E556B, Android 16/API 36: TC-NF-M01 checked field semantics, password tooltip, keyboard use and layout stability; TC-NF-M02 checked viewport fit at 1080x2400. Logs: `evidence/mobile/mobile-nfr-m01-retest-20261008.log` and `evidence/mobile/mobile-nfr-m02-retest-20261008.log`.

   The existing screenshot-driver attempt failed because the project lacks a direct `package:test` dependency (`Could not find package test or file test:test`). Flutter test result logs are saved. No image file was produced by the integration screenshot hook in these two test runs.

9. Exploratory API stress test:

   ```powershell
   k6 run .\nfr-testing\k6\stress_read_only.js --summary-export .\nfr-testing\evidence\k6-stress-summary.json 2>&1 | Tee-Object -FilePath .\nfr-testing\evidence\k6-stress-run.log
   ```

   Stages ramped 5→10→20→30 configured VUs, then down to zero, for 70 seconds. The run recorded **3,780 requests**, **3,780 successful checks**, **0 failed requests**, peak observed **29 VUs**, average request duration **1.78 ms**, p95 **4.51 ms**, max **163.69 ms**, throughput **53.68 requests/s**. After ramp-down, `GET /health` returned 200 in 0.85 ms and `GET /api/v1/equipment` returned 200 in 3.63 ms. Evidence: `evidence/k6-stress-summary.json`, `evidence/k6-stress-run.log`, and `evidence/stress-post-run-probe.txt`. This is a moderate exploratory local stress profile, not a validated system capacity limit. No outage was introduced, so this does not establish recovery after a failure.

## Defect found

**DEF-NFR-001 — NFR-SEC-002 — FIXED AND RETESTED**

- Original finding: API CORS permitted arbitrary origins with credentials.
- Severity: Medium (configuration weakness; browser-based cross-origin exposure depends on authenticated browser context and endpoint data sensitivity).
- Priority: High; deployment origins must be explicitly configured for each environment.
- Reproduction: send OPTIONS to `/api/v1/equipment` with `Origin: https://untrusted.invalid`, requested method GET, and Authorization header. See `evidence/security-probes.txt`.
- Expected: untrusted origin receives no credentialed CORS permission.
- Actual before fix: HTTP 204; arbitrary origin echoed with credentials allowed.
- Fix: replaced wildcard origin handling with configured `Cors:AllowedOrigins` and `WithOrigins(...)`.
- Retest: `http://127.0.0.1:3000` received matching allow-origin and credentials headers; `https://untrusted.invalid` received neither. See `evidence/cors-allowlist-retest.txt`.
- Deployment action: configure the exact production web/mobile origins for each environment before deployment.

**DEF-NFR-002 â€” API response headers and Production Swagger exposure â€” FIXED AND RETESTED**

- Finding: Swagger was available regardless of environment and baseline response headers were absent.
- Fix: Swagger middleware now runs only in Development; added `nosniff`, `DENY` frame options, and `no-referrer` response headers.
- Retest: Production Swagger paths returned 404; `/health` included all three headers; protected user list returned 401; untrusted CORS preflight received no permission headers.
- Evidence: `evidence/production-security-retest.txt`.
- Limitation: OWASP ZAP remains blocked, and this local HTTP check does not assess HTTPS deployment configuration.

No additional defects were inferred from unavailable scans or test categories.

**WEB-NFR-A11Y-002 — Fixed and retested:** Lighthouse identified the Show Password button as an undersized touch target (22×28 px). The button now has a 24×24 px minimum hit area. The production-preview Lighthouse accessibility score increased from 0.95 to 1.00; axe reported zero automatic violations in Chromium, Firefox, and WebKit. Lighthouse performance score was 0.86; remaining performance opportunities are recorded in its HTML report.

## BLOCKED checks and exact setup limits

- Load: the saved k6 summary records **280 requests** (140 health checks and 140 catalog checks); all 280 checks passed with **0 failed requests**. Throughput was 4.65 requests/s; average response time 1.18 ms, p95 2.65 ms, maximum 28.31 ms. No project-defined latency limit was found, so PASS means the scenario completed with successful endpoint checks, not that an SLA was met. Evidence: `evidence/k6-summary.json` (6 October 2026). Re-run from the RentaTool repository folder with the API running: `k6 run nfr-testing/k6/read_only.js --summary-export nfr-testing/evidence/k6-summary.json`.
- Stress: the read-only 5→10→20→30 VU exploratory profile completed without failed requests; no failure point was reached up to this level. This is not a capacity certification; expected production load and SLA remain undefined.
- ZAP: installation was attempted through winget, but Windows security blocked the official ZAP installer download as containing malware or potentially unwanted software. No workaround/bypass was attempted; no ZAP scan/report exists.
- Accessibility: axe scanned the login default and session-expired error states in Chromium, Firefox, and WebKit (six scans); no automatically detectable violations were found. Lighthouse production preview scored accessibility 1.00 and performance 0.86. Contrast on gradient backgrounds remains incomplete for manual review; this is not total WCAG conformance.
- Browser compatibility: Chromium, Firefox, and WebKit passed 24 browser/route checks covering login, register redirect, and redirects from five protected routes. Authenticated admin dashboards and business workflows were not covered by this matrix.
- Flutter: TC-NF-M01 and M02 both passed on 8 October on Samsung SM-E556B, Android 16/API 36 (1080x2400). This covers login semantics/keyboard usability and viewport fit only. Mobile performance, repeated/offline reliability, broader workflows, and recovery remain untested.
- Recovery: API stop/restart was tested; health recovered in 1.59 seconds and catalog returned 200. Client retry UX, interrupted-write data consistency and mobile reconnection remain untested.
- AI: Python runtime and live AI service were unavailable; AI subsystem NFR behavior is not covered.

## Viva demonstration

1. Show `TEST_PLAN.md` and explain the scope limits: stress passed only at the tested level, ZAP remains blocked, Lighthouse/axe covered the login route, API recovery covered process restart, and several mobile NFR areas remain untested.
2. Open `src/web/test-results/` and show the Playwright screenshots for each viewport plus the login keyboard/name check.
3. Show `evidence/reliability-summary.json` and CSV; explain the 20 sequential read-only API calls and that this is reliability smoke evidence, not capacity evidence.
4. Re-run the two unauthenticated curl requests (both should return 401), then compare OPTIONS responses for an allowed origin and an untrusted origin. Show the CORS retest evidence and environment allowlist configuration.
5. Demonstrate `nfr-testing/k6/read_only.js` for load and `nfr-testing/k6/stress_read_only.js` for the separate staged exploratory stress run.
6. Open the Lighthouse HTML report and axe JSON/screenshots; explain the button target-size fix and the gradient contrast items axe could not determine automatically.
7. Show the ZAP installation block in the report; do not claim a ZAP scan. Show the 8 October mobile M01/M02 logs, and explain that mobile reliability/recovery/performance remain untested.
8. Run `nfr-testing/recovery/api_restart_recovery.ps1` to demonstrate the API becoming unavailable and recovering after restart; explain the client retry/mobile recovery boundary.
