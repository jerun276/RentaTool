# 🛠️ RentaTool LK – Backend Service (Modular Monolith)

> **Course**: SE3090 Software Engineering Frameworks (Year 3, Semester 1 | 2026)  
> **Platform**: Peer-to-Peer Machinery & Equipment Rental System (**RentaTool LK**)  
> **Framework**: **.NET 9.0 (`net9.0`) / ASP.NET Core Web API**  
> **Database**: **PostgreSQL 16+ (Entity Framework Core 9.0 / Npgsql)**  
> **Architecture Pattern**: **Clean Modular Monolith** with Domain-Driven Design (DDD)

---

## 📋 Table of Contents
1. [Architecture Overview](#-architecture-overview)
2. [Solution Structure](#-solution-structure)
3. [Module Responsibilities & Ownership](#-module-responsibilities--ownership)
4. [Prerequisites](#-prerequisites)
5. [Database & Configuration Setup](#-database--configuration-setup)
6. [Essential Commands Cheatsheet](#-essential-commands-cheatsheet)
   - [Restoring & Building](#1-restoring--building)
   - [Running the API](#2-running-the-api)
   - [Running Tests](#3-running-tests)
   - [EF Core Database Migrations](#4-ef-core-database-migrations)
   - [Docker PostgreSQL Container](#5-docker-postgresql-container)
7. [API Endpoints & Swagger](#-api-endpoints--swagger)
8. [Module Development Rules](#-module-development-rules)

---

## 🏛️ Architecture Overview

The backend is engineered as a **Modular Monolith**. All 4 core business domains are encapsulated inside independent, loosely-coupled modules within a single unified solution, orchestrated by a central host API (`RentaTool.API`).

```
                              ┌───────────────────────────────────┐
                              │  Clients (React Web / Flutter)    │
                              └─────────────────┬─────────────────┘
                                                │ REST / JSON
                                                ▼
                              ┌───────────────────────────────────┐
                              │   Host / Composition Root         │
                              │       (RentaTool.API)             │
                              │  - Swagger OpenAPI                │
                              │  - JWT Bearer Authentication      │
                              │  - Global Middleware & RFC 7807   │
                              └───────┬─────────┬─────────┬───────┘
                                      │         │         │
                ┌─────────────────────┼─────────┴─────────┼─────────────────────┐
                ▼                     ▼                   ▼                     ▼
       ┌─────────────────┐   ┌─────────────────┐ ┌─────────────────┐   ┌─────────────────┐
       │ Modules.Identity│   │ Modules.Catalog │ │ Modules.Booking │   │ Modules.Escrow  │
       │   (Student 1)   │   │   (Student 2)   │ │   (Student 3)   │   │   (Student 4)   │
       └────────┬────────┘   └────────┬────────┘ └────────┬────────┘   └────────┬────────┘
                │                     │                   │                     │
                └─────────────────────┼───────────────────┴─────────────────────┘
                                      ▼
                      ┌────────────────────────────────┐
                      │    BuildingBlocks              │
                      │    - RentaTool.Shared.Kernel   │
                      │    - RentaTool.Shared.Infra    │
                      └───────────────┬────────────────┘
                                      ▼
                      ┌────────────────────────────────┐
                      │    PostgreSQL Database         │
                      │    (rentatool_db)              │
                      └────────────────────────────────┘
```

### Key Architectural Tenets
1. **Strict Module Isolation**: Modules **never** reference each other directly (`RentaTool.Modules.Booking` cannot reference `RentaTool.Modules.Catalog`).
2. **Shared Kernel Primitives**: Common domain abstractions (`BaseEntity`, `Result<T>`, domain events, common enums) reside in `BuildingBlocks/RentaTool.Shared.Kernel`.
3. **Unified Persistence**: Schema configurations and the central `AppDbContext` live in `BuildingBlocks/RentaTool.Shared.Infrastructure`.
4. **Single Deployable Unit**: `RentaTool.API` registers module services via extension methods (e.g. `services.AddCatalogModule()`, `services.AddBookingModule()`).

---

## 📁 Solution Structure

```
src/backend/
├── RentaTool.sln                                # Root Solution File (.NET 9)
├── README.md                                    # This Backend Documentation
│
├── Host/
│   └── RentaTool.API/                           # Composition Root Web API Project
│       ├── Controllers/                         # Host-level routes & health checks
│       ├── Properties/launchSettings.json       # Launch profiles (Ports 5000, 7040)
│       ├── appsettings.json                     # Base production configuration
│       ├── appsettings.Development.json         # Local dev connection strings & logging
│       └── Program.cs                           # Dependency injection & middleware setup
│
├── BuildingBlocks/
│   ├── RentaTool.Shared.Kernel/                 # Shared domain primitives & types
│   │   ├── Domain/                              # BaseEntity, AggregateRoot, DomainEvent
│   │   └── Common/                              # Result<T>, Error, PagedList<T>
│   └── RentaTool.Shared.Infrastructure/         # Shared data access layer
│       └── Persistence/                         # AppDbContext & EF Core configurations
│
├── Modules/
│   ├── Identity/                                # Component 1: Auth & Trust Governance (Student 1)
│   ├── Catalog/                                 # Component 2: Equipment & Inspections (Student 2 - TL)
│   │   ├── Controllers/EquipmentController.cs
│   │   ├── Domain/ (Equipment, Category, InspectionLog, ToolImage)
│   │   ├── Services/ (EquipmentService, InspectionService, BatchAvailabilityService)
│   │   └── Infrastructure/CatalogModuleExtensions.cs
│   ├── Booking/                                 # Component 3: Booking & QR Handover (Student 3)
│   │   ├── Controllers/BookingsController.cs
│   │   ├── Domain/ (Booking, HandoverEvent, BookingSchedule)
│   │   ├── Services/ (BookingService, HandoverTokenService)
│   │   └── Infrastructure/BookingModuleExtensions.cs
│   └── Escrow/                                  # Component 4: Escrow & Damage Claims (Student 4)
│
└── tests/
    ├── RentaTool.Modules.Catalog.Tests/         # 18 Unit & Integration tests for Catalog
    └── RentaTool.Modules.Booking.Tests/         # 24 Unit & Integration tests for Booking
```

---

## 👥 Module Responsibilities & Ownership

| Component | Module Name | Student Owner | Key Responsibilities |
| :--- | :--- | :--- | :--- |
| **Component 1** | `Modules.Identity` | Student 1 | User authentication (JWT), NIC/Passport KYC, trust score recalculation. |
| **Component 2** | `Modules.Catalog` | **Student 2 (TL)** | Machinery catalog, condition inspection logs, 60-day wear limit lockout, batch availability. |
| **Component 3** | `Modules.Booking` | Student 3 | Rental scheduling, dynamic surge extension, single-use encrypted QR handover tokens. |
| **Component 4** | `Modules.Escrow` | Student 4 | Two-stage escrow holding, damage deductions, payout disbursement. |

---

## ⚙️ Prerequisites

Before working on the backend, ensure the following tools are installed:

- **[.NET 9.0 SDK](https://dotnet.microsoft.com/download/dotnet/9.0)** (`v9.0.100` or higher)
  ```bash
  dotnet --version
  ```
- **[PostgreSQL 16+](https://www.postgresql.org/download/)** (Running on port `5432`)
  - Default database name: `rentatool_db`
  - Default user: `postgres`
- **[EF Core Global CLI Tool](https://learn.microsoft.com/en-us/ef/core/cli/dotnet)**:
  ```bash
  dotnet tool install --global dotnet-ef
  # or to update an existing version:
  dotnet tool update --global dotnet-ef
  ```
- *(Optional)* **Docker Desktop** (if you prefer running PostgreSQL in a container).

---

## 🗄️ Database & Configuration Setup

### 1. Connection String Configuration
Database settings are located in `Host/RentaTool.API/appsettings.Development.json`:

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=localhost;Port=5432;Database=rentatool_db;Username=postgres;Password=root"
  },
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft.AspNetCore": "Information",
      "Microsoft.EntityFrameworkCore": "Warning"
    }
  }
}
```

> [!NOTE]
> Adjust the `Password` field to match your local PostgreSQL password. Alternatively, set the environment variable `ConnectionStrings__DefaultConnection` or configure root `.env`.

### 2. Automatic Schema Creation & Seeding
On startup in `Development` mode, `Program.cs` automatically executes:
- `db.Database.EnsureCreatedAsync()` to build all required tables.
- Category seed data (`Power Tools`, `Heavy Machinery`, `Cleaning Equipment`, `Generators & Power`).
- Sample equipment records including 60-day wear threshold test cases.

---

## ⚡ Essential Commands Cheatsheet

All commands below should be executed from the `src/backend` directory:

```bash
cd src/backend
```

### 1. Restoring & Building

```bash
# Restore NuGet dependencies for all projects in the solution
dotnet restore RentaTool.sln

# Build the entire solution
dotnet build RentaTool.sln

# Clean build artifacts
dotnet clean RentaTool.sln
```

---

### 2. Running the API

```bash
# Run using the default HTTP profile (http://localhost:5000)
dotnet run --project Host/RentaTool.API --launch-profile http

# Run using the HTTPS profile (https://localhost:7040; http://localhost:5027)
dotnet run --project Host/RentaTool.API --launch-profile https

# Run with Hot-Reload enabled (auto recompile on code changes)
dotnet watch --project Host/RentaTool.API --launch-profile http
```

Once running:
- **Swagger UI**: [http://localhost:5000/swagger](http://localhost:5000/swagger)
- **Health Check**: [http://localhost:5000/health](http://localhost:5000/health)

---

### 3. Running Tests

```bash
# Run all unit and integration tests in the entire solution
dotnet test

# Run tests with detailed console output
dotnet test --logger "console;verbosity=detailed"

# Run only Component 2 (Catalog) tests (18 tests)
dotnet test tests/RentaTool.Modules.Catalog.Tests

# Run only Component 3 (Booking) tests (24 tests)
dotnet test tests/RentaTool.Modules.Booking.Tests

# Run a specific test by name filter
dotnet test --filter "FullyQualifiedName~RecordRentalDays"
```

---

### 4. EF Core Database Migrations

When you introduce or modify Entity classes, run migrations using `RentaTool.Shared.Infrastructure` as the migration project and `Host/RentaTool.API` as the startup project:

```bash
# Add a new migration (replace <MigrationName> with your descriptive name, e.g., AddEquipmentPhotos)
dotnet ef migrations add <MigrationName> \
  --project BuildingBlocks/RentaTool.Shared.Infrastructure \
  --startup-project Host/RentaTool.API

# Apply pending migrations to the PostgreSQL database
dotnet ef database update \
  --project BuildingBlocks/RentaTool.Shared.Infrastructure \
  --startup-project Host/RentaTool.API

# Rollback database to a specific migration
dotnet ef database update <TargetMigrationName> \
  --project BuildingBlocks/RentaTool.Shared.Infrastructure \
  --startup-project Host/RentaTool.API

# Remove the last migration (only if NOT yet applied to the database)
dotnet ef migrations remove \
  --project BuildingBlocks/RentaTool.Shared.Infrastructure \
  --startup-project Host/RentaTool.API

# Generate an idempotent SQL migration script for review or CI/CD
dotnet ef migrations script \
  --project BuildingBlocks/RentaTool.Shared.Infrastructure \
  --startup-project Host/RentaTool.API \
  --output migrations.sql \
  --idempotent
```

---

### 5. Docker PostgreSQL Container

If you do not have PostgreSQL installed natively on your workstation, you can spin up the containerized database from the repository root:

```bash
# From repository root (where docker-compose.yml is located):
docker compose up -d postgres

# Check container status
docker compose ps

# View database logs
docker compose logs -f postgres

# Stop the database container
docker compose down
```

---

## 🌐 API Endpoints & Swagger

When the API is running, visit **`http://localhost:5000/swagger`** for interactive testing.

### Key API Endpoints by Module:

#### 1. System & Health
- `GET /health` – Monolith health probe and loaded module status

#### 2. Component 2: Catalog & Asset Inspection (`/api/catalog`)
- `GET /api/catalog/equipment` – List and filter active rental machinery
- `GET /api/catalog/equipment/{id}` – Get detailed equipment information
- `POST /api/catalog/equipment` – Register a new tool/equipment listing
- `POST /api/catalog/equipment/{id}/inspection` – Record photographic inspection logs
- `POST /api/catalog/equipment/batch-availability` – Batch evaluate maintenance locks & 60-day wear limits
- `GET /api/catalog/categories` – List active tool categories

#### 3. Component 3: Booking Engine (`/api/v1/bookings`)
- `POST /api/v1/bookings` – Create a rental booking request
- `GET /api/v1/bookings/active` – List active bookings for user/owner
- `POST /api/v1/bookings/{id}/generate-handover-token` – Generate single-use encrypted handover token
- `POST /api/v1/bookings/{id}/verify-handover` – Verify physical handover via token
- `POST /api/v1/bookings/{id}/extend-schedule` – Request schedule extension with surge pricing

---

## 📐 Module Development Rules

Every team member contributing to `src/backend` must adhere to these standards:

1. **Isolation Rule**:
   - Do **NOT** add project references between modules.
   - Cross-module communication must use domain events or interfaces defined in `Shared.Kernel`.
2. **Controller Scanning**:
   - When introducing a new module controller, register its assembly in `Host/RentaTool.API/Program.cs`:
     ```csharp
     builder.Services.AddControllers()
         .AddApplicationPart(typeof(YourModuleController).Assembly);
     ```
3. **Module Registration**:
   - Provide a clean extension method in your module (e.g., `services.AddIdentityModule()`) to wire up dependencies.
4. **Mandatory Testing**:
   - Every module must maintain unit and integration tests inside `src/backend/tests/`.
   - All tests (`dotnet test`) **must pass 100%** before submitting pull requests to the `dev` branch.
5. **No Direct Hardcoded Secrets**:
   - Never commit passwords or private API keys to git. Use `appsettings.Development.json` or `.env` (ignored by `.gitignore`).

---

> 💡 *For questions regarding backend architectural patterns, database schemas, or student contribution matrices, refer to [BACKEND_ARCHITECTURE.md](../../BACKEND_ARCHITECTURE.md) in the repository root.*
