using Microsoft.EntityFrameworkCore;
using RentaTool.Modules.Identity.Domain;
using RentaTool.Shared.Infrastructure.Persistence;
using RentaTool.Shared.Kernel.Domain;

namespace RentaTool.Modules.Identity.Tests;

public class DatabaseIntegrationTests
{
    [Fact]
    public async Task Database_Should_Save_And_Retrieve_User_Correctly()
    {
        // Arrange (Database connection setup)
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        await using var dbContext = new AppDbContext(options);
        var testUser = new User("Test DB User", "dbtest@example.com", "HashedPass", UserRole.Renter, "0770000000");
        
        // Act (Insert data into database)
        dbContext.Set<User>().Add(testUser);
        await dbContext.SaveChangesAsync();

        // Retrieve from database
        var retrievedUser = await dbContext.Set<User>().FirstOrDefaultAsync(u => u.Email == "dbtest@example.com");

        // Assert (Verify data integrity)
        Assert.NotNull(retrievedUser);
        Assert.Equal("Test DB User", retrievedUser.Name);
    }
}
