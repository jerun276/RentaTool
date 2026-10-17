# Identity Module – Quality Assurance Test Checklist

**Module:** Identity & Access Management  
**Quality Engineer:** Thilakshan  
**Subject:** SE3110 – Quality Management in Software Engineering  

---

## 1. Functional Test Matrix

| Test ID | Test Scenario | Steps / Input | Expected Result | Severity | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **ID-TC-01** | Valid User Registration | `POST /auth/register` with unique email, strong password, valid name & role | Returns `201/200` with JWT and User Profile | Critical | ✅ Pass |
| **ID-TC-02** | Duplicate Email Handling | Register again with identical email | Returns `400/409` conflict error; rejects duplicate | High | ✅ Pass |
| **ID-TC-03** | Email Format Validation | Register with malformed email (e.g. `user@invalid`) | Returns `400 Bad Request` with field validation error | Medium | ✅ Pass |
| **ID-TC-04** | Password Strength Policy | Register with password `< 8` chars or weak sequence | Returns `400 Bad Request` requiring strong password | High | ✅ Pass |
| **ID-TC-05** | Valid User Authentication | `POST /auth/login` with correct email & password | Returns `200 OK` with Access Token & Refresh Token | Critical | ✅ Pass |
| **ID-TC-06** | Invalid Password Attempt | `POST /auth/login` with incorrect password | Returns `401 Unauthorized` ("Invalid email or password") | High | ✅ Pass |
| **ID-TC-07** | Non-Existent User Login | `POST /auth/login` with unknown email | Returns `401 Unauthorized` without user enumeration | Medium | ✅ Pass |
| **ID-TC-08** | Token Persistence & Extraction | Inspect issued JWT claims (Sub, Email, Role, Exp) | Claims present and signature valid | High | ✅ Pass |
| **ID-TC-09** | Refresh Token Exchange | `POST /auth/refresh-token` with valid refreshToken | Returns new access token; rotates refresh token | High | ✅ Pass |
| **ID-TC-10** | Protected Endpoint Access Control | Call protected endpoint without `Authorization` header | Returns `401 Unauthorized` | Critical | ✅ Pass |
| **ID-TC-11** | Role-Based Access Enforcement | Standard user calls Admin verification endpoint | Returns `403 Forbidden` | Critical | ✅ Pass |
| **ID-TC-12** | KYC Submission | `POST /users/kyc` with document type, valid number, photo URL | KYC record created with status `Pending` | High | ✅ Pass |
| **ID-TC-13** | Duplicate KYC Document Prevention | Submit KYC with document number already belonging to another user | Returns `400 Bad Request` rejecting duplicate document | Critical | ✅ Pass |
| **ID-TC-14** | Admin KYC Approval | Admin `PUT /users/kyc/{id}/review` with action `Approved` | KYC status updated to `Verified`; trust score increments | High | ✅ Pass |
| **ID-TC-15** | Admin KYC Rejection / Flagging | Admin rejects KYC with rejection reason | User notified, status updated to `Rejected`/`Flagged` | Medium | ✅ Pass |

---

## 2. Security & Non-Functional Testing (NFR)

| Test ID | NFR Metric / Goal | Threshold / Standard | Result | Status |
| :--- | :--- | :--- | :--- | :--- |
| **ID-SEC-01** | Password Protection in Database | Must be cryptographically hashed; no plaintext | Verified (hashed via BCrypt) | ✅ Pass |
| **ID-SEC-02** | SQL Injection Resistance | Input `' OR 1=1 --` into login/search fields | Safely parameterized; no SQL error | ✅ Pass |
| **ID-SEC-03** | Auth Response Time | `POST /auth/login` response latency | $\le 800\text{ ms}$ under normal network | ✅ Pass |
| **ID-SEC-04** | Security Headers | `X-Content-Type-Options`, `X-Frame-Options` | Present on API responses | ✅ Pass |

---

## 3. Defect & Regression Log

| Defect ID | Associated Test | Description | Resolution | Status |
| :--- | :--- | :--- | :--- | :--- |
| **DEF-ID-01** | ID-TC-06 | Mobile displayed generic network error instead of 401 message | Updated Flutter Dio error handler to extract server message | Fixed |
| **DEF-ID-02** | ID-TC-13 | Duplicate document numbers permitted across accounts | Added uniqueness constraint check in `KycService.cs` | Fixed |
