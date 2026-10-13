# SE3090 Integration / End-to-End Test Report

**Execution date:** 2026-10-06  
**System:** RentaTool React web, ASP.NET Core API, PostgreSQL, Flutter Android app  
**Approved E2E tools:** Playwright and Flutter `integration_test` (no additional test framework used).

## 1. Test plan and scope

Tests use implemented endpoints and screens. They cover API auth/catalog/booking/claims/escrow, browser-to-API/database integration, a booking handover business workflow, and the same catalog data on web and Flutter. The Flutter case proves only the catalog workflow; this is not evidence that every system workflow works on both platforms.

Preconditions: local PostgreSQL and Development API running; web dependencies installed; Android device authorized for the Flutter case. The Playwright runner starts the Vite web server from its configuration. Set `E2E_API_BASE_URL` when the backend is not at its default `http://127.0.0.1:5000/api/v1`.

## 2. Test cases and executed results

| Test Case ID | Feature / Workflow | Preconditions | Test Steps / Input | Expected Result | Actual Result | Pass / Fail | Evidence |
|---|---|---|---|---|---|---|---|
| API-01 | Auth and authorization API | API, DB and seeded Admin | Login; request trust score with bearer token; repeat without token; login with bad password | Valid login and authorized score return 200; missing token and invalid password return 401 | All status and response assertions matched | Pass | `evidence/integration-e2e-live-20261006.log`; Playwright HTML report |
| API-02 | Catalog API data and maintenance availability | Seeded catalog data | List equipment; get the Mikasa item details and history; batch check its availability for the specified date range | Same item ID is passed between endpoints; maintenance lockout is returned | All 200; same item ID; one requested and one locked-out item | Pass | Same Playwright log and HTML report |
| COMP-01 / WEB-API-01 | React Web → API → database → React Web catalog | Vite web, API, seeded Admin | Login in browser; open Catalog; observe API responses and seeded item | Login and equipment APIs return 200 and persisted item renders | Both APIs returned 200; item rendered | Pass | `test-results/live-web-catalog.png`; Playwright log/report |
| BIZ-01 / COMP-02 | Booking from creation through pickup and return | API, DB, seeded Renter, available listing, React web | Create booking with future dates; generate and verify pickup token; check active booking in React `/bookings/tracker`; generate and verify return token; GET saved booking | Booking moves Confirmed → Active → Completed and final GET persists Completed; web sees the same booking | API and browser assertions passed; the React booking tracker displayed the created booking ID; persisted status Completed | Pass | `test-results/live-web-booking.png`; Playwright log/report |
| API-04 | Claims API list | API and DB | GET `/api/v1/claims` | 200 with a JSON array | HTTP 500; Playwright assertion failed | Fail (product defect) | Playwright log; `test-results/integration-real-api-SE309-bf5b9-ailable-from-the-escrow-API/error-context.md` and trace |
| API-05 | Escrow booking lookup API | API and DB | GET `/api/v1/escrow/booking/{unknown-guid}` | 200 for a hold or 404 if no hold exists | HTTP 500; Playwright assertion failed | Fail (product defect) | Playwright log; `test-results/integration-real-api-SE309-5c028-old-or-a-not-found-response/error-context.md` and trace |
| XPLAT-01 | Flutter and web shared catalog data | Android device, API reachable; seeded Renter | Sign in on Flutter, open Catalog, assert Mikasa item; compare with browser catalog | Both clients render the same API-backed seeded catalog record | Flutter test passed on Android `R9ZXA0206LN`; same item visible in Playwright browser | Pass (catalog only) | `RentaTool-mobile/integration_test_output_flutter_xplat01.txt`; Playwright `test-results/live-web-catalog.png` |

**Latest live Playwright run:** 4 passed, 2 failed (API-01, API-02, COMP-02, WEB-API-01 passed; API-04, API-05 failed). The API-04/05 failures are deliberately retained in the test suite so the actual defect is visible; do not describe the full suite as passing.

## 3. Scripts and how to run

- Playwright live API and web cases: `e2e/integration-real-api.spec.ts`
- Flutter live catalog case: `RentaTool-mobile/integration_test/catalog_live_api_test.dart`

From `RentaTool/src/web`:

```powershell
$env:E2E_API_BASE_URL='http://127.0.0.1:5000/api/v1'
npm run test:e2e -- e2e/integration-real-api.spec.ts
```

If the backend uses port 5001, set that port in `E2E_API_BASE_URL`. From `RentaTool-mobile`, with an authorized Android USB device and API on host port 5000:

```powershell
& "$env:LOCALAPPDATA\Android\sdk\platform-tools\adb.exe" reverse tcp:5000 tcp:5000
flutter test integration_test/catalog_live_api_test.dart -d R9ZXA0206LN --dart-define=API_BASE_URL=http://127.0.0.1:5000/api/v1
```

Use the actual device ID from `flutter devices`. Android emulator host URL is `http://10.0.2.2:5000/api/v1`. Flutter integration tests are run on Android; this Flutter version reports web devices as unsupported for integration tests.

## 4. Defects and retests

### DEF-API-ESCROW-DB — claims and escrow endpoints return 500

- **Affected tests:** API-04, API-05.
- **Expected:** Claims list returns 200 and JSON array; unknown escrow booking returns 404 (or an existing hold returns 200).
- **Actual:** Both returned 500. Diagnostic run against the local API identified PostgreSQL `42P01` missing relations `damage_claims` and `escrow_holds`.
- **Likely cause:** `Program.cs` calls `EnsureCreated`; that does not apply later migrations to an already-created database. The project contains `20260915140529_AddEscrowModule` migration defining the missing module tables.
- **Retest:** Latest Playwright run repeated both requests and both still failed (500). No backend/database fix was applied; keep these as open defects pending proper schema migration and repeat execution.
- **Evidence:** Playwright failure contexts/traces linked in the test table; migration source `RentaTool/src/backend/BuildingBlocks/RentaTool.Shared.Infrastructure/Migrations/20260915140529_AddEscrowModule.cs`.

### RETEST-HARNESS — booking browser route

- **Issue:** Initial cross-component attempt navigated to `/bookings`, while the implemented tracker route is `/bookings/tracker`.
- **Fix:** Updated the test to use the implemented route.
- **Retest:** COMP-02 passed; it found the newly created booking ID in the React tracker. It also passed in the latest six-case suite.

### RETEST-XPLAT-HARNESS — Flutter screenshot surface

- **Issue/fix:** The earlier Android catalog test reached its screenshot step but required `convertFlutterSurfaceToImage()` first. The binding setup was corrected.
- **Retest:** Flutter log reports `+1: All tests passed!` on Android.

## 5. Important coverage limits

- Flutter automated E2E currently covers shared catalog only. It does not establish mobile booking, claims, or escrow integration.
- `RentaTool-mobile/lib/modules/escrow/services/escrow_service.dart` currently returns local sample/mock data rather than calling the backend; a mobile escrow cross-platform workflow cannot be claimed as integrated.
- Claims and escrow real APIs are blocked by missing DB relations. Booking API workflow is real and passed. Do not claim claims/escrow end-to-end completion until the schema is fixed and tests pass on retest.

## 6. Evidence locations

- Latest Playwright console output: `evidence/integration-e2e-live-20261006.log`
- Playwright report: `playwright-report/index.html` (open with a browser; it shows this run's failures)
- Playwright traces and error contexts: `test-results/`
- Browser screenshots: `test-results/live-web-catalog.png`, `test-results/live-web-booking.png`
- Flutter output: `RentaTool-mobile/integration_test_output_flutter_xplat01.txt`
- Main report: `INTEGRATION_E2E_TEST_REPORT.md`

## 7. Viva walkthrough

1. Show the test script and explain API-01 token/401 checks and API-02 data moving across catalog endpoints.
2. Run the Playwright command and open `playwright-report/index.html`; explain that 4 pass and 2 fail.
3. Show API-04/05 failure evidence and explain the missing PostgreSQL tables and migration.
4. Show the booking test: create → pickup → React tracker → return → persisted Completed state; open `live-web-booking.png`.
5. Show Flutter XPLAT-01 output and compare `live-web-catalog.png`; clearly state it covers catalog only.
6. Present the missing schema and mocked mobile escrow integration as open work; do not represent them as passed tests.
