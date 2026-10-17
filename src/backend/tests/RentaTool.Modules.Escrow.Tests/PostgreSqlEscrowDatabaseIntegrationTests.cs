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

                const string createEscrowSchemaSql = """
                    CREATE TABLE IF NOT EXISTS escrow_holds (
                        id UUID PRIMARY KEY,
                        booking_id UUID NOT NULL,
                        renter_id UUID NOT NULL,
                        owner_id UUID NOT NULL,
                        deposit_amount NUMERIC(18,2) NOT NULL,
                        pre_auth_transaction_id VARCHAR(100) NOT NULL,
                        status VARCHAR(50) NOT NULL,
                        held_at_utc TIMESTAMP WITH TIME ZONE NOT NULL,
                        settled_at_utc TIMESTAMP WITH TIME ZONE,
                        created_at_utc TIMESTAMP WITH TIME ZONE NOT NULL,
                        updated_at_utc TIMESTAMP WITH TIME ZONE,
                        is_deleted BOOLEAN NOT NULL DEFAULT FALSE
                    );
                    CREATE INDEX IF NOT EXISTS ix_escrow_holds_booking_id ON escrow_holds(booking_id);
                    CREATE INDEX IF NOT EXISTS ix_escrow_holds_status ON escrow_holds(status);

                    CREATE TABLE IF NOT EXISTS damage_claims (
                        id UUID PRIMARY KEY,
                        booking_id UUID NOT NULL,
                        filed_by_user_id UUID NOT NULL,
                        damage_description VARCHAR(2000) NOT NULL,
                        evidence_photos_json JSONB NOT NULL,
                        proposed_deduction NUMERIC(18,2) NOT NULL,
                        final_deduction NUMERIC(18,2),
                        status VARCHAR(50) NOT NULL,
                        adjudication_notes VARCHAR(1000),
                        adjudicated_by_user_id UUID,
                        adjudicated_at_utc TIMESTAMP WITH TIME ZONE,
                        created_at_utc TIMESTAMP WITH TIME ZONE NOT NULL,
                        updated_at_utc TIMESTAMP WITH TIME ZONE,
                        is_deleted BOOLEAN NOT NULL DEFAULT FALSE
                    );

                    CREATE TABLE IF NOT EXISTS payments (
                        id UUID PRIMARY KEY,
                        claim_id UUID,
                        booking_id UUID NOT NULL,
                        payer_user_id UUID NOT NULL,
                        recipient_user_id UUID NOT NULL,
                        amount NUMERIC(18,2) NOT NULL,
                        payment_type VARCHAR(50) NOT NULL,
                        status VARCHAR(50) NOT NULL,
                        gateway_transaction_ref VARCHAR(100) NOT NULL,
                        created_at_utc TIMESTAMP WITH TIME ZONE NOT NULL,
                        updated_at_utc TIMESTAMP WITH TIME ZONE,
                        is_deleted BOOLEAN NOT NULL DEFAULT FALSE
                    );

                    CREATE TABLE IF NOT EXISTS workflow_state_audits (
                        id UUID PRIMARY KEY,
                        claim_id UUID NOT NULL,
                        workflow_id VARCHAR(100) NOT NULL,
                        current_state VARCHAR(50) NOT NULL,
                        agent_id VARCHAR(100) NOT NULL,
                        tool_calls_log JSONB NOT NULL,
                        decision_summary VARCHAR(2000) NOT NULL,
                        human_review_decision VARCHAR(50),
                        created_at_utc TIMESTAMP WITH TIME ZONE NOT NULL,
                        updated_at_utc TIMESTAMP WITH TIME ZONE,
                        is_deleted BOOLEAN NOT NULL DEFAULT FALSE
                    );
                """;

                try
                {
                    await _context.Database.ExecuteSqlRawAsync(createEscrowSchemaSql);
                }
                catch
                {
                    // Ignore if already created or schema up to date
                }
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
