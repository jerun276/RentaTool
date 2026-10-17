# RentaTool — Heavy Machinery & Tool Rental Platform 🛠️🚜

Enterprise Modular Monolith backend and React web portal for **RentaTool**, a peer-to-peer and commercial equipment rental platform. Built with **.NET 8 (C#)**, **PostgreSQL (EF Core)**, and **React + Vite**.

---

## 🏛️ Modular Monolith Architecture

The solution adheres strictly to modular boundaries and clean domain architecture:

```
RentaTool/
├── src/
│   ├── backend/
│   │   ├── Host/RentaTool.API/               # Application Host & Composition Root
│   │   ├── Modules/
│   │   │   ├── Identity/                     # Student 1: Auth, KYC Verification & Trust Scores
│   │   │   ├── Catalog/                      # Student 2: Equipment Catalog, Condition & Wear Tracking
│   │   │   ├── Booking/                      # Student 3: Reservation Lifecycle, Handover Tokens & QR
│   │   │   └── Escrow/                       # Student 4: Security Deposits, Payouts & Damage Claims
│   │   ├── Shared/                           # Shared Kernel & Infrastructure (Event Bus, Persistence)
│   │   └── tests/                            # 118 Unit & Integration Tests (xUnit + EF Core)
│   └── web/                                  # React + Vite Web Portal
├── quality-management/                       # SE3110 Quality Management Workspaces per Member
│   ├── Thilakshan-Identity/
│   ├── Jerun-Catalog/
│   ├── Nirojan-Booking/
│   └── Jathusagini-Escrow/
├── nfr-testing/                              # Non-Functional Requirement (NFR) Test Artifacts
└── TESTING_COMMANDS.md                       # Complete Test Execution Guide
```

---

## 👥 Module Assignment & Quality Management Ownership

| Member | Module Scope | Responsibilities | Dedicated Test Workspace |
| :--- | :--- | :--- | :--- |
| **Thilakshan** | `RentaTool.Modules.Identity` | Authentication, JWT tokens, KYC submissions, Trust scores | `quality-management/Thilakshan-Identity/` |
| **Jerun** | `RentaTool.Modules.Catalog` | Equipment inventory, Condition inspection, Usage wear tracking | `quality-management/Jerun-Catalog/` |
| **Nirojan** | `RentaTool.Modules.Booking` | Rental reservations, Status lifecycle, Secure handover tokens | `quality-management/Nirojan-Booking/` |
| **Jathusagini** | `RentaTool.Modules.Escrow` | Security deposit holding, Payouts, Damage claims & evidence | `quality-management/Jathusagini-Escrow/` |

---

## 🚀 Getting Started

All paths below are **relative** to your local cloned `RentaTool` directory.

### 1. Prerequisites
- **.NET 8 SDK** (`dotnet --version` >= 8.0.0)
- **PostgreSQL 15+** or **Docker Desktop**
- **Node.js** (v18+ or v20+)
- **Python 3.10+** (for member quality management suites)

### 2. Start PostgreSQL Database
Using Docker Compose:
```powershell
docker compose up -d postgres
```
*(Or ensure your local PostgreSQL service is running on port 5432 with database `rentatool_db`)*

### 3. Run the Backend API
```powershell
dotnet run --project .\src\backend\Host\RentaTool.API\RentaTool.API.csproj --urls http://127.0.0.1:5000
```
- API Base URL: `http://localhost:5000`
- Swagger Documentation: `http://localhost:5000/swagger`
- Health Endpoint: `http://localhost:5000/health`

### 4. Run the React Web Application
In a separate terminal:
```powershell
cd src\web
npm install
npm run dev
```
- Web Application: `http://localhost:3000` (or `http://localhost:5173`)

---

## 🧪 Testing & Quality Assurance

Comprehensive testing instructions are documented in [TESTING_COMMANDS.md](TESTING_COMMANDS.md).

### Quick Commands

- **Run all 118 Backend Unit & Integration Tests**:
  ```powershell
  dotnet test .\src\backend\RentaTool.sln
  ```

- **Run PostgreSQL Database Integration Tests**:
  ```powershell
  dotnet test --filter "FullyQualifiedName~PostgreSql"
  ```

- **Run Individual Member API Test Suites**:
  ```powershell
  # Identity (Thilakshan)
  cd quality-management\Thilakshan-Identity; python -m pytest test_identity.py -v; cd ..\..

  # Catalog (Jerun)
  cd quality-management\Jerun-Catalog; python -m pytest test_catalog.py -v; cd ..\..

  # Booking (Nirojan)
  cd quality-management\Nirojan-Booking; python -m pytest test_booking.py -v; cd ..\..

  # Escrow (Jathusagini)
  cd quality-management\Jathusagini-Escrow; python -m pytest test_escrow.py -v; cd ..\..
  ```

- **Targeting Deployed Cloud Backend (AWS EC2)**:
  ```powershell
  $env:API_BASE_URL="http://18.139.3.242:5000"
  python -m pytest test_catalog.py -v
  ```
