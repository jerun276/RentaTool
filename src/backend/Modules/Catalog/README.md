# Component 2: Equipment Catalog & Asset Condition Inspection

- **Owner**: Student 2
- **Component ID**: `COMPONENT_2`
- **Branch**: `feature/comp2-catalog-inspection`

## Module Responsibilities
- Tool/machinery listing creation with specs, daily rates, and replacement values.
- Equipment search, category filtering, and paginated listing.
- Pre-rental and post-rental photographic inspection logs.
- Dynamic maintenance lockout detection and mandatory servicing flagging (`POST /api/v1/equipment/batch-availability`).

## API Endpoints
1. `POST /api/v1/equipment`
2. `GET /api/v1/equipment`
3. `POST /api/v1/equipment/{id}/inspection-logs`
4. `GET /api/v1/equipment/{id}/history`
5. `POST /api/v1/equipment/batch-availability` *(Business-Specific)*

## Database Entities
- `Equipment`
- `Category`
- `InspectionLog`
- `ToolImage`

## Agentic AI
- **Domain Analysis Agent**: Evaluates before/after inspection photos and condition text to classify normal wear-and-tear vs accidental structural damage.
