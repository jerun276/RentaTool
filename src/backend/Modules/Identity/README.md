# Component 1: User Identity, Verification & Trust Governance

- **Owner**: Student 1
- **Component ID**: `COMPONENT_1`
- **Branch**: `feature/comp1-auth-trust`

## Module Responsibilities
- User registration and authentication with JWT access and refresh tokens.
- National Identity Card (NIC) / Driving License KYC submission and verification workflow.
- Dynamic Trust Score calculation algorithm.
- Admin verification status approval/rejection (`PATCH /api/v1/users/{id}/verification-status`).

## API Endpoints
1. `POST /api/v1/auth/register`
2. `POST /api/v1/auth/login`
3. `POST /api/v1/users/kyc`
4. `GET /api/v1/users/{id}/trust-score`
5. `PATCH /api/v1/users/{id}/verification-status` *(Business-Specific)*

## Database Entities
- `User`
- `UserRole`
- `KYCRecord`
- `TrustLedger`

## Agentic AI
- **Validation / Safety Agent**: Validates identity data inputs, checks blacklists, enforces deposit caps, and guards against prompt injection.
