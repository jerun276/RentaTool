# RentaTool Backend & Quality Management — Test Execution Guide

This document lists all commands to run backend unit tests, PostgreSQL database integration tests, individual member quality management suites, and non-functional tests for **SE3110 Quality Management in Software Engineering**.

---

## 1. .NET Backend Tests

Run all commands from your local repository root folder (`RentaTool`).

### Run All 118 Unit & Integration Tests Across the Entire Solution
```powershell
dotnet test .\src\backend\RentaTool.sln
```

### Run Tests Per Module Individually

- **Identity Module** (41 tests):
  ```powershell
  dotnet test .\src\backend\tests\RentaTool.Modules.Identity.Tests\RentaTool.Modules.Identity.Tests.csproj
  ```

- **Catalog Module** (19 tests):
  ```powershell
  dotnet test .\src\backend\tests\RentaTool.Modules.Catalog.Tests\RentaTool.Modules.Catalog.Tests.csproj
  ```

- **Booking Module** (26 tests):
  ```powershell
  dotnet test .\src\backend\tests\RentaTool.Modules.Booking.Tests\RentaTool.Modules.Booking.Tests.csproj
  ```

- **Escrow Module** (32 tests):
  ```powershell
  dotnet test .\src\backend\tests\RentaTool.Modules.Escrow.Tests\RentaTool.Modules.Escrow.Tests.csproj
  ```

---

## 2. PostgreSQL Database Integration Tests

All 4 modules contain dedicated PostgreSQL integration tests verifying real table queries, schema compliance, and migrations.

### Run Against Local PostgreSQL Database
*(Make sure PostgreSQL is running on port 5432)*
```powershell
dotnet test --filter "FullyQualifiedName~PostgreSql"
```

### Run Against Remote Server / AWS EC2 Database
You can dynamically override the target database connection string using an environment variable without modifying code:
```powershell
$env:DB_CONNECTION_STRING="Host=18.139.3.242;Port=5432;Database=rentatool_db;Username=postgres;Password=YourPassword"
dotnet test --filter "FullyQualifiedName~PostgreSql"
```

---

## 3. Dedicated Member Quality Management Test Suites

Each team member has their own assigned module and test workspace inside `quality-management/`:

### Prerequisites (Python Environment)
```powershell
pip install requests pytest
```

### Option A: Testing Against Local API (Default: `http://localhost:5000`)
*(Start the local backend API first: `dotnet run --project .\src\backend\Host\RentaTool.API\RentaTool.API.csproj --urls http://127.0.0.1:5000`)*

- **Thilakshan — Identity & Auth**:
  ```powershell
  cd quality-management\Thilakshan-Identity
  python -m pytest test_identity.py -v
  cd ..\..
  ```

- **Jerun — Catalog & Tools**:
  ```powershell
  cd quality-management\Jerun-Catalog
  python -m pytest test_catalog.py -v
  cd ..\..
  ```

- **Nirojan — Bookings & Rental Orders**:
  ```powershell
  cd quality-management\Nirojan-Booking
  python -m pytest test_booking.py -v
  cd ..\..
  ```

- **Jathusagini — Escrow & Payments**:
  ```powershell
  cd quality-management\Jathusagini-Escrow
  python -m pytest test_escrow.py -v
  cd ..\..
  ```

### Option B: Testing Against Deployed AWS EC2 Server
To direct any member's test suite to the live cloud backend, set `$env:API_BASE_URL`:
```powershell
$env:API_BASE_URL = "http://18.139.3.242:5000"
cd quality-management\Jerun-Catalog
python -m pytest test_catalog.py -v
cd ..\..
```

---

## 4. Non-Functional Requirement (NFR) Tests

Located in `nfr-testing/`:

- **API Read-Only Load Test (k6)**:
  ```powershell
  k6 run nfr-testing\k6\read_only.js
  ```

- **API Stress Test (k6)**:
  ```powershell
  k6 run nfr-testing\k6\stress_read_only.js
  ```

- **API Restart / Recovery Resilience Check**:
  ```powershell
  powershell -ExecutionPolicy Bypass -File .\nfr-testing\recovery\api_restart_recovery.ps1
  ```
