# Component 3: Booking Engine & Handover Verification

- **Owner**: Student 3
- **Component ID**: `COMPONENT_3`
- **Branch**: `feature/comp3-booking-handover`

## Module Responsibilities
- Equipment rental booking request workflow with conflict management.
- Active bookings tracking for renters and owners.
- Single-use encrypted handover token generation (`/generate-handover-token`).
- QR code token verification upon pickup and return (`/verify-handover`).
- Schedule extension with dynamic surge pricing (`POST /api/v1/bookings/{id}/extend-schedule`).

## API Endpoints
1. `POST /api/v1/bookings`
2. `GET /api/v1/bookings/active`
3. `POST /api/v1/bookings/{id}/generate-handover-token`
4. `POST /api/v1/bookings/{id}/verify-handover`
5. `POST /api/v1/bookings/{id}/extend-schedule` *(Business-Specific)*

## Database Entities
- `Booking`
- `HandoverEvent`
- `GeoLocation`
- `BookingSchedule`

## Agentic AI
- **Coordinator / Planner Agent**: Orchestrates multi-step dispute workflows, sequences inspection steps, and manages state checkpoints.
