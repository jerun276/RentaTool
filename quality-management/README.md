# RentaTool – Quality Management System (SE3110)
## Project Quality Assurance, Testing, and Compliance Repository

This directory contains the dedicated **Quality Management & Software Assurance** workspaces for all **4 team members** in accordance with **SE3110: Quality Management in Software Engineering**.

---

## 👥 Team Member Assignment & Module Matrix

| Member | Assigned Subsystem / Module | Dedicated Workspace | Primary Test Coverage |
| :--- | :--- | :--- | :--- |
| **Thilakshan** | **Identity, Authentication & KYC Compliance** | [Thilakshan-Identity](./Thilakshan-Identity) | Registration, JWT Auth, Token Refresh Rotation, KYC Submission & Review, Role-Based Access Control (RBAC), Security Headers |
| **Jerun** | **Catalog, Equipment Management & Maintenance** | [Jerun-Catalog](./Jerun-Catalog) | Equipment Creation, Validation, Search/Filter, Owner Trust/Verification Display, Owner Deletion/Deactivation Safety, Specs JSON |
| **Nirojan** | **Booking, Availability & QR Handover** | [Nirojan-Booking](./Nirojan-Booking) | Booking Lifecycles (Pending $\to$ Confirmed $\to$ Active $\to$ Completed), Date Conflict Prevention, Dynamic Pricing, QR Code Handover Scans |
| **Jathusagini** | **Escrow, Dispute Claims & AI Arbitration** | [Jathusagini-Escrow](./Jathusagini-Escrow) | Security Deposit Holding, Escrow Releases, Damage Claim Lifecycle, AI Agent Service Integration, Staff Adjudication Desk |

---

## 🎯 Target Test Environments

All member automated test suites and checklists can be executed against both local and live cloud targets:

* **Deployed Cloud Backend (AWS EC2):** `http://18.139.3.242:5000/api/v1`
* **Local Development Backend:** `http://127.0.0.1:5000/api/v1`

---

## 📁 Member Folder Structure Standard

Each member folder follows an identical, high-standard Quality Management structure:

```text
quality-management/<Member-Module>/
├── README.md               # QA Plan, scope, testing strategy, and run instructions
├── TEST_CHECKLIST.md       # Comprehensive manual & automated test case matrices with status
├── test_<module>.py        # Python automated test runner (supports local and cloud targets)
└── evidence/               # Folder containing screenshots, HTTP logs, and test artifacts
    ├── .gitkeep
    └── EVIDENCE_GUIDE.md   # Specific guidance on required evidence for viva/assessment
```

---

## 🚀 Quick Execution Guide for Any Member's Automated Suite

From the project root:

```powershell
# 1. Run Thilakshan's Identity Test Suite against Cloud Target
python .\quality-management\Thilakshan-Identity\test_identity.py --url http://18.139.3.242:5000/api/v1

# 2. Run Jerun's Catalog Test Suite against Cloud Target
python .\quality-management\Jerun-Catalog\test_catalog.py --url http://18.139.3.242:5000/api/v1

# 3. Run Nirojan's Booking Test Suite against Cloud Target
python .\quality-management\Nirojan-Booking\test_booking.py --url http://18.139.3.242:5000/api/v1

# 4. Run Jathusagini's Escrow & AI Test Suite against Cloud Target
python .\quality-management\Jathusagini-Escrow\test_escrow.py --url http://18.139.3.242:5000/api/v1
```
*(Omit `--url` to automatically default to `http://18.139.3.242:5000/api/v1`, or specify `http://127.0.0.1:5000/api/v1` for local testing).*
