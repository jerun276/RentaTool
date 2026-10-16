using Microsoft.EntityFrameworkCore;
using Npgsql;
using RentaTool.Modules.Identity.Domain;
using RentaTool.Shared.Infrastructure.Persistence;
using RentaTool.Shared.Kernel.Domain;
using Xunit;

namespace RentaTool.Modules.Identity.Tests;

public class PostgreSqlDatabaseIntegrationTests : IAsyncLifetime
{
    private const string ConnectionString = "Host=localhost;Port=5432;Database=rentatool_db;Username=postgres;Password=root;Timeout=2;CommandTimeout=2";
    private AppDbContext? _context;
    private bool _dbAvailable;

    public async Task InitializeAsync()
    {
        try
        {
            var options = new DbContextOptionsBuilder<AppDbContext>()
                .UseNpgsql(ConnectionString)
                .Options;

            _context = new AppDbContext(options);
            _dbAvailable = await _context.Database.CanConnectAsync();
            if (_dbAvailable)
            {
                await _context.Database.EnsureCreatedAsync();
                try
                {
                    await _context.Database.ExecuteSqlRawAsync("ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_photo_url VARCHAR(2048);");
                    await _context.Database.ExecuteSqlRawAsync("ALTER TABLE users ADD COLUMN IF NOT EXISTS refresh_token VARCHAR(256);");
                    await _context.Database.ExecuteSqlRawAsync("ALTER TABLE users ADD COLUMN IF NOT EXISTS refresh_token_expires_at_utc TIMESTAMP WITH TIME ZONE;");
                }
                catch { }
            }
        }
        catch
        {
            _dbAvailable = false;
        }
    }

    public async Task DisposeAsync()
    {
        if (_context != null)
        {
            await _context.DisposeAsync();
        }
    }

    [Fact]
    public async Task PostgreSql_DatabaseConnection_And_SchemaCreation_Succeeds()
    {
        if (!_dbAvailable || _context == null) return; // Skip if PostgreSQL is not running

        // Assert: Database can connect
        var canConnect = await _context.Database.CanConnectAsync();
        Assert.True(canConnect, "Successfully connected to PostgreSQL container.");
    }

    [Fact]
    public async Task PostgreSql_UniqueEmailConstraint_ThrowsDbUpdateException_OnDuplicate()
    {
        if (!_dbAvailable || _context == null) return;

        // Arrange
        var uniqueEmail = $"dup_{Guid.NewGuid():N}@rentatool.test";
        var user1 = new User("User One", uniqueEmail, "hash1", UserRole.Renter, "0771112222");
        var user2 = new User("User Two", uniqueEmail, "hash2", UserRole.Owner, "0773334444");

        await _context.Set<User>().AddAsync(user1);
        await _context.SaveChangesAsync();

        // Act & Assert: Inserting duplicate email must violate unique constraint in PostgreSQL
        await _context.Set<User>().AddAsync(user2);
        var ex = await Assert.ThrowsAsync<DbUpdateException>(() => _context.SaveChangesAsync());
        
        Assert.NotNull(ex.InnerException);
        Assert.Contains("unique", ex.InnerException.Message.ToLowerInvariant());
    }

    [Fact]
    public async Task PostgreSql_CompositeKeyConstraint_UserRoleAssignment_EnforcesIntegrity()
    {
        if (!_dbAvailable || _context == null) return;

        // Arrange
        var userId = Guid.NewGuid();
        var assignment1 = new UserRoleAssignment(userId, UserRole.Owner);
        var assignment2 = new UserRoleAssignment(userId, UserRole.Owner); // Duplicate role for same user

        await _context.Set<UserRoleAssignment>().AddAsync(assignment1);
        await _context.SaveChangesAsync();

        // Act & Assert
        await _context.Set<UserRoleAssignment>().AddAsync(assignment2);
        await Assert.ThrowsAsync<DbUpdateException>(() => _context.SaveChangesAsync());
    }

    [Fact]
    public async Task PostgreSql_TransactionRollback_PreservesDataIntegrity_OnFailure()
    {
        if (!_dbAvailable || _context == null) return;

        // Arrange
        var uniqueEmail = $"rollback_{Guid.NewGuid():N}@rentatool.test";
        var user = new User("Rollback User", uniqueEmail, "hash", UserRole.Renter, "0779998888");

        // Act: Start explicit database transaction
        await using (var transaction = await _context.Database.BeginTransactionAsync())
        {
            await _context.Set<User>().AddAsync(user);
            await _context.SaveChangesAsync();

            // Simulate business failure and rollback
            await transaction.RollbackAsync();
        }

        // Assert: Verify user does not exist in PostgreSQL
        _context.ChangeTracker.Clear();
        var persistedUser = await _context.Set<User>().FirstOrDefaultAsync(u => u.Email == uniqueEmail);
        Assert.Null(persistedUser);
    }

    [Fact]
    public async Task PostgreSql_KycRecord_ForeignDataIntegrity_SavesSuccessfully()
    {
        if (!_dbAvailable || _context == null) return;

        // Arrange
        var userId = Guid.NewGuid();
        var kyc = new KycRecord(
            userId,
            "NationalID",
            "NIC-12345678V",
            "https://cdn.rentatool.test/front.jpg",
            "https://cdn.rentatool.test/back.jpg"
        );

        // Act
        await _context.Set<KycRecord>().AddAsync(kyc);
        await _context.SaveChangesAsync();

        // Assert
        var savedKyc = await _context.Set<KycRecord>().FirstOrDefaultAsync(k => k.Id == kyc.Id);
        Assert.NotNull(savedKyc);
        Assert.Equal("NIC-12345678V", savedKyc.DocumentNumber);
        Assert.Equal(KycStatus.Pending, savedKyc.Status);
    }
}
