# Quality Management Plan – Escrow, Dispute Claims & AI Arbitration Module
**Course:** SE3110: Quality Management in Software Engineering  
**Assigned Member:** Jathusagini  
**Module Focus:** Security Deposit Holding, Escrow Releases, Damage Claims, AI Agent Service Integration, Staff Adjudication Desk & Financial Ledger Calculations  

---

## 1. Module Scope & Architecture

The Escrow and Dispute Module provides financial security and automated dispute resolution for RentaTool:
* **Backend:** `src/backend/Modules/Escrow` (Controllers: `EscrowController`, `ClaimsController`, Services: `EscrowService`, `ClaimService`)
* **AI Service (FastAPI / Gemini):** `src/ai_service` (`execute-action` endpoint, Action Agent, Vision damage assessment)
* **Persistence:** `EscrowHolds`, `DamageClaims`, `LedgerEntries` in PostgreSQL
* **Web Portal:** `src/web/src/modules/escrow` (Claim Arbitration Desk, Adjudication Modal, Real-time Dispute Metrics)
* **Mobile App:** Damage Claim Submission with photos, Deposit Refund Display

---

## 2. Quality Objectives & Acceptance Criteria

1. **Deposit Formula Validity:** Refund calculation must strictly follow:
   $$\text{Renter Refund} = \text{Security Deposit} - \text{Final Adjudicated Deduction}$$
2. **AI Action Service Health & Integration:** The AI service must respond with `200 OK`, valid `proposed_deduction`, and clear `explanation` without unhandled runtime exceptions.
3. **Claim Boundary Enforcing:** Claim amounts must be greater than zero and cannot exceed the equipment's security deposit or replacement value.
4. **Staff Override Compliance:** Staff arbiters can approve AI deductions, override with a custom deduction, or reject claims; double-resolution must be strictly blocked.
5. **Role-Based Isolation:** Renters and Owners must never have access to Staff Arbitration administrative desk endpoints (`403 Forbidden`).

---

## 3. How to Run the Automated Quality Tests

The automated test suite verifies Escrow API endpoints, Claims authorization, and the AI agent subsystem:

```powershell
# Run against Cloud Deployed Backend (AWS EC2)
python quality-management\Jathusagini-Escrow\test_escrow.py --url http://18.139.3.242:5000/api/v1

# Or run against Local Backend
python quality-management\Jathusagini-Escrow\test_escrow.py --url http://127.0.0.1:5000/api/v1
```

---

## 4. Evidence & Artifacts

Place all damage claim filing screenshots, AI service response payloads, staff arbitration desk overrides, and financial ledger calculations inside the [evidence/](./evidence) directory according to [EVIDENCE_GUIDE.md](./evidence/EVIDENCE_GUIDE.md).
