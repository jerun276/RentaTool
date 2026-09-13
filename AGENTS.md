# RentaTool – AI Agent Rules, File Access Tiers & Component Specifications

> **MANDATORY INSTRUCTION FOR AGENTS**:
> This workspace follows strict multi-developer isolation rules for SE3090 Assignment 1.
> Read `ACTIVE_COMPONENT_ID` below and observe the 4-Tier Access Control System.
> The full specifications for each component (endpoints, entities, UI, and AI agents) are detailed below.

```yaml
# ==============================================================================
# DEVELOPER CONFIGURATION (CHANGE THIS TO YOUR COMPONENT BEFORE PROMPTING)
# ==============================================================================
ACTIVE_STUDENT: "Jerun (Student 2)"
ACTIVE_COMPONENT_ID: "COMPONENT_2"  # Options: "COMPONENT_1" | "COMPONENT_2" | "COMPONENT_3" | "COMPONENT_4" | "SHARED_CORE"
# ==============================================================================
```

---

## 1. The 4-Tier File Access Rules

### 🟢 TIER 1: Universal Shared Assets (Read & Use for ALL Members)

All members have unrestricted permission to import and use:

- **Auth & JWT Claims**: `[Authorize]` attribute, `UserRole` enum, `ICurrentUser` service, `ClaimsPrincipalExtensions` (extracting `UserId` and `Role`).
- **Shared Kernel**: `BaseEntity`, `Result`, `Result<T>`, `Enums` (`UserRole`, `RentalStatus`, `ClaimStatus`, `KycStatus`, `EquipmentStatus`).
- **Web Shared**: `useAuthStore` (token & session), `axiosClient` with bearer token interceptor, shared UI components (`shared/components/**`).
- **Mobile Shared**: `auth_interceptor.dart`, `token_storage_service.dart`, `lib/core/theme/**`.

### 🟡 TIER 2: Inter-Module Public Contracts (Read-Only Consumer Access)

- Modules can read public DTOs and contracts exposed by other modules (e.g. Booking can read `EquipmentSummaryDto` from Catalog).
- Never reference another module's internal DbContext, private entities, or private services.

### 🟠 TIER 3: Composition Points (Append-Only / Isolated Extension)

- `Host/RentaTool.API/Program.cs`: Only append your own module's DI extension method (`services.AddMyModule()`).
- `Shared.Infrastructure/Persistence/AppDbContext.cs`: Configure your entity mappings via `IEntityTypeConfiguration<T>`.
- `src/web/src/routes/AppRoutes.tsx` & `lib/core/routes/app_router.dart`: Only append your module's routes.

### 🔴 TIER 4: Exclusive Component Modules (Write Access Only to Active Owner)

- **COMPONENT_1 (Student 1)**: `src/backend/Modules/Identity/**`, `src/web/src/modules/identity/**`, `lib/modules/identity/**`, `src/ai_service/agents/validation_agent.py`
- **COMPONENT_2 (Student 2)**: `src/backend/Modules/Catalog/**`, `src/web/src/modules/catalog/**`, `lib/modules/catalog/**`, `src/ai_service/agents/domain_analysis_agent.py`
- **COMPONENT_3 (Student 3)**: `src/backend/Modules/Booking/**`, `src/web/src/modules/booking/**`, `lib/modules/booking/**`, `src/ai_service/agents/planner_agent.py`
- **COMPONENT_4 (Student 4)**: `src/backend/Modules/Escrow/**`, `src/web/src/modules/escrow/**`, `lib/modules/escrow/**`, `src/ai_service/agents/action_agent.py`

> ⛔ If an agent attempts to edit files belonging to another component's Tier 4 directory, it **must refuse and halt**.

---

## 2. Complete Specifications by Component

### 🔹 COMPONENT 1: User Identity, Verification & Trust Governance

- **Primary Owner**: Student 1
- **Git Branch**: `feature/comp1-auth-trust`
- **Assigned Paths**:
  - Backend: `src/backend/Modules/Identity/`
  - Web: `src/web/src/modules/identity/`
  - Mobile: `RentaTool-mobile/lib/modules/identity/`
  - AI: `src/ai_service/agents/validation_agent.py`

#### API Endpoints:

1. `POST /api/v1/auth/register`: User onboarding with role assignment (`Renter`, `Owner`).
2. `POST /api/v1/auth/login`: Issues JWT access and refresh tokens.
3. `POST /api/v1/users/kyc`: Submits National Identity Card (NIC) / driving license image documents.
4. `GET /api/v1/users/{id}/trust-score`: Computes and returns dynamic user reliability metric.
5. `PATCH /api/v1/users/{id}/verification-status`: _(Business-Specific Operation)_ Admin approval/rejection of identity verification with audit trail.

#### Database Entities:

- `User`: Id, Name, Email, PasswordHash, Role, PhoneNumber, IsVerified, CreatedAt.
- `UserRole`: Role mapping table (Renter, Owner, Admin).
- `KYCRecord`: Id, UserId, DocumentType, DocumentNumber, FrontImageUrl, BackImageUrl, Status (`Pending`, `Approved`, `Rejected`), VerifiedByAdminId, RejectionReason.
- `TrustLedger`: Id, UserId, ScoreDelta, Reason, TransactionReference, RunningTrustScore.

#### Client Features:

- **React Web**: Admin user registry with filtering, document inspection modals, and KYC approval/rejection actions.
- **Flutter Mobile**: Multi-step registration, secure token storage (`FlutterSecureStorage`), camera image capture for NIC upload.

#### AI Subsystem:

- **Validation / Safety Agent**: Validates identity input formats, verifies deposit cap limits, checks blacklist entries, and enforces prompt injection safety rules.

---

### 🔹 COMPONENT 2: Equipment Catalog & Asset Condition Inspection

- **Primary Owner**: Student 2
- **Git Branch**: `feature/comp2-catalog-inspection`
- **Assigned Paths**:
  - Backend: `src/backend/Modules/Catalog/`
  - Web: `src/web/src/modules/catalog/`
  - Mobile: `RentaTool-mobile/lib/modules/catalog/`
  - AI: `src/ai_service/agents/domain_analysis_agent.py`

#### API Endpoints:

1. `POST /api/v1/equipment`: Creates a tool listing with specs, daily rate, replacement value, and owner ID.
2. `GET /api/v1/equipment`: Lists equipment with category filtering, search terms, and pagination.
3. `POST /api/v1/equipment/{id}/inspection-logs`: Stores pre-rental/post-rental photographic condition records.
4. `GET /api/v1/equipment/{id}/history`: Retrieves maintenance history and past condition timeline.
5. `POST /api/v1/equipment/batch-availability`: _(Business-Specific Operation)_ Checks dynamic maintenance lockouts and flags tools requiring mandatory servicing.

#### Database Entities:

- `Equipment`: Id, OwnerId, Title, Description, CategoryId, DailyRate, ReplacementValue, Status (`Available`, `Rented`, `UnderMaintenance`, `Disputed`), GeoLocationId.
- `Category`: Id, Name, Description, IconUrl.
- `InspectionLog`: Id, EquipmentId, BookingId, InspectorUserId, InspectionType (`PreRental`, `PostRental`), ConditionNotes, PhotosJson (JSONB), Timestamp.
- `ToolImage`: Id, EquipmentId, ImageUrl, Angle (`Casing`, `Cord`, `Motor`), IsPrimary.

#### Client Features:

- **React Web**: Equipment inventory dashboard, category management, and condition inspection viewer.
- **Flutter Mobile**: Tool listing wizard, multi-angle camera inspection screen (casing, cord, motor) with timestamp overlays.

#### AI Subsystem:

- **Domain Analysis Agent**: Evaluates visual and textual condition deltas between pre-rental and post-rental inspection photos to classify standard wear-and-tear vs accidental structural damage.

---

### 🔹 COMPONENT 3: Booking Engine & Handover Verification

- **Primary Owner**: Student 3
- **Git Branch**: `feature/comp3-booking-handover`
- **Assigned Paths**:
  - Backend: `src/backend/Modules/Booking/`
  - Web: `src/web/src/modules/booking/`
  - Mobile: `RentaTool-mobile/lib/modules/booking/`
  - AI: `src/ai_service/agents/planner_agent.py`

#### API Endpoints:

1. `POST /api/v1/bookings`: Initiates a rental booking request with start and end dates.
2. `GET /api/v1/bookings/active`: Returns active bookings for the authenticated user.
3. `POST /api/v1/bookings/{id}/generate-handover-token`: Issues single-use encrypted handover tokens.
4. `POST /api/v1/bookings/{id}/verify-handover`: Confirms equipment pickup or return via QR token scan.
5. `POST /api/v1/bookings/{id}/extend-schedule`: _(Business-Specific Operation)_ Validates availability conflicts against future reservations and applies schedule extensions with dynamic surge pricing.

#### Database Entities:

- `Booking`: Id, EquipmentId, RenterId, StartDate, EndDate, TotalRentalFee, Status (`Requested`, `Confirmed`, `Active`, `Completed`, `Cancelled`, `Disputed`).
- `HandoverEvent`: Id, BookingId, EventType (`Pickup`, `Return`), VerifiedAtUtc, GeoLocationId, ScannerUserId, HandoverTokenHash.
- `GeoLocation`: Id, Latitude, Longitude, AddressLine, City, PostalCode.
- `BookingSchedule`: Id, EquipmentId, BookingId, BlockedStartDate, BlockedEndDate, Reason.

#### Client Features:

- **React Web**: Real-time rental tracking dashboard and schedule calendar conflict manager.
- **Flutter Mobile**: Interactive map radius search, QR code generator for owners, and camera-based QR scanner for renters.

#### AI Subsystem:

- **Coordinator / Planner Agent**: Orchestrates multi-step dispute resolution plans, sequences verification steps, and manages LangGraph execution state.

---

### 🔹 COMPONENT 4: Escrow Ledger & Security Deposit Claims

- **Primary Owner**: Student 4
- **Git Branch**: `feature/comp4-escrow-claims`
- **Assigned Paths**:
  - Backend: `src/backend/Modules/Escrow/`
  - Web: `src/web/src/modules/escrow/`
  - Mobile: `RentaTool-mobile/lib/modules/escrow/`
  - AI: `src/ai_service/agents/action_agent.py`

#### API Endpoints:

1. `POST /api/v1/escrow/pre-authorize`: Integrates with payment gateway sandbox (PayHere/Stripe) to lock deposit funds.
2. `POST /api/v1/claims`: Files a damage dispute with photo evidence.
3. `GET /api/v1/claims/{id}`: Fetches claim status, AI evaluation summary, and deduction breakdown.
4. `POST /api/v1/claims/{id}/payout`: Disburses split funds to owner and refunds renter balance.
5. `POST /api/v1/claims/{id}/adjudicate`: _(Business-Specific Operation)_ Enforces human review decisions (`Approve`, `Revise`, `Reject`) and finalizes ledger settlement.

#### Database Entities:

- `EscrowHold`: Id, BookingId, DepositAmount, PreAuthTransactionId, Status (`Held`, `Disbursed`, `Refunded`, `Disputed`).
- `DamageClaim`: Id, BookingId, FiledByUserId, DamageDescription, EvidencePhotosJson (JSONB), ProposedDeduction, FinalDeduction, Status (`Filed`, `UnderAIEvaluation`, `PendingStaffApproval`, `Approved`, `Revised`, `Rejected`, `Settled`).
- `Payment`: Id, ClaimId, BookingId, PayerUserId, RecipientUserId, Amount, PaymentType (`DepositHold`, `DamagePayout`, `DepositRefund`, `PlatformFee`), Status.
- `WorkflowStateAudit`: Id, WorkflowId, CurrentState, AgentId, ToolCallsLog (JSONB), DecisionSummary, HumanReviewDecision, CreatedAtUtc.

#### Client Features:

- **React Web**: Damage claim arbitration desk with side-by-side photo comparison, AI deduction proposals, and one-click approval controls (`Approve`, `Revise`, `Reject`).
- **Flutter Mobile**: Escrow hold confirmation sheet, dispute filing form, and settlement summary screen.

#### AI Subsystem:

- **Action / Tool Agent**: Calls allow-listed internal tools (`GetEquipmentReplacementCost`, `CalculateRentalWearFactor`) to compute fair deductions based on repair pricing models.

---

## 3. Mandatory 6-Step Cross-Platform Workflow (Rubric Core)

1. **Flutter Mobile**: Owner accepts returned equipment, spots damage (e.g. cracked motor casing), takes a photo, and submits damage claim (`POST /api/v1/claims`).
2. **ASP.NET Core**: Authenticates request, stores initial dispute records in PostgreSQL, and invokes internal AI service.
3. **PostgreSQL**: Persists initial dispute state and initializes a `WorkflowStateAudit` record.
4. **Agentic AI Subsystem (LangGraph)**:
   - **Planner Agent**: Evaluates claim, pulls baseline pre-rental inspection photos, establishes sequential plan.
   - **Domain Analysis Agent**: Inspects photos, categorizes damage (e.g. accidental crack vs normal wear).
   - **Action Agent**: Calls allow-listed tools (`GetEquipmentReplacementCost`, `CalculateRentalWearFactor`) to compute deduction (e.g. LKR 3,500).
   - **Validation Agent**: Confirms deduction does not exceed deposit cap (LKR 5,000) and passes business rules.
5. **React Web (Human Approval Pause)**: The workflow halts execution at a persistent breakpoint (`PendingStaffApproval`). Operations manager compares before/after photos, reviews AI deduction summary, and clicks "Approve Claim" (or Revise/Reject) via `POST /api/v1/claims/{id}/adjudicate`.
6. **Shared Status & Settlement**: ASP.NET Core completes transaction in PostgreSQL (LKR 3,500 disbursed to owner, LKR 1,500 refunded to renter), and both parties receive real-time updates/push notifications on Flutter.
