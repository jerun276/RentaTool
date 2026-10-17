# Booking Module – Quality Assurance Test Checklist

**Module:** Booking, Availability & QR Handover  
**Quality Engineer:** Nirojan  
**Subject:** SE3110 – Quality Management in Software Engineering  

---

## 1. Functional Test Matrix

| Test ID | Test Scenario | Steps / Input | Expected Result | Severity | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **BKG-TC-01** | Create Booking Request | Renter `POST /bookings` with valid equipment, start/end dates | Status = `Pending`; rental price = days $\times$ daily rate | Critical | ✅ Pass |
| **BKG-TC-02** | End Date Before Start Date | Submit booking with `endDate < startDate` | Returns `400 Bad Request` | High | ✅ Pass |
| **BKG-TC-03** | Past Date Booking | Submit booking with start date in past | Returns `400 Bad Request` | High | ✅ Pass |
| **BKG-TC-04** | Overlapping Booking Conflict | Book same equipment for overlapping dates of an existing confirmed rental | Returns `400/409 Conflict` ("Equipment not available") | Critical | ✅ Pass |
| **BKG-TC-05** | Owner Accepts Booking | Equipment Owner calls `POST /bookings/{id}/accept` | Status $\to$ `Confirmed`; pickup QR generated | Critical | ✅ Pass |
| **BKG-TC-06** | Owner Rejects Booking | Equipment Owner calls `POST /bookings/{id}/reject` | Status $\to$ `Rejected`; dates freed for other renters | High | ✅ Pass |
| **BKG-TC-07** | Renter Cancels Pending Booking | Renter calls `POST /bookings/{id}/cancel` | Status $\to$ `Cancelled`; dates released | Medium | ✅ Pass |
| **BKG-TC-08** | QR Code Visibility – Confirmed | Inspect booking response in `Confirmed` state | Pickup QR code / token visible | High | ✅ Pass |
| **BKG-TC-09** | QR Code Visibility – Active | Inspect booking response in `Active` state | Return QR code / token visible | High | ✅ Pass |
| **BKG-TC-10** | QR Code Hidden – Terminal States | Inspect booking response in `Cancelled` or `Completed` state | QR code payload is null or hidden | Medium | ✅ Pass |
| **BKG-TC-11** | Owner Scans Pickup QR | Owner scans renter's pickup QR code | Status transitions from `Confirmed` $\to$ `Active` | Critical | ✅ Pass |
| **BKG-TC-12** | Owner Scans Return QR | Owner scans return QR at equipment return | Status transitions from `Active` $\to$ `Completed` | Critical | ✅ Pass |
| **BKG-TC-13** | Re-scan Already Used QR | Owner scans already consumed pickup QR | Returns `400 Bad Request` rejecting double transition | High | ✅ Pass |
| **BKG-TC-14** | Unauthenticated Booking Access | Call `GET /bookings` without token | Returns `401 Unauthorized` | Critical | ✅ Pass |

---

## 2. Database Integration Testing (PostgreSQL)

| Test ID | Test Scenario | What It Tests | Expected Result | Status |
| :--- | :--- | :--- | :--- | :--- |
| **BKG-DB-01** | PostgreSQL Connectivity & Schema | Connects to PostgreSQL container/service | `CanConnectAsync()` returns `true` | ✅ Pass |
| **BKG-DB-02** | Booking Persistence & UTC Dates | Inserts booking with UTC date bounds and fee math | Preserved with requested status | ✅ Pass |
| **BKG-DB-03** | ACID Transaction Rollback | Starts explicit transaction, inserts booking, rolls back | Transaction rollback preserves data integrity | ✅ Pass |

## 3. Security & Non-Functional Testing (NFR)

| Test ID | NFR Metric / Goal | Threshold / Standard | Result | Status |
| :--- | :--- | :--- | :--- | :--- |
| **BKG-SEC-01** | Booking IDOR Isolation | User A calls `GET /bookings/{id}` belonging to User B | Returns `403 Forbidden` or `404 Not Found` | ✅ Pass |
| **BKG-SEC-02** | Self-Rental Prevention | Owner attempts to book their own listed equipment | Returns `400 Bad Request` | ✅ Pass |
| **BKG-PERF-01**| Booking Creation Latency | `POST /bookings` response time | $\le 600\text{ ms}$ | ✅ Pass |
| **BKG-QR-01**   | QR Code Verification Latency | Scan & verify QR handover transition | $\le 400\text{ ms}$ | ✅ Pass |

---

## 3. Defect & Regression Log

| Defect ID | Associated Test | Description | Resolution | Status |
| :--- | :--- | :--- | :--- | :--- |
| **DEF-BKG-01** | BKG-TC-01 | Bookings lacked equipment title and renter details in admin portal | Enriched `BookingResponseDto` with equipment metadata and renter info | Fixed |
| **DEF-BKG-02** | BKG-TC-11 | QR scan failed when network was slow during handover | Added retry logic and offline visual QR token confirmation | Fixed |
