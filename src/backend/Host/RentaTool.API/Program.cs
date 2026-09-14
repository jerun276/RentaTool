using Microsoft.EntityFrameworkCore;
using Microsoft.OpenApi.Models;
using RentaTool.Modules.Booking.Infrastructure;
using RentaTool.Modules.Catalog.Infrastructure;
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
    .AddApplicationPart(typeof(RentaTool.Modules.Booking.Controllers.BookingsController).Assembly);

// 3. Register Business Modules (Clean Modular Monolith Extension Points)
builder.Services.AddCatalogModule();
builder.Services.AddBookingModule();

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

// Ensure database schema exists for local testing
using (var scope = app.Services.CreateScope())
{
    try
    {
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        db.Database.EnsureCreated();
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

app.UseRouting();

app.MapControllers();

app.Run();
