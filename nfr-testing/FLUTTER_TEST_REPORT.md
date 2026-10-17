# RentaTool Flutter Test Report

This report records Flutter test cases and the outcomes supported by saved logs. It is text-only; screenshots are not embedded in this testing guide.

## Recorded results

| Test area | Saved evidence | Recorded result |
| --- | --- | --- |
| Unit and widget suite | `RentaTool-mobile/unit_test_output.txt` (6 October 2026) | **156 passed, 3 test files failed to load.** The failing files report `Undefined name 'main'` from the generated test listener. The latest saved broad run is not a full-suite pass. |
| Line coverage | `RentaTool-mobile/coverage/lcov.info` | **62.92%** (733 of 1,165 lines). This differs from the older mobile report's 64.46% figure. |
| Full-app Flutter web E2E | `RentaTool-mobile/e2e_output_fixed.txt` (3 October 2026) | **4 passed, 1 failed.** The login case failed with `MissingPluginException` for `flutter_secure_storage`; do not describe the suite as 5/5 passing. |
| Catalog API integration | `RentaTool-mobile/integration_test_output_flutter_xplat01.txt` (6 October 2026) | **1 test passed:** `XPLAT-01` read the shared seeded catalog. |
| Mobile login viewport | `evidence/mobile/mobile-nfr-m02-retest-20261008.log` | **TC-NF-M02 passed** on Samsung SM-E556B running Android 16/API 36 at 1080 x 2400. This is one device and one login screen. |
| Mobile login accessibility/usability | `evidence/mobile/mobile-nfr-m01-retest-20261008.log` | **TC-NF-M01 passed** on Samsung SM-E556B, Android 16/API 36. Email/password semantics labels were unique, the password visibility tooltip was present, keyboard use caused no Flutter exception, and Sign In remained reachable. |

An earlier combined unit/widget log (`RentaTool-mobile/all_tests_combined_output.txt`, 4 October) records 229 passing tests. It is historical and does not replace the later 6 October run with three test-load errors. The older `RentaTool-mobile/test_report.md` contained superseded totals; this report uses the timestamped raw output and current LCOV file.

## Flutter test cases

### Identity integration cases

These nine cases are implemented in `RentaTool-mobile/integration_test/auth_flow_test.dart`. The current saved logs do not contain a case-by-case result for this suite, so each result is marked **not verified** rather than inferred from a screenshot or a different test run.

| Case | Scenario | Expected result | Recorded result |
| --- | --- | --- | --- |
| TC-ID-01 | Reject empty or malformed login details | Required-field and email validation is shown; login service is not called | Not verified in current saved logs |
| TC-ID-02 | Reject invalid login credentials | Authentication error is shown and no token is stored | Not verified in current saved logs |
| TC-ID-03 | Login and load profile trust data | Session is stored; catalog and authenticated profile display | Not verified in current saved logs |
| TC-ID-04 | Validate required registration fields | Missing required values prevent registration | Not verified in current saved logs |
| TC-ID-05 | Validate password confirmation and phone | Invalid values show validation feedback | Not verified in current saved logs |
| TC-ID-06 | Handle a registration server error | Recoverable server error is displayed | Not verified in current saved logs |
| TC-ID-07 | Register an owner | Selected owner role is submitted and catalog opens | Not verified in current saved logs |
| TC-ID-08 | Reject an invalid Sri Lankan NIC | NIC validation prevents KYC submission | Not verified in current saved logs |
| TC-ID-09 | Require the front KYC document image | Missing image prevents KYC submission | Not verified in current saved logs |

### Mobile non-functional cases

| Case | Scenario | Expected result | Actual result | Status |
| --- | --- | --- | --- | --- |
| TC-NF-M01 | Login accessibility, field labels, keyboard use, and layout stability | Controls expose labels; keyboard use does not cause a layout exception | Passed on 8 October 2026 on Samsung SM-E556B, Android 16/API 36 | **PASS - one device/screen** |
| TC-NF-M02 | Login controls fit within the mobile viewport | Login fields and sign-in action remain visible within the viewport | Passed on 8 October 2026 at 1080 x 2400, Android 16/API 36 | **PASS - one device/screen** |

### Other Flutter flow cases

| Test case | Scenario | Recorded result |
| --- | --- | --- |
| XPLAT-01 | Read the shared seeded catalog from the API | **PASS** in the saved 6 October run |
| E2E Catalog Flow | Catalog, search, add equipment, detail, inspection, and history | Test is implemented; no matching run result was found in the saved logs |
| E2E Booking Flow | Active bookings, booking details, QR handover, scanner, and map search | Test is implemented; no matching run result was found in the saved logs |
| E2E Escrow Flow | Escrow overview, claim details, and damage claim form | Test is implemented; no matching run result was found in the saved logs |

## Rerun guide

Run commands from `C:\Users\ASUS\Desktop\Rental\RentaTool-mobile`. Connect an Android phone or emulator first and check its ID with `flutter devices`.

Run unit and widget tests with coverage:

```powershell
flutter test --coverage
```

Run the nine identity integration cases on Android:

```powershell
flutter test integration_test/auth_flow_test.dart -d <device-id> --plain-name 'TC-ID-'
```

Run the mobile NFR cases separately:

```powershell
flutter test integration_test/auth_flow_test.dart -d <device-id> --plain-name 'TC-NF-M01'
flutter test integration_test/auth_flow_test.dart -d <device-id> --plain-name 'TC-NF-M02'
```

Run the catalog API integration check with the API and its configured database available:

```powershell
flutter test integration_test/catalog_live_api_test.dart -d <device-id>
```
