# Quality Management Plan – Identity & User Management Module
**Course:** SE3110: Quality Management in Software Engineering  
**Assigned Member:** Thilakshan  
**Module Focus:** Authentication, JWT Lifecycle, Token Refresh Rotation, KYC Verification, Trust Scoring & RBAC Compliance  

---

## 1. Module Scope & Architecture

The Identity Module governs all security boundaries, authentication lifecycles, and verification policies in RentaTool:
* **Backend:** `src/backend/Modules/Identity` (Controllers: `AuthController`, `KycController`, `UsersController`)
* **Persistence:** `Users`, `KycRecords`, `RefreshTokens` in PostgreSQL
* **Web Portal:** `src/web/src/modules/identity` (Admin Verification Desk, Token Interceptor, Login View)
* **Mobile App:** Flutter Authentication Provider, Secure Storage & Session Handling

---

## 2. Quality Objectives & Acceptance Criteria

1. **Confidentiality & Integrity:** Passwords must be hashed (BCrypt/Argon2); passwords must never appear in API responses or logs.
2. **Access Control (RBAC):** Protected endpoints must enforce HTTP `401 Unauthorized` without tokens and `403 Forbidden` on role violations.
3. **Session Reliability:** Refresh token rotation must seamlessly renew expired access tokens without unexpected user logout.
4. **Fraud Prevention:** Duplicate KYC document numbers must be strictly rejected across distinct users.
5. **State Machine Validity:** KYC status transitions must only flow through defined states (`Pending` $\to$ `Verified` / `Rejected` / `Flagged`).

---

## 3. How to Run the Automated Quality Tests

The automated test suite runs comprehensive security, authentication, and validation scenarios:

```powershell
# Run against Cloud Deployed Backend (AWS EC2)
python quality-management\Thilakshan-Identity\test_identity.py --url http://18.139.3.242:5000/api/v1

# Or run against Local Backend
python quality-management\Thilakshan-Identity\test_identity.py --url http://127.0.0.1:5000/api/v1
```

---

## 4. Evidence & Artifacts

Place all testing screenshots, JWT token inspection logs, Lighthouse accessibility reports, and postman exports inside the [evidence/](./evidence) directory according to [EVIDENCE_GUIDE.md](./evidence/EVIDENCE_GUIDE.md).
