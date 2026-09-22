using Microsoft.EntityFrameworkCore;
using Microsoft.OpenApi.Models;
using RentaTool.Modules.Booking.Infrastructure;
using RentaTool.Modules.Catalog.Infrastructure;
using RentaTool.Modules.Identity.Infrastructure;
using RentaTool.Modules.Escrow.Infrastructure;
using RentaTool.Shared.Infrastructure.Persistence;

var builder = WebApplication.CreateBuilder(args);

// 1. Database Persistence (PostgreSQL with EF Core)
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection")
    ?? "Host=localhost;Port=5432;Database=rentatool_db;Username=postgres;Password=rentatool_dev_secret_password";

builder.Services.AddDbContext<AppDbContext>(options =>
{
    options.UseNpgsql(connectionString);
});

// 2. Add MVC Controllers (scanning host and modular assemblies)
builder.Services.AddControllers()
    .AddApplicationPart(typeof(RentaTool.Modules.Catalog.Controllers.EquipmentController).Assembly)
    .AddApplicationPart(typeof(RentaTool.Modules.Booking.Controllers.BookingsController).Assembly)
    .AddApplicationPart(typeof(RentaTool.Modules.Identity.Controllers.AuthController).Assembly)
    .AddApplicationPart(typeof(RentaTool.Modules.Escrow.Controllers.EscrowController).Assembly);

// 3. Register Business Modules (Clean Modular Monolith Extension Points)
builder.Services.AddCatalogModule();
builder.Services.AddBookingModule();
builder.Services.AddIdentityModule(builder.Configuration);
builder.Services.AddEscrowModule();

// 4. OpenAPI / Swagger Documentation with Bearer Auth UI
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "RentaTool LK API – Modular Monolith Backend",
        Version = "v1",
        Description = "Authoritative REST API for RentaTool LK Peer-to-Peer Machinery & Equipment Rental System (SE3090 Assignment 1)"
    });

    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "JWT Authorization header using the Bearer scheme. Example: \"Authorization: Bearer {token}\"",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.ApiKey,
        Scheme = "Bearer"
    });

    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

// 5. CORS configuration for React Web & Flutter
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

var app = builder.Build();

// Configure the HTTP request pipeline
if (app.Environment.IsDevelopment() || true)
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "RentaTool LK API v1");
        c.RoutePrefix = "swagger";
    });
}

app.UseCors("AllowAll");
app.UseRouting();
app.UseAuthentication();
app.UseAuthorization();

// Ensure database schema exists for local testing
using (var scope = app.Services.CreateScope())
{
    try
    {
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        db.Database.EnsureCreated();

        if (db.Database.IsRelational())
        {
            try
            {
                db.Database.ExecuteSqlRaw(@"
                    ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT TRUE;
                    ALTER TABLE users ADD COLUMN IF NOT EXISTS suspension_reason character varying(500);
                ");
            }
            catch (Exception ex)
            {
                app.Logger.LogDebug("Auto-migration schema update skipped or already applied: {Message}", ex.Message);
            }
        }
    }
    catch (Exception ex)
    {
        app.Logger.LogWarning("Could not auto-create database tables on startup: {Message}", ex.Message);
    }
}

// Health check endpoint
app.MapGet("/health", () => Results.Ok(new
{
    status = "Healthy",
    service = "RentaTool.API",
    timestamp = DateTime.UtcNow,
    framework = "ASP.NET Core 9.0",
    modules = new[] { "Identity", "Catalog", "Booking", "Escrow" }
})).WithName("HealthCheck");

app.MapControllers();

// Ensure PostgreSQL database schema and seed initial Component 2 data in Development
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    try
    {
        await db.Database.EnsureCreatedAsync();

        // Seed categories if table is empty
        if (!await db.Set<RentaTool.Modules.Catalog.Domain.Category>().AnyAsync())
        {
            var catPower = new RentaTool.Modules.Catalog.Domain.Category("Power Tools", "Heavy-duty electric & cordless drilling, fastening, and cutting tools", "https://cdn.rentatool.lk/icons/drill.svg");
            var catHeavy = new RentaTool.Modules.Catalog.Domain.Category("Heavy Machinery", "Earthmoving, compaction, and civil construction equipment", "https://cdn.rentatool.lk/icons/excavator.svg");
            var catClean = new RentaTool.Modules.Catalog.Domain.Category("Cleaning Equipment", "Industrial high-pressure washers, vacuum cleaners, and scrubbers", "https://cdn.rentatool.lk/icons/washer.svg");
            var catGen = new RentaTool.Modules.Catalog.Domain.Category("Generators & Power", "Silent diesel & petrol portable power generators", "https://cdn.rentatool.lk/icons/generator.svg");

            db.Set<RentaTool.Modules.Catalog.Domain.Category>().AddRange(catPower, catHeavy, catClean, catGen);
            await db.SaveChangesAsync();

            // Seed initial verified equipment
            var ownerId = Guid.Parse("99999999-9999-9999-9999-999999999999");

            var washer = new RentaTool.Modules.Catalog.Domain.Equipment(
                ownerId,
                "Karcher HD 5/15 C Pressure Washer",
                "Compact, commercial cold-water high pressure washer. Ideal for construction site cleaning.",
                catClean.Id,
                3500m,
                75000m,
                "Colombo 03"
            );
            washer.RecordRentalDays(24);

            var hammer = new RentaTool.Modules.Catalog.Domain.Equipment(
                ownerId,
                "Bosch Professional GBH 8-45 D Rotary Hammer",
                "Heavy 1500W SDS-Max demolition hammer for concrete drilling and chiselling.",
                catPower.Id,
                4200m,
                120000m,
                "Kandy"
            );
            hammer.RecordRentalDays(62); // Reaches 60-day threshold

            var compactor = new RentaTool.Modules.Catalog.Domain.Equipment(
                Guid.Parse("88888888-8888-8888-8888-888888888888"),
                "Mikasa Plate Compactor 90kg",
                "High-compaction forward plate compactor powered by Honda GX160 engine.",
                catHeavy.Id,
                6500m,
                210000m,
                "Gampaha"
            );
            compactor.FlagForMaintenance();
            compactor.RecordRentalDays(78);

            db.Set<RentaTool.Modules.Catalog.Domain.Equipment>().AddRange(washer, hammer, compactor);
            await db.SaveChangesAsync();
        }
    }
    catch (Exception ex)
    {
        app.Logger.LogWarning(ex, "Could not auto-migrate PostgreSQL database. API will proceed.");
    }
}

app.Run();

