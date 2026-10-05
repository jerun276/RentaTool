# ==============================================================================
# RentaTool LK - ASP.NET Core 9.0 Modular Monolith Dockerfile
# ==============================================================================

# --- Stage 1: Build & Publish ---
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

# Copy solution and project definitions for layer-cached restore
COPY RentaTool.sln ./
COPY BuildingBlocks/RentaTool.Shared.Kernel/RentaTool.Shared.Kernel.csproj BuildingBlocks/RentaTool.Shared.Kernel/
COPY BuildingBlocks/RentaTool.Shared.Infrastructure/RentaTool.Shared.Infrastructure.csproj BuildingBlocks/RentaTool.Shared.Infrastructure/
COPY Host/RentaTool.API/RentaTool.API.csproj Host/RentaTool.API/
COPY Modules/Identity/RentaTool.Modules.Identity/RentaTool.Modules.Identity.csproj Modules/Identity/RentaTool.Modules.Identity/
COPY Modules/Catalog/RentaTool.Modules.Catalog/RentaTool.Modules.Catalog.csproj Modules/Catalog/RentaTool.Modules.Catalog/
COPY Modules/Booking/RentaTool.Modules.Booking/RentaTool.Modules.Booking.csproj Modules/Booking/RentaTool.Modules.Booking/
COPY Modules/Escrow/RentaTool.Modules.Escrow/RentaTool.Modules.Escrow.csproj Modules/Escrow/RentaTool.Modules.Escrow/
COPY tests/RentaTool.Modules.Identity.Tests/RentaTool.Modules.Identity.Tests.csproj tests/RentaTool.Modules.Identity.Tests/
COPY tests/RentaTool.Modules.Catalog.Tests/RentaTool.Modules.Catalog.Tests.csproj tests/RentaTool.Modules.Catalog.Tests/
COPY tests/RentaTool.Modules.Booking.Tests/RentaTool.Modules.Booking.Tests.csproj tests/RentaTool.Modules.Booking.Tests/
COPY tests/RentaTool.Modules.Escrow.Tests/RentaTool.Modules.Escrow.Tests.csproj tests/RentaTool.Modules.Escrow.Tests/

# Restore dependencies
RUN dotnet restore Host/RentaTool.API/RentaTool.API.csproj

# Copy remaining source code
COPY . .

# Publish release binary
WORKDIR /src/Host/RentaTool.API
RUN dotnet publish -c Release -o /app/publish --no-restore

# --- Stage 2: Runtime Environment ---
FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS final
WORKDIR /app

# Install curl for container health check
RUN apt-get update && apt-get install -y --no-install-recommends curl && rm -rf /var/lib/apt/lists/*

COPY --from=build /app/publish .

ENV ASPNETCORE_URLS=http://+:5000 \
    ASPNETCORE_ENVIRONMENT=Production \
    DOTNET_SYSTEM_GLOBALIZATION_INVARIANT=false

EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:5000/health || exit 1

ENTRYPOINT ["dotnet", "RentaTool.API.dll"]
