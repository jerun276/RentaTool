# SE3090 NFR run guide

This guide is for **non-functional testing only**. Run commands in PowerShell. From the repository root, use `C:\Users\ASUS\Desktop\Rental\RentaTool`. Start PostgreSQL before starting the API. The API uses its configured local database and runs its normal schema/seed checks on startup. Test calls below do not create business data.

## Tools used and their purpose

| Tool | Used for | Actual use/status |
| --- | --- | --- |
| Playwright Test | React web usability, responsive layout, axe integration, browser compatibility and page timing | Chromium, Firefox, and WebKit used; login/error-state accessibility and 24 browser/route checks passed |
| curl.exe | API response-time observations and security probes | Used against the live local API; HTTP statuses and timings were saved |
| k6 | API load and exploratory stress testing | Load 1→3→5 and stress 5→10→20→30 virtual-user profiles executed; summaries saved |
| PowerShell | Repeat the API catalog GET 20 times, collect response codes/timings, export CSV | Used; all 20 calls returned HTTP 200 |
| Flutter `integration_test` / `flutter test` | Mobile login usability and viewport-fit checks | TC-NF-M01 and M02 both passed on 8 Oct on Samsung SM-E556B, Android 16/API 36; remaining mobile performance/reliability/recovery not run |
| Android Debug Bridge (ADB) | Detect and identify the attached Android device | Used to identify serial `R9ZXA0206LN`, model and Android version |
| ASP.NET Core `dotnet run` | Run the actual API under test | Used in Development at `http://127.0.0.1:5000` |
| PostgreSQL | Database used by the actual local API | Local service was running; API startup performed its normal schema/seed checks; test requests did not modify business data |
| Vite via npm | Serve the actual React application for Playwright | Used at `http://127.0.0.1:3000`; Playwright config can start it automatically |
| OWASP ZAP | Passive web/API security scan | Installation blocked by Windows security; no scan/report exists |
| Lighthouse and axe | Web accessibility and performance audits | Ran against login; axe zero violations, Lighthouse accessibility 1.00 and performance 0.86 |
| Firefox and WebKit | Additional Playwright browser engines | Installed; login and axe checks passed |
| Flutter profile/performance tooling | Planned mobile frame/jank measurement | No performance measurement was run |

## Start services

Open PowerShell window 1, from the RentaTool repository root:

```powershell
$env:ASPNETCORE_ENVIRONMENT = "Development"
dotnet run --no-launch-profile --project .\src\backend\Host\RentaTool.API\RentaTool.API.csproj --urls http://127.0.0.1:5000
```

Leave it running for API, k6, security, and Flutter tests. Web Playwright starts Vite itself using its config, normally at `http://127.0.0.1:3000`.

## Web usability, layout, accessibility smoke, performance observation

From `C:\Users\ASUS\Desktop\Rental\RentaTool\src\web`:

```powershell
npx.cmd playwright test e2e/nonfunctional.spec.ts --reporter=list
```

This runs five real React login-page checks: mobile/tablet/desktop layouts, login accessible names and keyboard focus, and a page-render timing assertion. Previous result: **5 passed**. The timing assertion checks DOMContentLoaded under the test's existing 5-second budget; that budget is not a project SLA. The accessible-name check is a limited smoke check, not WCAG conformance.

The timing test logs the observed DOMContentLoaded duration and attaches `navigation-timing.json`. Latest isolated rerun: **230.60 ms**, test passed. Log: `src/web/evidence/nfr-performance-run.log`; this is one local observation, not an SLA.

Evidence:

- Screenshots: `RentaTool/nfr-testing/evidence/web/`
- Playwright raw output, trace, and screenshots: `RentaTool/src/web/test-results/`

## Web compatibility

Run the installed Chromium check from `src\web`:

```powershell
npx.cmd playwright test nfr-tests/browser-compat.spec.ts --config=playwright.nfr.config.ts --project=chromium
```

Previous result: **1 passed**. Screenshot: `RentaTool/nfr-testing/evidence/web/chromium-compat-login.png`.

The expanded matrix checks login, the `/register` redirect, and unauthenticated redirects from `/operations`, `/catalog`, `/bookings/tracker`, `/identity/kyc`, and `/claims` in Chromium, Firefox, and WebKit:

```powershell
Remove-Item Env:NO_COLOR -ErrorAction SilentlyContinue
npx.cmd playwright test nfr-tests --config=playwright.nfr.config.ts --reporter=list 2>&1 | Tee-Object -FilePath evidence/nfr-expanded-web-run.log
```

Latest full run on 8 October: **30 passed**—24 browser/route checks (login, register redirect, five protected-route redirects, and the original per-browser login render check) plus six axe scans across normal login and the session-expired alert state. Output log: `src/web/evidence/nfr-expanded-web-run.log`; HTML/raw output: `src/web/nfr-playwright-report/` and `src/web/nfr-test-results/`. Axe JSON/screenshots: `nfr-testing/evidence/axe-login-{chromium,firefox,webkit}.{json,png}` and `axe-login-session-expired-{chromium,firefox,webkit}.{json,png}`. The protected routes were checked while unauthenticated and correctly redirected to login; authenticated dashboard pages were not rendered.

## API performance observation

With the API running, from any PowerShell window:

```powershell
curl.exe -sS -o NUL -w "health: HTTP %{http_code}, %{time_total}s`n" http://127.0.0.1:5000/health
curl.exe -sS -o NUL -w "equipment: HTTP %{http_code}, %{time_total}s`n" http://127.0.0.1:5000/api/v1/equipment
```

Previously observed one-request results were health 200/6.88 ms and equipment 200/11.75 ms. These are single local observations, not an SLA. Saved initial measurements: `nfr-testing/evidence/api-probes.txt`.

## API load test (k6)

Open a second PowerShell window at the RentaTool repository root, while the API is running:

```powershell
k6 run .\nfr-testing\k6\read_only.js --summary-export .\nfr-testing\evidence\k6-summary.json
```

The prepared test ramps through 1, 3, then 5 virtual users and sends only GET requests to `/health` and `/api/v1/equipment`; it lasts about 60 seconds. The saved summary (`evidence/k6-summary.json`, dated 6 October) records **280 requests, 280 checks passed, 0 failed; 4.65 requests/s; avg 1.18 ms, p95 2.65 ms, max 28.31 ms**. No project latency limit was defined.

Evidence: `nfr-testing/evidence/k6-summary.json`. k6 console output appears in the terminal; to save a separate text log, add `2>&1 | Tee-Object -FilePath .\nfr-testing\evidence\k6-run.log` to the command.

## Stress test

Run a separate read-only exploratory profile from the RentaTool root with the API running:

```powershell
k6 run .\nfr-testing\k6\stress_read_only.js --summary-export .\nfr-testing\evidence\k6-stress-summary.json 2>&1 | Tee-Object -FilePath .\nfr-testing\evidence\k6-stress-run.log
```

Stages are 5→10→20→30 configured VUs then ramp down (70 seconds). Latest run: 3,780 requests/checks passed, 0 failed, 29 peak observed VUs, avg 1.78 ms, p95 4.51 ms, max 163.69 ms, throughput 53.68 requests/s. After ramp-down health/catalog returned HTTP 200; see `evidence/stress-post-run-probe.txt`. No errors or failure point were observed up to this test level. This is exploratory, not a capacity certification; no production load baseline or SLA is documented.

## API security probes

With the API running, from the RentaTool repository root:

```powershell
curl.exe -sS -o NUL -w "admin users without token: HTTP %{http_code}`n" http://127.0.0.1:5000/api/v1/users
curl.exe -sS -o NUL -w "user profile without token: HTTP %{http_code}`n" http://127.0.0.1:5000/api/v1/users/00000000-0000-0000-0000-000000000001
curl.exe -sS -H "Content-Type: application/json" --data-binary "@.\nfr-testing\evidence\invalid-login.json" -o .\nfr-testing\evidence\invalid-login-response.json -w "invalid login: HTTP %{http_code}`n" http://127.0.0.1:5000/api/v1/auth/login
curl.exe -sS -D - -o NUL -X OPTIONS -H "Origin: https://untrusted.invalid" -H "Access-Control-Request-Method: GET" -H "Access-Control-Request-Headers: authorization" http://127.0.0.1:5000/api/v1/equipment
```

Prior outcomes: protected user endpoints and invalid login returned 401. Run the fixed CORS check for an allowed local site and an untrusted origin:

```powershell
curl.exe -sS -D - -o NUL -X OPTIONS -H "Origin: http://127.0.0.1:3000" -H "Access-Control-Request-Method: GET" -H "Access-Control-Request-Headers: authorization" http://127.0.0.1:5000/api/v1/equipment
curl.exe -sS -D - -o NUL -X OPTIONS -H "Origin: https://untrusted.invalid" -H "Access-Control-Request-Method: GET" -H "Access-Control-Request-Headers: authorization" http://127.0.0.1:5000/api/v1/equipment
```

The allowed origin should get matching `Access-Control-Allow-Origin` and credentials headers. The untrusted origin should get neither CORS permission header. Retest output is saved in `nfr-testing/evidence/cors-allowlist-retest.txt`; the original finding is preserved in `evidence/security-probes.txt`. Configure exact production origins in the deployment environment.

## Production API hardening retest

The 8 October retest found that Swagger was previously enabled unconditionally and that baseline response headers were absent. `Program.cs` now limits Swagger to Development and adds `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, and `Referrer-Policy: no-referrer`.

Build and start the API in Production on a dedicated local port:

```powershell
dotnet build .\src\backend\Host\RentaTool.API\RentaTool.API.csproj --no-restore
$env:ASPNETCORE_ENVIRONMENT = 'Production'
dotnet .\src\backend\Host\RentaTool.API\bin\Debug\net9.0\RentaTool.API.dll --urls http://127.0.0.1:5011
```

In another PowerShell window, probe the endpoints and headers:

```powershell
curl.exe -sS -D - -o NUL http://127.0.0.1:5011/health
curl.exe -sS -o NUL -w 'swagger UI HTTP %{http_code}`n' http://127.0.0.1:5011/swagger/index.html
curl.exe -sS -o NUL -w 'swagger schema HTTP %{http_code}`n' http://127.0.0.1:5011/swagger/v1/swagger.json
curl.exe -sS -o NUL -w 'users without token HTTP %{http_code}`n' http://127.0.0.1:5011/api/v1/users
```

Expected for Production: `/health` is 200 with the three headers; both Swagger paths are 404; protected users is 401. The recorded retest is `nfr-testing/evidence/production-security-retest.txt`. HSTS is not returned over this plain HTTP localhost test; enable HTTPS/HSTS at the real hosting edge. PostgreSQL credentials must be valid for database-backed API checks. These probes are not a replacement for ZAP.
## OWASP ZAP security scan

**Not run.** Winget began installing ZAP 2.17, but Windows security blocked the downloaded installer, labeling it malware or potentially unwanted software. I did not bypass that protection. No ZAP report exists. If resolved through your approved security software process, run a passive baseline scan against local web/API and save reports under `nfr-testing/evidence/`. Do not claim a ZAP result until the scan is executed.

## API reliability repetition

With the API running, from `C:\Users\ASUS\Desktop\Rental\RentaTool`:

```powershell
$timings = @()
for ($i = 1; $i -le 20; $i++) {
    $result = & curl.exe -sS -o NUL -w '%{http_code} %{time_total}' --max-time 10 http://127.0.0.1:5000/api/v1/equipment
    $parts = $result -split ' '
    $timings += [pscustomobject]@{ Iteration = $i; Status = [int]$parts[0]; Seconds = [double]$parts[1] }
}
$timings | Export-Csv -NoTypeInformation -Path .\nfr-testing\evidence\reliability-catalog-20.csv
```

This is a small sequential repeatability check, not a load test. Inspect each response status and duration in the CSV; the existing summary is `nfr-testing/evidence/reliability-summary.json`.

## Accessibility audit

Dependencies and test harness are installed. Run axe against the login page in all three browsers:

```powershell
cd C:\Users\ASUS\Desktop\Rental\RentaTool\src\web
npx.cmd playwright test nfr-tests/accessibility.spec.ts --config=playwright.nfr.config.ts --reporter=list
```

Latest run: zero automatically detectable WCAG A/AA violations in Chromium, Firefox and WebKit. To repeat Lighthouse, first build and run `npm.cmd run preview -- --host 127.0.0.1 --port 4173` in a separate terminal, then run:

```powershell
$chrome = node -e "console.log(require('playwright').chromium.executablePath())"
npm.cmd exec -- lighthouse http://127.0.0.1:4173/login --only-categories=accessibility,performance --output=json,html --output-path=../../nfr-testing/evidence/lighthouse-login-final --chrome-path="$chrome" --chrome-flags="--no-sandbox --ignore-certificate-errors"
```

Latest production-preview scores: accessibility **1.00**, performance **0.86**. The password visibility button was enlarged after Lighthouse initially reported its hit area as 22×28 px; the retest reports no target-size failure. Evidence: `evidence/lighthouse-login-final.report.{html,json}`, `evidence/axe-login-{chromium,firefox,webkit}.{json,png}`. Axe marked several gradient contrast checks incomplete, so manual review remains useful. This audit covers `/login` only and is not a full conformance certificate.

## Flutter unit, widget, integration, and mobile UI checks

The Flutter project is the sibling folder `C:\Users\ASUS\Desktop\Rental\RentaTool-mobile`. See `FLUTTER_TEST_REPORT.md` for the test cases and recorded outcomes. Its results are based on timestamped raw logs and the saved LCOV file; the older mobile `test_report.md` totals are superseded.

The historical Android target was Samsung SM-E556B, Android 16/API 36, ADB serial `R9ZXA0206LN`. On 8 October, the connected phone completed both M01 and M02 successfully (SM-E556B, Android 16/API 36, 1080x2400). Logs: `nfr-testing/evidence/mobile/mobile-nfr-m01-retest-20261008.log` and `mobile-nfr-m02-retest-20261008.log`.

Connect an Android phone or emulator and identify it with `flutter devices`. Run commands from the Flutter project root:

```powershell
flutter test --coverage
flutter test integration_test/auth_flow_test.dart -d <device-id> --plain-name 'TC-ID-'
flutter test integration_test/auth_flow_test.dart -d <device-id> --plain-name 'TC-NF-M01'
flutter test integration_test/auth_flow_test.dart -d <device-id> --plain-name 'TC-NF-M02'
flutter test integration_test/catalog_live_api_test.dart -d <device-id>
```

Latest saved statuses: the broad unit/widget output recorded 156 passes and 3 test-file load errors; the catalog API case passed; on 8 October, TC-NF-M01 and M02 both passed on Samsung SM-E556B, Android 16/API 36. Logs: `evidence/mobile/mobile-nfr-m01-retest-20261008.log` and `evidence/mobile/mobile-nfr-m02-retest-20261008.log`.

## API recovery test

The API process restart recovery scenario is implemented and was executed. To repeat it, first make sure no API is already using port 5000. The script starts and stops only the API process it launches; it refuses to run if the port is occupied. PostgreSQL must be running because the API performs its configured startup checks.

From the RentaTool repository root:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\nfr-testing\recovery\api_restart_recovery.ps1
```

It probes `/health` and `/api/v1/equipment`, stops the local API process, confirms the health endpoint is unreachable, restarts the API, then probes health and catalog again. Latest run: all five checks passed; health recovered in 1.59 seconds. Results and API logs are written to `nfr-testing/evidence/recovery/`. This is API process recovery only; browser retry/user messaging, mobile reconnect, and data consistency across an interrupted write were not tested.

## Flutter performance and reliability

**Not run.** The current Flutter NFR cases do not collect frame/jank metrics, repeated workflow behavior, or network outage/reconnect behavior. Flutter unit/widget tests are functional tests and are not substitutes for these NFR cases. No result or screenshot should be claimed for these categories until a device-targeted test has been implemented and executed.

## Summary status

- **Executed:** web Playwright suite; Chromium/Firefox/WebKit login compatibility and axe; production Lighthouse; API timing and auth/CORS probes; k6 load and exploratory stress; API reliability loop; Flutter M01 and M02 on Android 16; the production Swagger/header security retest.
- **Fixed and retested:** login password-toggle target size; Lighthouse accessibility 1.00 and axe zero violations in the three engines; API CORS origin allowlist blocks untrusted origins.
- **Partial/blocked:** Flutter login usability/semantics and viewport fit pass on the connected Android phone (limited to one screen/device).
- **Not run/blocked:** OWASP ZAP (Windows security blocked installer), mobile performance/reliability/recovery and client retry behavior, live AI checks.

Full detailed results and the assignment test-plan matrix: `TEST_PLAN.md` and `FINAL_REPORT.md` in this folder.
