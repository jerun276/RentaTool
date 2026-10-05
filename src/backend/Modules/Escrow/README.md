# Component 4: Escrow Ledger & Security Deposit Claims

- **Owner**: Student 4
- **Component ID**: `COMPONENT_4`
- **Branch**: `feature/comp4-escrow-claims`

## Module Responsibilities
- Payment gateway pre-authorization to lock security deposit funds.
- Photographic damage claim filing upon tool return.
- Damage evaluation retrieval with AI deduction summary.
- Split settlement payout disbursements (owner repair cost + renter deposit refund).
- Human review decision adjudication (`POST /api/v1/claims/{id}/adjudicate` - Approve, Revise, Reject).

## API Endpoints
1. `POST /api/v1/escrow/pre-authorize`
2. `POST /api/v1/claims`
3. `GET /api/v1/claims/{id}`
4. `POST /api/v1/claims/{id}/payout`
5. `POST /api/v1/claims/{id}/adjudicate` *(Business-Specific)*

## Database Entities
- `EscrowHold`
- `DamageClaim`
- `Payment`
- `WorkflowStateAudit`

## Agentic AI
- **Action / Tool Agent**: Executes allow-listed database and calculation tools (`GetEquipmentReplacementCost`, `CalculateRentalWearFactor`) to compute fair deduction figures.
