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
    options.AddDefaultPolicy(policy =>
    {
        policy.SetIsOriginAllowed(_ => true)
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
    options.AddPolicy("AllowAll", policy =>
    {
        policy.SetIsOriginAllowed(_ => true)
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
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

app.UseRouting();
app.UseCors("AllowAll");
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
                    ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_photo_url character varying(2048);
                    ALTER TABLE categories ADD COLUMN IF NOT EXISTS specification_schema_json jsonb NOT NULL DEFAULT '[]'::jsonb;
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

        const string powerToolsSchema = @"[{""key"":""power_rating"",""label"":""Power Rating"",""unit"":""W / kW"",""fieldType"":""text"",""isRequired"":true,""options"":[]},{""key"":""voltage"",""label"":""Operating Voltage"",""unit"":""V"",""fieldType"":""select"",""isRequired"":true,""options"":[""110V"",""230V / Single-Phase"",""400V / 3-Phase"",""18V Cordless Battery"",""36V Cordless Battery""]},{""key"":""chuck_blade_size"",""label"":""Chuck / Blade Size"",""unit"":""mm / inch"",""fieldType"":""text"",""isRequired"":false,""options"":[]},{""key"":""no_load_speed"",""label"":""Max Speed / RPM"",""unit"":""RPM"",""fieldType"":""number"",""isRequired"":false,""options"":[]},{""key"":""power_source"",""label"":""Power Source"",""unit"":"""",""fieldType"":""select"",""isRequired"":true,""options"":[""Electric Corded"",""Cordless Li-ion"",""Pneumatic / Air"",""Petrol Engine""]},{""key"":""weight"",""label"":""Tool Weight"",""unit"":""kg"",""fieldType"":""number"",""isRequired"":false,""options"":[]}]";
        const string heavyMachinerySchema = @"[{""key"":""operating_weight"",""label"":""Operating Weight"",""unit"":""tons"",""fieldType"":""number"",""isRequired"":true,""options"":[]},{""key"":""engine_power"",""label"":""Engine Power"",""unit"":""HP / kW"",""fieldType"":""text"",""isRequired"":true,""options"":[]},{""key"":""bucket_capacity"",""label"":""Bucket / Blade Capacity"",""unit"":""m³"",""fieldType"":""number"",""isRequired"":false,""options"":[]},{""key"":""max_dig_depth"",""label"":""Max Digging / Reach Depth"",""unit"":""m"",""fieldType"":""number"",""isRequired"":false,""options"":[]},{""key"":""fuel_type"",""label"":""Fuel Type"",""unit"":"""",""fieldType"":""select"",""isRequired"":true,""options"":[""Diesel"",""Electric"",""Hybrid""]}]";
        const string cleaningEquipmentSchema = @"[{""key"":""working_pressure"",""label"":""Operating Pressure"",""unit"":""Bar / PSI"",""fieldType"":""text"",""isRequired"":true,""options"":[]},{""key"":""flow_rate"",""label"":""Water Flow Rate"",""unit"":""L/min"",""fieldType"":""number"",""isRequired"":false,""options"":[]},{""key"":""tank_capacity"",""label"":""Solution Tank Capacity"",""unit"":""Liters"",""fieldType"":""number"",""isRequired"":false,""options"":[]},{""key"":""power_source"",""label"":""Power Source"",""unit"":"""",""fieldType"":""select"",""isRequired"":true,""options"":[""230V Electric"",""400V 3-Phase"",""Petrol Engine"",""Diesel Engine""]}]";
        const string generatorsSchema = @"[{""key"":""rated_output"",""label"":""Rated Output"",""unit"":""kVA / kW"",""fieldType"":""text"",""isRequired"":true,""options"":[]},{""key"":""voltage_phase"",""label"":""Voltage & Phase"",""unit"":"""",""fieldType"":""select"",""isRequired"":true,""options"":[""230V Single-Phase"",""400V Three-Phase"",""Dual Voltage (230V/400V)""]},{""key"":""fuel_type"",""label"":""Fuel Type"",""unit"":"""",""fieldType"":""select"",""isRequired"":true,""options"":[""Diesel"",""Petrol"",""LPG / Natural Gas"",""Solar Battery""]},{""key"":""tank_capacity"",""label"":""Fuel Tank Capacity"",""unit"":""Liters"",""fieldType"":""number"",""isRequired"":false,""options"":[]},{""key"":""sound_level"",""label"":""Noise Level"",""unit"":""dBA @ 7m"",""fieldType"":""number"",""isRequired"":false,""options"":[]}]";

        var powerGuid = Guid.Parse("b25c3bf2-9d33-4df4-b3c9-02660a92d244");
        var heavyGuid = Guid.Parse("352ea07e-bd97-481b-a287-027036658902");
        var cleanGuid = Guid.Parse("8ca549e3-2fc5-48b3-aa2d-aa5d15a7cf93");
        var genGuid = Guid.Parse("64949df2-eb06-4447-920a-f0fbf1fa000a");

        // Seed or update categories with schemas and deterministic GUIDs
        var existingCategories = await db.Set<RentaTool.Modules.Catalog.Domain.Category>().ToListAsync();
        var toAdd = new List<RentaTool.Modules.Catalog.Domain.Category>();
        if (!existingCategories.Any(c => c.Name == "Power Tools" || c.Id == powerGuid))
            toAdd.Add(new RentaTool.Modules.Catalog.Domain.Category("Power Tools", "Heavy-duty electric & cordless drilling, fastening, and cutting tools", "https://cdn.rentatool.lk/icons/drill.svg", powerToolsSchema, powerGuid));
        if (!existingCategories.Any(c => c.Name == "Heavy Machinery" || c.Id == heavyGuid))
            toAdd.Add(new RentaTool.Modules.Catalog.Domain.Category("Heavy Machinery", "Earthmoving, compaction, and civil construction equipment", "https://cdn.rentatool.lk/icons/excavator.svg", heavyMachinerySchema, heavyGuid));
        if (!existingCategories.Any(c => c.Name == "Cleaning Equipment" || c.Id == cleanGuid))
            toAdd.Add(new RentaTool.Modules.Catalog.Domain.Category("Cleaning Equipment", "Industrial high-pressure washers, vacuum cleaners, and scrubbers", "https://cdn.rentatool.lk/icons/washer.svg", cleaningEquipmentSchema, cleanGuid));
        if (!existingCategories.Any(c => c.Name == "Generators & Power" || c.Id == genGuid))
            toAdd.Add(new RentaTool.Modules.Catalog.Domain.Category("Generators & Power", "Silent diesel & petrol portable power generators", "https://cdn.rentatool.lk/icons/generator.svg", generatorsSchema, genGuid));

        if (toAdd.Count > 0)
        {
            db.Set<RentaTool.Modules.Catalog.Domain.Category>().AddRange(toAdd);
            await db.SaveChangesAsync();
            existingCategories = await db.Set<RentaTool.Modules.Catalog.Domain.Category>().ToListAsync();
        }

        // Backfill schemas if existing categories have empty schemas
        bool anyUpdated = false;
        foreach (var cat in existingCategories)
        {
            if (string.IsNullOrWhiteSpace(cat.SpecificationSchemaJson) || cat.SpecificationSchemaJson == "[]")
            {
                if (cat.Name == "Power Tools" || cat.Id == powerGuid) { cat.SetSpecificationSchema(powerToolsSchema); anyUpdated = true; }
                else if (cat.Name == "Heavy Machinery" || cat.Id == heavyGuid) { cat.SetSpecificationSchema(heavyMachinerySchema); anyUpdated = true; }
                else if (cat.Name == "Cleaning Equipment" || cat.Id == cleanGuid) { cat.SetSpecificationSchema(cleaningEquipmentSchema); anyUpdated = true; }
                else if (cat.Name == "Generators & Power" || cat.Id == genGuid) { cat.SetSpecificationSchema(generatorsSchema); anyUpdated = true; }
            }
        }
        if (anyUpdated)
        {
            await db.SaveChangesAsync();
        }

        // Seed initial equipment only if equipment table is empty
        if (!await db.Set<RentaTool.Modules.Catalog.Domain.Equipment>().AnyAsync())
        {
            var cleanCat = existingCategories.FirstOrDefault(c => c.Name == "Cleaning Equipment") ?? existingCategories.First();
            var powerCat = existingCategories.FirstOrDefault(c => c.Name == "Power Tools") ?? existingCategories.First();
            var heavyCat = existingCategories.FirstOrDefault(c => c.Name == "Heavy Machinery") ?? existingCategories.First();

            var ownerId = Guid.Parse("99999999-9999-9999-9999-999999999999");

            var washer = new RentaTool.Modules.Catalog.Domain.Equipment(
                ownerId,
                "Karcher HD 5/15 C Pressure Washer",
                "Compact, commercial cold-water high pressure washer. Ideal for construction site cleaning.",
                cleanCat.Id,
                3500m,
                75000m,
                "Colombo 03"
            );
            washer.RecordRentalDays(24);

            var hammer = new RentaTool.Modules.Catalog.Domain.Equipment(
                ownerId,
                "Bosch Professional GBH 8-45 D Rotary Hammer",
                "Heavy 1500W SDS-Max demolition hammer for concrete drilling and chiselling.",
                powerCat.Id,
                4200m,
                120000m,
                "Kandy"
            );
            hammer.RecordRentalDays(62); // Reaches 60-day threshold

            var compactor = new RentaTool.Modules.Catalog.Domain.Equipment(
                Guid.Parse("88888888-8888-8888-8888-888888888888"),
                "Mikasa Plate Compactor 90kg",
                "High-compaction forward plate compactor powered by Honda GX160 engine.",
                heavyCat.Id,
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

