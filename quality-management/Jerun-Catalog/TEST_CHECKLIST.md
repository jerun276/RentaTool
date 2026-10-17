# Catalog Module – Quality Assurance Test Checklist

**Module:** Catalog & Equipment Management  
**Quality Engineer:** Jerun  
**Subject:** SE3110 – Quality Management in Software Engineering  

---

## 1. Functional Test Matrix

| Test ID | Test Scenario | Steps / Input | Expected Result | Severity | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **CAT-TC-01** | Public Equipment Discovery | `GET /equipment` | Returns `200 OK` with paginated equipment list | Critical | ✅ Pass |
| **CAT-TC-02** | Categories Listing | `GET /categories` | Returns list of valid equipment categories | High | ✅ Pass |
| **CAT-TC-03** | Keyword Search | `GET /equipment?search=Generator` | Only matching equipment items returned | High | ✅ Pass |
| **CAT-TC-04** | Category Filtering | `GET /equipment?categoryId={id}` | Only items belonging to selected category returned | High | ✅ Pass |
| **CAT-TC-05** | Equipment Detail Retrieval | `GET /equipment/{id}` with valid ID | Returns full item details, specifications, images, and owner profile | High | ✅ Pass |
| **CAT-TC-06** | Invalid Equipment ID Handling | `GET /equipment/{random-guid}` | Returns `404 Not Found` | Medium | ✅ Pass |
| **CAT-TC-07** | Create Equipment (Valid) | Authenticated Owner `POST /equipment` with title, rate, replacement value, category | Returns `201 Created` with generated equipment ID | Critical | ✅ Pass |
| **CAT-TC-08** | Negative / Zero Daily Rate | `POST /equipment` with `dailyRate = -500` or `0` | Returns `400 Bad Request` with validation error | High | ✅ Pass |
| **CAT-TC-09** | Missing Required Fields | `POST /equipment` with missing title or category | Returns `400 Bad Request` | High | ✅ Pass |
| **CAT-TC-10** | Owner Edits Own Listing | Owner `PUT /equipment/{id}` with updated description/rate | Returns `200 OK` with updated item data | High | ✅ Pass |
| **CAT-TC-11** | Non-Owner Edits Another's Listing | User B attempts `PUT /equipment/{id}` owned by User A | Returns `403 Forbidden` | Critical | ✅ Pass |
| **CAT-TC-12** | Equipment Deletion Safety | Owner `DELETE /equipment/{id}` | Checks for active bookings; soft-deletes or removes listing safely | High | ✅ Pass |
| **CAT-TC-13** | Non-Owner Deletes Listing | Non-owner calls `DELETE /equipment/{id}` | Returns `403 Forbidden` | Critical | ✅ Pass |
| **CAT-TC-14** | Owner Verification & Trust Badge | Inspect equipment response for `ownerTrustScore` and `ownerIsVerified` | Properties correctly present and populated | Medium | ✅ Pass |

---

## 2. Database Integration Testing (PostgreSQL)

| Test ID | Test Scenario | What It Tests | Expected Result | Status |
| :--- | :--- | :--- | :--- | :--- |
| **CAT-DB-01** | PostgreSQL Connectivity & Schema | Connects to PostgreSQL container/service | `CanConnectAsync()` returns `true` | ✅ Pass |
| **CAT-DB-02** | Category Entity Persistence | Inserts and reads Category from PostgreSQL | Successfully retrieved with active status | ✅ Pass |
| **CAT-DB-03** | Equipment Precision & Specs JSON | Inserts equipment with decimal daily rate & JSONB specs | Exact decimal precision & JSON preserved | ✅ Pass |
| **CAT-DB-04** | ACID Transaction Rollback | Starts explicit transaction, inserts tool, rolls back | Transaction rollback preserves data integrity | ✅ Pass |

## 3. Security & Non-Functional Testing (NFR)

| Test ID | NFR Metric / Goal | Threshold / Standard | Result | Status |
| :--- | :--- | :--- | :--- | :--- |
| **CAT-SEC-01** | IDOR on Equipment Management | Non-owner cannot update/delete equipment by guessing ID | Returns `403 Forbidden` | ✅ Pass |
| **CAT-SEC-02** | XSS / HTML Injection in Title/Description | Submit `<script>alert(1)</script>` in description | Sanitized/encoded; no script execution in UI | ✅ Pass |
| **CAT-PERF-01**| Catalog Query Response Time | `GET /equipment` response latency | $\le 500\text{ ms}$ under 50 items | ✅ Pass |
| **CAT-NFR-01** | Paginated Payload Bounds | Response should limit payload to specified page size | Default `10` items per page verified | ✅ Pass |

---

## 3. Defect & Regression Log

| Defect ID | Associated Test | Description | Resolution | Status |
| :--- | :--- | :--- | :--- | :--- |
| **DEF-CAT-01** | CAT-TC-12 | Owner was unable to delete equipment directly | Implemented `DeleteEquipment` endpoint with active booking validation | Fixed |
| **DEF-CAT-02** | CAT-TC-14 | Owner verification badge and trust metrics missing on mobile card | Enriched `EquipmentResponseDto` with owner verification fields | Fixed |
