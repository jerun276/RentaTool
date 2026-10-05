using Microsoft.EntityFrameworkCore;
using RentaTool.Modules.Catalog.Domain;
using RentaTool.Shared.Infrastructure.Persistence;

namespace RentaTool.Modules.Catalog.Tests;

public static class TestDbContextFactory
{
    public static AppDbContext Create(string dbName)
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: dbName)
            .Options;

        var context = new AppDbContext(options);
        context.Database.EnsureCreated();

        // Seed basic category if not present
        if (!context.Set<Category>().Any())
        {
            context.Set<Category>().AddRange(
                new Category("Power Tools", "Heavy duty power tools", "drill.png"),
                new Category("Gardening", "Lawnmowers and hedge trimmers", "gardening.png"),
                new Category("Cleaning", "Pressure washers and vacuums", "cleaning.png")
            );
            context.SaveChanges();
        }

        return context;
    }
}
