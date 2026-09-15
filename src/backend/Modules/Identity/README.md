# Component 1 — Identity, Verification and Trust

## Delivered API

| Endpoint | Access | Behaviour |
|---|---|---|
| `POST /api/v1/auth/register` | Public | Creates a `Renter` or `Owner`, hashes its password, creates role and initial trust ledger records, and returns JWT access/refresh tokens. |
| `POST /api/v1/auth/login` | Public | Verifies credentials and issues new tokens. |
| `POST /api/v1/users/kyc` | Authenticated | `KycController` submits NIC or driving licence document metadata and image URLs. |
| `GET /api/v1/users/{id}/trust-score` | Account holder or admin | Returns the current ledger score. |
| `PATCH /api/v1/users/{id}/verification-status` | Admin | Approves/rejects the latest KYC submission, preserves reviewer/rejection audit data, and awards 25 trust points for approval. |

## Data entities

- `User`: identity, email (unique), PBKDF2 password hash, role, phone number, verification status, and audit timestamps.
- `UserRoleAssignment`: normalized user-to-role mapping.
- `KycRecord`: submitted document, image URLs, status, reviewer, rejection reason, and review timestamp.
- `TrustLedger`: immutable score changes, reason/reference, and running total. New accounts start at 50; KYC approval adds 25.

## DTOs

- `Application/Dtos/Auth`: registration, login, and token response DTOs.
- `Application/Dtos/Kyc`: KYC submission, KYC response, and admin verification-status DTOs.
- `Application/Dtos/Trust`: trust-score response DTO.

## Tests

The identity test project contains 25 .NET unit/contract cases for registration, public-admin prevention, duplicate accounts, valid/invalid login, JWT claims, valid/invalid KYC submission, approval, rejection/audit logging, trust score retrieval, endpoint routes/verbs, and RBAC attributes. The associated validation agent has 5 pytest cases.

`AuthService` owns registration/login; `KycService` owns document submission; the dedicated `VerificationService` owns the admin approval/rejection decision and its audit/trust-score side effects. JWT generation is isolated in `Security/JwtTokenService.cs`.

Run once the .NET 9 SDK is installed:

```powershell
dotnet test tests/RentaTool.Modules.Identity.Tests/RentaTool.Modules.Identity.Tests.csproj
```

## Associated Component 1 safety agent

`src/ai_service/agents/validation_agent.py` validates NIC/licence formats, trusted blacklist matches, deposit caps, and prompt-injection patterns before internal AI workflows continue. Its five focused pytest cases are in `src/ai_service/tests/test_validation_agent.py`.
