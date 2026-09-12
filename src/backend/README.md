# RentaTool.Backend

ASP.NET Core Web API Modular Monolith Backend for **RentaTool LK** (SE3090 Assignment 1).

For complete architectural diagrams, module isolation rules, database persistence models, and student component matrices, read [BACKEND_ARCHITECTURE.md](../../BACKEND_ARCHITECTURE.md).

## Quick Build & Run

```bash
# 1. Start PostgreSQL
docker compose up -d (from repo root)

# 2. Build the solution
dotnet build RentaTool.sln

# 3. Run the API Host
dotnet run --project Host/RentaTool.API
```

- **Swagger UI**: `http://localhost:5000/swagger`
- **Health Check**: `http://localhost:5000/health`
