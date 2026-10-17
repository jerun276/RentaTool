using Microsoft.EntityFrameworkCore;
using RentaTool.Modules.Catalog.Domain;
using RentaTool.Shared.Infrastructure.Persistence;
using Xunit;

namespace RentaTool.Modules.Catalog.Tests;

public class PostgreSqlCatalogDatabaseIntegrationTests : IAsyncLifetime
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
    public async Task PostgreSql_Catalog_CanConnect_And_VerifyTables()
    {
        if (!_dbAvailable || _context == null) return;

        var canConnect = await _context.Database.CanConnectAsync();
        Assert.True(canConnect, "Successfully connected to PostgreSQL database.");
    }

    [Fact]
    public async Task PostgreSql_Category_PersistsAndLoads_Successfully()
    {
        if (!_dbAvailable || _context == null) return;

        var catName = $"Heavy Drill {Guid.NewGuid():N}";
        var category = new Category(catName, "High-powered drills", "https://cdn.test/icon.png");

        await _context.Set<Category>().AddAsync(category);
        await _context.SaveChangesAsync();

        var retrieved = await _context.Set<Category>().FirstOrDefaultAsync(c => c.Id == category.Id);
        Assert.NotNull(retrieved);
        Assert.Equal(catName, retrieved.Name);
        Assert.True(retrieved.IsActive);
    }

    [Fact]
    public async Task PostgreSql_Equipment_PersistsPrecision_And_SpecificationsJson()
    {
        if (!_dbAvailable || _context == null) return;

        var category = new Category($"Cat_{Guid.NewGuid():N}", "Test Cat", "");
        await _context.Set<Category>().AddAsync(category);
        await _context.SaveChangesAsync();

        var ownerId = Guid.NewGuid();
        var title = $"Bosch Hammer {Guid.NewGuid():N}";
        var specs = "{\"Power\":\"1500W\",\"Voltage\":\"230V\"}";
        var equipment = new Equipment(ownerId, title, "Heavy hammer", category.Id, 4500.50m, 120000.00m, "Colombo 03", specs);

        await _context.Set<Equipment>().AddAsync(equipment);
        await _context.SaveChangesAsync();

        var retrieved = await _context.Set<Equipment>().FirstOrDefaultAsync(e => e.Id == equipment.Id);
        Assert.NotNull(retrieved);
        Assert.Equal(4500.50m, retrieved.DailyRate);
        Assert.Equal(120000.00m, retrieved.ReplacementValue);
        Assert.Equal(specs, retrieved.SpecificationsJson);
    }

    [Fact]
    public async Task PostgreSql_Equipment_TransactionRollback_PreservesDataIntegrity()
    {
        if (!_dbAvailable || _context == null) return;

        var category = new Category($"Cat_{Guid.NewGuid():N}", "Test Cat", "");
        await _context.Set<Category>().AddAsync(category);
        await _context.SaveChangesAsync();

        var title = $"Rollback Tool {Guid.NewGuid():N}";
        var equipment = new Equipment(Guid.NewGuid(), title, "Temp", category.Id, 2500m, 50000m, "Kandy");

        await using (var transaction = await _context.Database.BeginTransactionAsync())
        {
            await _context.Set<Equipment>().AddAsync(equipment);
            await _context.SaveChangesAsync();

            await transaction.RollbackAsync();
        }

        _context.ChangeTracker.Clear();
        var retrieved = await _context.Set<Equipment>().FirstOrDefaultAsync(e => e.Id == equipment.Id);
        Assert.Null(retrieved);
    }
}
