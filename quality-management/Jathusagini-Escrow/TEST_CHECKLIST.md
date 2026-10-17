# Escrow & AI Arbitration Module – Quality Assurance Test Checklist

**Module:** Escrow, Payments, Damage Claims & AI Arbitration  
**Quality Engineer:** Jathusagini  
**Subject:** SE3110 – Quality Management in Software Engineering  

---

## 1. Functional Test Matrix

| Test ID | Test Scenario | Steps / Input | Expected Result | Severity | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **ESC-TC-01** | Escrow Hold Creation | Confirm booking requiring deposit & rental fee | Escrow hold record created with status `Held` | Critical | ✅ Pass |
| **ESC-TC-02** | Deposit & Rental Total Math | Compare total payment vs sum of rental and deposit | Formula holds: `Total = Rental + Deposit` | Critical | ✅ Pass |
| **ESC-TC-03** | Full Deposit Release (No Damage) | Complete booking without claims | 100% deposit refunded to renter; rental released to owner | Critical | ✅ Pass |
| **ESC-TC-04** | Prevent Double Release | Call release endpoint second time | Returns `400 Bad Request` or `409 Conflict` | High | ✅ Pass |
| **ESC-TC-05** | Owner Files Damage Claim | Owner submits claim with description, amount & photos | Claim status $\to$ `Submitted` or `PendingAI` | Critical | ✅ Pass |
| **ESC-TC-06** | Claim Amount $\le 0$ Rejection | Submit claim with negative or zero amount | Returns `400 Bad Request` | High | ✅ Pass |
| **ESC-TC-07** | Claim on Incomplete Booking | Attempt to file claim on `Pending` or `Confirmed` booking | Returns `400 Bad Request` | High | ✅ Pass |
| **ESC-TC-08** | Non-Owner Filing Claim | Renter or third-party attempts to file claim | Returns `403 Forbidden` | Critical | ✅ Pass |
| **ESC-TC-09** | AI Service Claim Evaluation | Backend triggers `POST /api/v1/ai/execute-action` | AI returns `proposed_deduction` and descriptive `explanation` | Critical | ✅ Pass |
| **ESC-TC-10** | AI Benchmark Alignment | Equipment replacement value passed to AI service | Benchmark aligns with catalog replacement value | High | ✅ Pass |
| **ESC-TC-11** | Deduction Never Exceeds Deposit | Evaluate severe damage scenario | AI deduction is capped at maximum deposit/claim amount | High | ✅ Pass |
| **ESC-TC-12** | Admin Arbitration Desk Display | Staff opens Claim Arbitration Desk | Displays real Owner Claimed, AI Proposed Deduction & Renter Refund | High | ✅ Pass |
| **ESC-TC-13** | Staff Approves AI Proposed Deduction | Staff clicks approve on Arbitration Modal | Deduction paid to owner; remaining deposit refunded to renter; status `Resolved` | Critical | ✅ Pass |
| **ESC-TC-14** | Staff Custom Deduction Override | Staff inputs manual deduction override | Recalculates `Refund = Deposit - CustomDeduction`; resolves claim | High | ✅ Pass |
| **ESC-TC-15** | Staff Rejects Claim | Staff rejects owner's claim | Full deposit returned to renter; claim marked `Rejected` | High | ✅ Pass |
| **ESC-TC-16** | Unauthenticated Claims Access | Call `/claims` without token | Returns `401 Unauthorized` | Critical | ✅ Pass |

---

## 2. Database Integration Testing (PostgreSQL)

| Test ID | Test Scenario | What It Tests | Expected Result | Status |
| :--- | :--- | :--- | :--- | :--- |
| **ESC-DB-01** | PostgreSQL Connectivity & Schema | Connects to PostgreSQL container/service | `CanConnectAsync()` returns `true` | ✅ Pass |
| **ESC-DB-02** | EscrowHold Persistence & States | Inserts deposit with precise decimals & status flow | Status flow `Held` $\to$ `Disputed` verified | ✅ Pass |
| **ESC-DB-03** | ACID Transaction Rollback | Starts explicit transaction, inserts escrow hold, rolls back | Transaction rollback preserves data integrity | ✅ Pass |

## 3. Security & Non-Functional Testing (NFR)

| Test ID | NFR Metric / Goal | Threshold / Standard | Result | Status |
| :--- | :--- | :--- | :--- | :--- |
| **ESC-SEC-01** | Staff Desk RBAC Protection | Renter or Owner opens `/api/v1/claims/all` | Returns `403 Forbidden` | ✅ Pass |
| **ESC-AI-01**   | AI Service Latency | Response time of `POST /execute-action` | $\le 15\text{ seconds}$ | ✅ Pass |
| **ESC-AI-02**   | AI Service Availability / Fallback | AI service unreachable during claim submission | System queues claim for manual staff review; no 500 crash | ✅ Pass |
| **ESC-FIN-01**  | Financial Rounding & Precision | All monetary calculations use two decimal places | No precision loss or rounding leaks | ✅ Pass |

---

## 3. Defect & Regression Log

| Defect ID | Associated Test | Description | Resolution | Status |
| :--- | :--- | :--- | :--- | :--- |
| **DEF-ESC-01** | ESC-TC-10 | AI evaluation used hardcoded benchmark rather than actual equipment replacement value | Updated AI action agent to fetch actual replacement value from equipment | Fixed |
| **DEF-ESC-02** | ESC-TC-12 | Admin arbitration desk showed mock placeholder images and static refunds | Connected real pickup photos and implemented dynamic refund calculation | Fixed |
