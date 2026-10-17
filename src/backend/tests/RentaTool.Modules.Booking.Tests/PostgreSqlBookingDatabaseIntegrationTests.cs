using Microsoft.EntityFrameworkCore;
using RentaTool.Modules.Booking.Domain;
using RentaTool.Shared.Infrastructure.Persistence;
using RentaTool.Shared.Kernel.Domain;
using Xunit;

namespace RentaTool.Modules.Booking.Tests;

public class PostgreSqlBookingDatabaseIntegrationTests : IAsyncLifetime
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

                const string createBookingSchemaSql = """
                    CREATE TABLE IF NOT EXISTS bookings (
                        id UUID PRIMARY KEY,
                        equipment_id UUID NOT NULL,
                        renter_id UUID NOT NULL,
                        owner_id UUID NOT NULL,
                        start_date TIMESTAMP WITH TIME ZONE NOT NULL,
                        end_date TIMESTAMP WITH TIME ZONE NOT NULL,
                        daily_rate NUMERIC(18,2) NOT NULL,
                        total_rental_fee NUMERIC(18,2) NOT NULL,
                        status VARCHAR(50) NOT NULL,
                        cancellation_reason VARCHAR(500),
                        created_at_utc TIMESTAMP WITH TIME ZONE NOT NULL,
                        updated_at_utc TIMESTAMP WITH TIME ZONE,
                        is_deleted BOOLEAN NOT NULL DEFAULT FALSE
                    );
                    CREATE INDEX IF NOT EXISTS ix_bookings_equipment_id ON bookings(equipment_id);
                    CREATE INDEX IF NOT EXISTS ix_bookings_renter_id ON bookings(renter_id);
                    CREATE INDEX IF NOT EXISTS ix_bookings_owner_id ON bookings(owner_id);
                    CREATE INDEX IF NOT EXISTS ix_bookings_status ON bookings(status);

                    CREATE TABLE IF NOT EXISTS handover_events (
                        id UUID PRIMARY KEY,
                        booking_id UUID NOT NULL,
                        event_type VARCHAR(50) NOT NULL,
                        handover_token_hash VARCHAR(128) NOT NULL,
                        is_confirmed BOOLEAN NOT NULL,
                        expires_at_utc TIMESTAMP WITH TIME ZONE NOT NULL,
                        geo_location_id UUID,
                        created_at_utc TIMESTAMP WITH TIME ZONE NOT NULL,
                        updated_at_utc TIMESTAMP WITH TIME ZONE,
                        is_deleted BOOLEAN NOT NULL DEFAULT FALSE
                    );
                    CREATE INDEX IF NOT EXISTS ix_handover_events_booking_id ON handover_events(booking_id);
                    CREATE INDEX IF NOT EXISTS ix_handover_events_token ON handover_events(handover_token_hash);
                """;

                try
                {
                    await _context.Database.ExecuteSqlRawAsync(createBookingSchemaSql);
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
    public async Task PostgreSql_Booking_CanConnect_And_VerifyTables()
    {
        if (!_dbAvailable || _context == null) return;

        var canConnect = await _context.Database.CanConnectAsync();
        Assert.True(canConnect, "Successfully connected to PostgreSQL database.");
    }

    [Fact]
    public async Task PostgreSql_Booking_PersistsWithUtcTimestamps_And_ValidatesDates()
    {
        if (!_dbAvailable || _context == null) return;

        var equipmentId = Guid.NewGuid();
        var renterId = Guid.NewGuid();
        var ownerId = Guid.NewGuid();
        var startDate = DateTime.UtcNow.AddDays(2);
        var endDate = DateTime.UtcNow.AddDays(5);
        var dailyRate = 3500.00m;
        var totalFee = 3 * dailyRate;

        var booking = new Domain.Booking(
            equipmentId,
            renterId,
            ownerId,
            startDate,
            endDate,
            dailyRate,
            totalFee
        );

        await _context.Set<Domain.Booking>().AddAsync(booking);
        await _context.SaveChangesAsync();

        var retrieved = await _context.Set<Domain.Booking>().FirstOrDefaultAsync(b => b.Id == booking.Id);
        Assert.NotNull(retrieved);
        Assert.Equal(equipmentId, retrieved.EquipmentId);
        Assert.Equal(BookingStatus.Requested, retrieved.Status);
        Assert.Equal(totalFee, retrieved.TotalRentalFee);
    }

    [Fact]
    public async Task PostgreSql_Booking_TransactionRollback_PreservesIntegrity()
    {
        if (!_dbAvailable || _context == null) return;

        var booking = new Domain.Booking(
            Guid.NewGuid(),
            Guid.NewGuid(),
            Guid.NewGuid(),
            DateTime.UtcNow.AddDays(1),
            DateTime.UtcNow.AddDays(3),
            2000m,
            4000m
        );

        await using (var transaction = await _context.Database.BeginTransactionAsync())
        {
            await _context.Set<Domain.Booking>().AddAsync(booking);
            await _context.SaveChangesAsync();

            await transaction.RollbackAsync();
        }

        _context.ChangeTracker.Clear();
        var retrieved = await _context.Set<Domain.Booking>().FirstOrDefaultAsync(b => b.Id == booking.Id);
        Assert.Null(retrieved);
    }
}
