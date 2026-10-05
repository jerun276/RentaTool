using Microsoft.EntityFrameworkCore;
using RentaTool.Shared.Infrastructure.Persistence;

namespace RentaTool.Modules.Escrow.Tests;

public static class TestDbContextFactory
{
    public static AppDbContext Create(string dbName)
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: dbName)
            .Options;

        var context = new AppDbContext(options);
        context.Database.EnsureCreated();

        return context;
    }
}
