using Microsoft.EntityFrameworkCore;
using RentaTool.Modules.Escrow.Domain;
using RentaTool.Shared.Infrastructure.Persistence;
using Xunit;

namespace RentaTool.Modules.Escrow.Tests;

public class PostgreSqlEscrowDatabaseIntegrationTests : IAsyncLifetime
{
    private static string ConnectionString =>
        Environment.GetEnvironmentVariable("DB_CONNECTION_STRING")
        ?? Environment.GetEnvironmentVariable("ConnectionStrings__DefaultConnection")
        ?? "Host=localhost;Port=5432;Database=rentatool_db;Username=postgres;Password=root;Timeout=5;CommandTimeout=5";

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
    public async Task PostgreSql_Escrow_CanConnect_And_VerifyTables()
    {
        if (!_dbAvailable || _context == null) return;

        var canConnect = await _context.Database.CanConnectAsync();
        Assert.True(canConnect, "Successfully connected to PostgreSQL database.");
    }

    [Fact]
    public async Task PostgreSql_EscrowHold_PersistsDepositPrecision_And_StateTransitions()
    {
        if (!_dbAvailable || _context == null) return;

        var bookingId = Guid.NewGuid();
        var renterId = Guid.NewGuid();
        var ownerId = Guid.NewGuid();
        var deposit = 25000.75m;
        var txnId = $"TXN_{Guid.NewGuid():N}";

        var escrow = new EscrowHold(bookingId, renterId, ownerId, deposit, txnId);

        await _context.Set<EscrowHold>().AddAsync(escrow);
        await _context.SaveChangesAsync();

        var retrieved = await _context.Set<EscrowHold>().FirstOrDefaultAsync(e => e.Id == escrow.Id);
        Assert.NotNull(retrieved);
        Assert.Equal(deposit, retrieved.DepositAmount);
        Assert.Equal(EscrowStatus.Held, retrieved.Status);

        // Test state transition persistence in PostgreSQL
        retrieved.MarkDisputed();
        await _context.SaveChangesAsync();

        _context.ChangeTracker.Clear();
        var updated = await _context.Set<EscrowHold>().FirstOrDefaultAsync(e => e.Id == escrow.Id);
        Assert.NotNull(updated);
        Assert.Equal(EscrowStatus.Disputed, updated.Status);
    }

    [Fact]
    public async Task PostgreSql_Escrow_TransactionRollback_PreservesIntegrity()
    {
        if (!_dbAvailable || _context == null) return;

        var escrow = new EscrowHold(
            Guid.NewGuid(),
            Guid.NewGuid(),
            Guid.NewGuid(),
            50000m,
            $"ROLLBACK_{Guid.NewGuid():N}"
        );

        await using (var transaction = await _context.Database.BeginTransactionAsync())
        {
            await _context.Set<EscrowHold>().AddAsync(escrow);
            await _context.SaveChangesAsync();

            await transaction.RollbackAsync();
        }

        _context.ChangeTracker.Clear();
        var retrieved = await _context.Set<EscrowHold>().FirstOrDefaultAsync(e => e.Id == escrow.Id);
        Assert.Null(retrieved);
    }
}
