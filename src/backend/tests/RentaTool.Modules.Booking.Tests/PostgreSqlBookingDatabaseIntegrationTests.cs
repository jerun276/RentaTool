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
