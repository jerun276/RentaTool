using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using RentaTool.Modules.Identity.Domain;
using RentaTool.Modules.Identity.Security;
using RentaTool.Shared.Infrastructure.Persistence;
using RentaTool.Shared.Kernel.Domain;

namespace RentaTool.Modules.Identity.Infrastructure;

/// <summary>Creates predictable local-only accounts for API and UI testing.</summary>
internal sealed class IdentityDevelopmentSeedService(
    IServiceScopeFactory scopeFactory,
    IHostEnvironment environment,
    ILogger<IdentityDevelopmentSeedService> logger) : IHostedService
{
    public async Task StartAsync(CancellationToken cancellationToken)
    {
        if (!environment.IsDevelopment())
            return;

        await using var scope = scopeFactory.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        // EnsureCreated is also called by the host; this makes the seeder safe when used independently.
        await db.Database.EnsureCreatedAsync(cancellationToken);
        var seeds = new[]
        {
            new SeedUser("Local Admin", "admin@rentatool.lk", "Admin@123", UserRole.Admin, "0770000001", false),
            new SeedUser("Verified Owner", "owner@rentatool.lk", "Owner@123", UserRole.Owner, "0770000002", true),
            new SeedUser("Verified Renter", "renter@rentatool.lk", "Renter@123", UserRole.Renter, "0770000003", true)
        };

        foreach (var seed in seeds)
        {
            if (await db.Set<User>().AnyAsync(user => user.Email == seed.Email, cancellationToken))
                continue;

            var user = new User(seed.Name, seed.Email, PasswordHasher.Hash(seed.Password), seed.Role, seed.PhoneNumber);
            if (seed.IsVerified)
                user.SetVerified();

            db.Set<User>().Add(user);
            db.Set<UserRoleAssignment>().Add(new UserRoleAssignment(user.Id, seed.Role));
            db.Set<TrustLedger>().Add(new TrustLedger(
                user.Id,
                50,
                "Account created",
                "development-seed-registration",
                50));
            if (seed.IsVerified)
            {
                db.Set<TrustLedger>().Add(new TrustLedger(
                    user.Id,
                    25,
                    "KYC approved",
                    "development-seed-kyc",
                    75));
            }
        }

        if (db.ChangeTracker.HasChanges())
        {
            await db.SaveChangesAsync(cancellationToken);
            logger.LogInformation("Seeded missing Identity development accounts.");
        }
    }

    public Task StopAsync(CancellationToken cancellationToken) => Task.CompletedTask;

    private sealed record SeedUser(
        string Name,
        string Email,
        string Password,
        UserRole Role,
        string PhoneNumber,
        bool IsVerified);
}
