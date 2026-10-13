# RentaTool – Final Manual Test Checklist (Viva Preparation)

Tick `[x]` when passed. Record any failure in the **Notes** column/line.
Platforms: **Mobile** (Flutter app), **Web** (Admin/Owner panel), **API** (.NET backend), **AI** (Python AI service on AWS).

## 0. Pre-Demo Setup

- [ ] Backend containers up: `docker compose -f docker-compose.prod.yml ps` → all `Up`
- [ ] AI service logs visible: `docker logs -f <ai_service_container>`
- [ ] Latest code pulled (`git pull`) and `rentatool.api` restarted
- [ ] Mobile app runs on 2 devices (Renter account + Owner account)
- [ ] Web admin panel opens, `npm run build` passes
- [ ] Test accounts ready: Renter, Owner, Staff/Admin
- [ ] At least 2 tools listed with images and price

---

## 1. Identity Module (Registration / Login / Verification)

| #    | Test Case                        | Steps                                   | Expected Result                                            | Pass |
| ---- | -------------------------------- | --------------------------------------- | ---------------------------------------------------------- | ---- |
| 1.1  | Register valid user              | Fill name, valid email, strong password | Account created, redirected to login/home                  | [x]  |
| 1.2  | Duplicate email                  | Register again with same email          | Error "email already exists"                               | [x]  |
| 1.3  | Invalid email format             | Enter `abc@`                            | Inline validation error, no API call                       | [x]  |
| 1.4  | Weak password                    | Enter `123`                             | Rejected with password rules                               | [x]  |
| 1.5  | Empty fields                     | Submit blank form                       | Required-field errors shown                                | [x]  |
| 1.6  | Valid login                      | Correct credentials                     | JWT issued, home screen loads                              | [x]  |
| 1.7  | Wrong password                   | Wrong password                          | "Invalid credentials", no token                            | [x]  |
| 1.8  | Unknown user login               | Non-existent email                      | Same generic error (no user enumeration)                   | [x]  |
| 1.9  | Token persistence                | Close and reopen app                    | Still logged in                                            | [x]  |
| 1.10 | Logout                           | Tap logout                              | Token cleared, back to login; back button doesn't re-enter | [x]  |
| 1.11 | Protected endpoint without token | Call API w/o Authorization              | `401 Unauthorized`                                         | [x]  |
| 1.12 | Role restriction                 | Renter calls admin endpoint             | `403 Forbidden`                                            | [x]  |
| 1.13 | Identity verification submit     | Upload NIC/ID document                  | Status = Pending                                           | [x]  |
| 1.14 | Admin approves identity          | Admin panel → approve                   | User status = Verified; mobile reflects it                 | [x]  |
| 1.15 | Unverified user rents            | Unverified renter tries to book         | Blocked with verification prompt                           | [x]  |

## 2. Catalog Module (Tools)

| #    | Test Case                                                        | Expected Result                                   | Pass |
| ---- | ---------------------------------------------------------------- | ------------------------------------------------- | ---- |
| 2.1  | Owner creates tool (title, category, price/day, deposit, images) | Tool appears in catalog                           | [x]  |
| 2.2  | Negative / zero price                                            | Validation error                                  | [x]  |
| 2.3  | Missing required field                                           | Validation error                                  | [x]  |
| 2.4  | Search by keyword                                                | Only matching tools listed                        | [x]  |
| 2.5  | Filter by category / price                                       | Correct filtered list                             | [x]  |
| 2.6  | Tool detail view                                                 | Shows images, price, deposit, owner, availability | [x]  |
| 2.7  | Owner edits own tool                                             | Changes saved & visible                           | [x]  |
| 2.8  | Owner edits another owner's tool (API)                           | `403/404`                                         | [x]  |
| 2.9  | Owner deletes/deactivates tool                                   | No longer bookable                                | [ ]  |
| 2.10 | Renter views own listing                                         | Cannot book own tool                              | [x]  |

## 3. Booking Module

| #    | Test Case                                                  | Expected Result                             | Pass |
| ---- | ---------------------------------------------------------- | ------------------------------------------- | ---- |
| 3.1  | Select valid date range                                    | Total = days × daily rate (verify manually) | [x]  |
| 3.2  | End date before start date                                 | Rejected                                    | [x]  |
| 3.3  | Past start date                                            | Rejected                                    | [x]  |
| 3.4  | Overlapping dates with existing confirmed booking          | Rejected "not available"                    | [x]  |
| 3.5  | Create booking request                                     | Status = **Pending**; owner notified        | [x]  |
| 3.6  | Owner accepts                                              | Status = **Confirmed**; renter sees QR      | [x]  |
| 3.7  | Owner rejects                                              | Status = Rejected/Cancelled; dates freed    | [x]  |
| 3.8  | Renter cancels pending booking                             | Cancelled; dates freed                      | [ ]  |
| 3.9  | Booking list per role                                      | Renter sees own, Owner sees incoming        | [x]  |
| 3.10 | Invalid state transition (e.g. complete a Pending booking) | Rejected by API                             | [ ]  |

## 4. QR Handover Flow (Confirmed → Active → Completed)

| #   | Test Case                                    | Expected Result                             | Pass |
| --- | -------------------------------------------- | ------------------------------------------- | ---- |
| 4.1 | QR visible in **Confirmed** state            | QR displayed on booking details             | [x]  |
| 4.2 | QR visible in **Active** state               | QR displayed (for return)                   | [x]  |
| 4.3 | QR NOT shown for Pending/Cancelled/Completed | Hidden                                      | [ ]  |
| 4.4 | Owner scans pickup QR                        | Booking → **Active**                        | [ ]  |
| 4.5 | Owner scans return QR                        | Booking → **Completed** / return inspection | [ ]  |
| 4.6 | Scan random/invalid QR                       | Error, no state change                      | [ ]  |
| 4.7 | Scan QR of different booking/owner           | Rejected                                    | [ ]  |
| 4.8 | Re-scan used pickup QR                       | Rejected (no double transition)             | [ ]  |
| 4.9 | Camera permission denied                     | Friendly message                            | [ ]  |

## 5. Escrow / Payment Module

| #   | Test Case                   | Expected Result                                       | Pass |
| --- | --------------------------- | ----------------------------------------------------- | ---- |
| 5.1 | Pay rental + deposit        | Funds held in escrow; status Held                     | [ ]  |
| 5.2 | Amount = rental + deposit   | Matches calculation                                   | [ ]  |
| 5.3 | Failed/insufficient payment | Booking not confirmed                                 | [ ]  |
| 5.4 | No damage on return         | Full deposit refunded to renter; rental paid to owner | [ ]  |
| 5.5 | Escrow released only once   | Second release attempt rejected                       | [ ]  |
| 5.6 | Cancellation before pickup  | Refund per policy                                     | [ ]  |
| 5.7 | Ledger/transaction history  | Entries match each movement                           | [ ]  |

## 6. Damage Claim Flow

| #    | Test Case                                                                                                                 | Expected Result                                                                | Pass |
| ---- | ------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ | ---- |
| 6.1  | Owner files claim with description + photos + amount                                                                      | Claim status = Submitted → AI evaluation                                       | [ ]  |
| 6.2  | Claim amount > deposit                                                                                                    | Capped/validated                                                               | [ ]  |
| 6.3  | Claim amount ≤ 0                                                                                                          | Rejected                                                                       | [ ]  |
| 6.4  | Claim on non-completed booking                                                                                            | Rejected                                                                       | [ ]  |
| 6.5  | Duplicate claim for same booking                                                                                          | Rejected                                                                       | [ ]  |
| 6.6  | Non-owner files claim                                                                                                     | `403`                                                                          | [ ]  |
| 6.7  | AI returns proposed deduction                                                                                             | Status = **PendingStaffApproval**; `ProposedDeduction` ≥ 0 and ≤ owner claimed | [ ]  |
| 6.8  | Admin panel Arbitration Desk shows **real** values (Owner Claimed / AI Proposed Deduction / Renter Refund) – not template | Values equal DB/AI response                                                    | [ ]  |
| 6.9  | **Logic**: Refund = Deposit − Final Deduction                                                                             | e.g. Deposit 16,219.5 − 7,028 = 9,191.5 → verify                               | [ ]  |
| 6.10 | AI explanation text shown in AdjudicationNotes (not placeholder)                                                          | Matches AI service log `explanation`                                           | [ ]  |
| 6.11 | Staff approves AI deduction                                                                                               | Deduction → owner, remainder → renter, status Resolved                         | [ ]  |
| 6.12 | Staff overrides deduction with custom value                                                                               | Final amount used; refund recalculated                                         | [ ]  |
| 6.13 | Override > deposit                                                                                                        | Rejected                                                                       | [ ]  |
| 6.14 | Staff rejects claim                                                                                                       | Full deposit refunded                                                          | [ ]  |
| 6.15 | Resolve claim twice                                                                                                       | Rejected                                                                       | [ ]  |
| 6.16 | Renter/Owner opens Arbitration Desk                                                                                       | `403` / hidden                                                                 | [ ]  |
| 6.17 | AI service down                                                                                                           | Claim stays pending for manual review, no crash                                | [ ]  |

## 7. AI Service (AWS)

Run: `docker logs -f <ai_service_container>` while testing.

| #    | Test Case                                                | Expected Result                                          | Pass |
| ---- | -------------------------------------------------------- | -------------------------------------------------------- | ---- |
| 7.1  | Health endpoint `GET /health`                            | `200 OK`                                                 | [ ]  |
| 7.2  | Claim evaluation → `POST /api/v1/ai/execute-action`      | Log shows `200 OK` (no `evaluate_claim` attribute error) | [ ]  |
| 7.3  | Response contains `proposed_deduction`, `explanation`    | Both present, numeric & text                             | [ ]  |
| 7.4  | Different damage descriptions (scratch vs broken)        | Different deductions (minor < severe)                    | [ ]  |
| 7.5  | Empty/garbage description                                | Graceful result, no 500                                  | [ ]  |
| 7.6  | Deduction never exceeds claimed amount                   | Verified                                                 | [ ]  |
| 7.7  | AI chatbot / assistant (if present) answers tool queries | Relevant reply                                           | [ ]  |
| 7.8  | AI recommendation / pricing suggestion (if present)      | Reasonable value                                         | [ ]  |
| 7.9  | Missing API key / env                                    | Clear error log, API handles failure                     | [ ]  |
| 7.10 | Latency                                                  | Response within acceptable time (< ~15s)                 | [ ]  |

## 8. Notifications / Real-time

- [ ] New booking request notifies owner
- [ ] Accept/Reject notifies renter
- [ ] Claim filed/resolved notifies relevant parties
- [ ] Notification tap opens correct screen

## 9. Web Admin Panel

- [ ] `npm run build` succeeds (no TS errors)
- [ ] Login as admin works; non-admin blocked
- [ ] Identity verification page lists pending users and approve/reject works
- [ ] Catalog dashboard loads data
- [ ] Claim Arbitration Desk lists claims, details correct
- [ ] Navigation/routes have no blank pages or console errors

## 10. Mobile UI / UX

- [ ] No overflow errors on small & large screen
- [ ] Loading indicators during API calls
- [ ] Error snackbars on network failure (turn off Wi-Fi)
- [ ] Pull-to-refresh updates lists
- [ ] Back navigation correct on every screen
- [ ] Form validation messages clear
- [ ] App works on both test devices simultaneously

## 11. Security & Non-Functional

- [ ] Passwords stored hashed (check DB)
- [ ] SQL injection input (`' OR 1=1 --`) is harmless
- [ ] Expired token → redirected to login
- [ ] HTTPS / correct base URL in production build
- [ ] User cannot access another user's booking by changing ID (IDOR) → `403/404`
- [ ] Secrets not in repo

---

## 12. End-to-End Viva Demo Script (Happy Path)

1. [ ] Register Owner + Renter, admin verifies both
2. [ ] Owner lists a tool
3. [ ] Renter searches, views, books dates
4. [ ] Owner accepts → QR appears (Confirmed)
5. [ ] Renter pays → escrow holds funds
6. [ ] Owner scans QR at pickup → Active (QR still visible)
7. [ ] Return: scan QR → Completed
8. [ ] Owner files damage claim with photos
9. [ ] Show AI service log: `POST /execute-action 200 OK`
10. [ ] Admin Arbitration Desk: show real Owner Claimed / AI Proposed / Refund values + AI explanation
11. [ ] Staff approves → funds split correctly
12. [ ] Show final balances/ledger match the formula

## 13. Defect Log

| ID  | Test # | Description | Severity | Status |
| --- | ------ | ----------- | -------- | ------ |
|     |        |             |          |        |

**Tested by:** \***\*\_\_\_\_\*\*** **Date:** \***\*\_\_\_\_\*\*** **Overall result:** ☐ Pass ☐ Fail
