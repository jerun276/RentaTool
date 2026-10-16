using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using RentaTool.Modules.Catalog.Application.DTOs;
using RentaTool.Modules.Catalog.Application.Services;
using RentaTool.Modules.Catalog.Domain;
using RentaTool.Shared.Kernel.Domain;

namespace RentaTool.Modules.Catalog.Tests;

public class EquipmentServiceTests
{
    private readonly Guid _testOwnerId = Guid.NewGuid();

    [Fact]
    public async Task CreateAsync_ValidInput_ReturnsCreatedEquipmentDto()
    {
        // Arrange
        using var context = TestDbContextFactory.Create(nameof(CreateAsync_ValidInput_ReturnsCreatedEquipmentDto));
        var category = await context.Set<Category>().FirstAsync();
        var service = new EquipmentService(context);

        var dto = new CreateEquipmentDto
        {
            Title = "Bosch Rotary Hammer 800W",
            Description = "High-powered concrete hammer drill with SDS-plus chuck.",
            CategoryId = category.Id,
            DailyRate = 2500.00m,
            ReplacementValue = 35000.00m,
            Location = "Colombo",
            Images = new List<ToolImageDto>
            {
                new() { ImageUrl = "https://example.com/drill1.jpg", Angle = "Casing", IsPrimary = true },
                new() { ImageUrl = "https://example.com/drill2.jpg", Angle = "Motor", IsPrimary = false }
            }
        };

        // Act
        var result = await service.CreateAsync(dto, _testOwnerId);

        // Assert
        result.Should().NotBeNull();
        result.Id.Should().NotBeEmpty();
        result.Title.Should().Be("Bosch Rotary Hammer 800W");
        result.DailyRate.Should().Be(2500.00m);
        result.CategoryName.Should().Be(category.Name);
        result.Images.Should().HaveCount(2);
        result.Status.Should().Be(EquipmentStatus.Available.ToString());

        var dbEntity = await context.Set<Equipment>().FindAsync(result.Id);
        dbEntity.Should().NotBeNull();
        dbEntity!.OwnerId.Should().Be(_testOwnerId);
    }

    [Fact]
    public async Task CreateAsync_NonExistentCategory_ThrowsArgumentException()
    {
        // Arrange
        using var context = TestDbContextFactory.Create(nameof(CreateAsync_NonExistentCategory_ThrowsArgumentException));
        var service = new EquipmentService(context);

        var dto = new CreateEquipmentDto
        {
            Title = "Invalid Category Tool",
            CategoryId = Guid.NewGuid(),
            DailyRate = 1000m,
            ReplacementValue = 10000m,
            Location = "Kandy"
        };

        // Act
        var act = () => service.CreateAsync(dto, _testOwnerId);

        // Assert
        await act.Should().ThrowAsync<ArgumentException>()
            .WithMessage("*does not exist*");
    }

    [Fact]
    public async Task CreateAsync_NegativeDailyRate_ThrowsArgumentException()
    {
        // Arrange
        using var context = TestDbContextFactory.Create(nameof(CreateAsync_NegativeDailyRate_ThrowsArgumentException));
        var category = await context.Set<Category>().FirstAsync();
        var service = new EquipmentService(context);

        var dto = new CreateEquipmentDto
        {
            Title = "Negative Price Tool",
            CategoryId = category.Id,
            DailyRate = -500m,
            ReplacementValue = 10000m,
            Location = "Colombo"
        };

        // Act
        var act = () => service.CreateAsync(dto, _testOwnerId);

        // Assert
        await act.Should().ThrowAsync<ArgumentException>()
            .WithMessage("*greater than zero*");
    }

    [Fact]
    public async Task GetByIdAsync_ExistingId_ReturnsEquipmentWithImages()
    {
        // Arrange
        using var context = TestDbContextFactory.Create(nameof(GetByIdAsync_ExistingId_ReturnsEquipmentWithImages));
        var category = await context.Set<Category>().FirstAsync();
        var service = new EquipmentService(context);

        var created = await service.CreateAsync(new CreateEquipmentDto
        {
            Title = "Makita Angle Grinder",
            CategoryId = category.Id,
            DailyRate = 1800m,
            ReplacementValue = 22000m,
            Location = "Galle"
        }, _testOwnerId);

        // Act
        var result = await service.GetByIdAsync(created.Id);

        // Assert
        result.Should().NotBeNull();
        result!.Id.Should().Be(created.Id);
        result.Title.Should().Be("Makita Angle Grinder");
    }

    [Fact]
    public async Task GetPagedListAsync_WithSearchTermAndCategoryFilter_ReturnsFilteredResults()
    {
        // Arrange
        using var context = TestDbContextFactory.Create(nameof(GetPagedListAsync_WithSearchTermAndCategoryFilter_ReturnsFilteredResults));
        var categories = await context.Set<Category>().ToListAsync();
        var powerTools = categories.First(c => c.Name == "Power Tools");
        var gardening = categories.First(c => c.Name == "Gardening");
        var service = new EquipmentService(context);

        await service.CreateAsync(new CreateEquipmentDto
        {
            Title = "Stihl Grass Trimmer",
            CategoryId = gardening.Id,
            DailyRate = 2000m,
            ReplacementValue = 30000m,
            Location = "Kandy"
        }, _testOwnerId);

        await service.CreateAsync(new CreateEquipmentDto
        {
            Title = "Bosch Drill 13mm",
            CategoryId = powerTools.Id,
            DailyRate = 1500m,
            ReplacementValue = 25000m,
            Location = "Colombo"
        }, _testOwnerId);

        // Act - Search for "Drill" under Power Tools
        var filter = new EquipmentFilterDto
        {
            SearchTerm = "Drill",
            CategoryId = powerTools.Id,
            Page = 1,
            PageSize = 10
        };
        var result = await service.GetPagedListAsync(filter);

        // Assert
        result.TotalCount.Should().Be(1);
        result.Items.Should().HaveCount(1);
        result.Items[0].Title.Should().Contain("Drill");
        result.Items[0].CategoryName.Should().Be("Power Tools");
    }

    [Fact]
    public async Task UpdateAsync_OwnerUpdatesEquipmentAndImages_PersistsSuccessfully()
    {
        // Arrange
        using var context = TestDbContextFactory.Create(nameof(UpdateAsync_OwnerUpdatesEquipmentAndImages_PersistsSuccessfully));
        var categories = await context.Set<Category>().ToListAsync();
        var powerTools = categories.First(c => c.Name == "Power Tools");
        var gardening = categories.First(c => c.Name == "Gardening");
        var service = new EquipmentService(context);

        var created = await service.CreateAsync(new CreateEquipmentDto
        {
            Title = "Original Bosch Drill",
            Description = "Original description",
            CategoryId = powerTools.Id,
            DailyRate = 2000m,
            ReplacementValue = 30000m,
            Location = "Colombo",
            Images = new List<ToolImageDto>
            {
                new() { ImageUrl = "https://example.com/img1.jpg", Angle = "Front", IsPrimary = true }
            }
        }, _testOwnerId);

        var updateDto = new UpdateEquipmentDto
        {
            Title = "Updated Bosch Drill Pro",
            Description = "Updated description with extra features",
            CategoryId = gardening.Id,
            DailyRate = 2500m,
            ReplacementValue = 35000m,
            Location = "Kandy",
            Images = new List<ToolImageDto>
            {
                new() { ImageUrl = "https://example.com/new1.jpg", Angle = "Casing", IsPrimary = true },
                new() { ImageUrl = "https://example.com/new2.jpg", Angle = "Motor", IsPrimary = false }
            }
        };

        // Act
        var updated = await service.UpdateAsync(created.Id, updateDto, _testOwnerId);

        // Assert
        updated.Should().NotBeNull();
        updated.Title.Should().Be("Updated Bosch Drill Pro");
        updated.Description.Should().Be("Updated description with extra features");
        updated.DailyRate.Should().Be(2500m);
        updated.ReplacementValue.Should().Be(35000m);
        updated.Location.Should().Be("Kandy");
        updated.CategoryName.Should().Be("Gardening");
        updated.Images.Should().HaveCount(2);
        updated.Images.Should().Contain(i => i.ImageUrl == "https://example.com/new1.jpg");

        // Verify in database
        var dbEntity = await context.Set<Equipment>()
            .Include(e => e.Images)
            .FirstOrDefaultAsync(e => e.Id == created.Id);
        dbEntity.Should().NotBeNull();
        dbEntity!.Title.Should().Be("Updated Bosch Drill Pro");
        dbEntity.Images.Should().HaveCount(2);
        dbEntity.Images.Should().NotContain(i => i.ImageUrl == "https://example.com/img1.jpg");
    }

    [Fact]
    public async Task UpdateAsync_DifferentUser_ThrowsUnauthorizedAccessException()
    {
        // Arrange
        using var context = TestDbContextFactory.Create(nameof(UpdateAsync_DifferentUser_ThrowsUnauthorizedAccessException));
        var category = await context.Set<Category>().FirstAsync();
        var service = new EquipmentService(context);

        var created = await service.CreateAsync(new CreateEquipmentDto
        {
            Title = "Makita Router",
            CategoryId = category.Id,
            DailyRate = 1800m,
            ReplacementValue = 25000m,
            Location = "Colombo"
        }, _testOwnerId);

        var updateDto = new UpdateEquipmentDto
        {
            Title = "Hacked Router",
            CategoryId = category.Id,
            DailyRate = 500m,
            ReplacementValue = 10000m,
            Location = "Galle"
        };

        // Act
        var act = () => service.UpdateAsync(created.Id, updateDto, Guid.NewGuid());

        // Assert
        await act.Should().ThrowAsync<UnauthorizedAccessException>()
            .WithMessage("*not authorized*");
    }

    [Fact]
    public async Task DeleteAsync_Owner_DeletesSuccessfully()
    {
        // Arrange
        using var context = TestDbContextFactory.Create(nameof(DeleteAsync_Owner_DeletesSuccessfully));
        var category = await context.Set<Category>().FirstAsync();
        var service = new EquipmentService(context);

        var created = await service.CreateAsync(new CreateEquipmentDto
        {
            Title = "DeWalt Circular Saw",
            CategoryId = category.Id,
            DailyRate = 2000m,
            ReplacementValue = 30000m,
            Location = "Colombo"
        }, _testOwnerId);

        // Act
        var result = await service.DeleteAsync(created.Id, _testOwnerId);

        // Assert
        result.Should().BeTrue();

        var dbEntity = await context.Set<Equipment>().FindAsync(created.Id);
        dbEntity.Should().NotBeNull();
        dbEntity!.IsDeleted.Should().BeTrue();

        // Should no longer appear in GetByIdAsync
        var fetched = await service.GetByIdAsync(created.Id);
        fetched.Should().BeNull();
    }

    [Fact]
    public async Task DeleteAsync_Admin_DeletesSuccessfully()
    {
        // Arrange
        using var context = TestDbContextFactory.Create(nameof(DeleteAsync_Admin_DeletesSuccessfully));
        var category = await context.Set<Category>().FirstAsync();
        var service = new EquipmentService(context);

        var created = await service.CreateAsync(new CreateEquipmentDto
        {
            Title = "Honda Generator",
            CategoryId = category.Id,
            DailyRate = 5000m,
            ReplacementValue = 180000m,
            Location = "Kandy"
        }, _testOwnerId);

        // Act - Different user ID but isAdmin = true
        var result = await service.DeleteAsync(created.Id, Guid.NewGuid(), isAdmin: true);

        // Assert
        result.Should().BeTrue();
        var dbEntity = await context.Set<Equipment>().FindAsync(created.Id);
        dbEntity!.IsDeleted.Should().BeTrue();
    }

    [Fact]
    public async Task DeleteAsync_NonOwnerNonAdmin_ThrowsUnauthorizedAccessException()
    {
        // Arrange
        using var context = TestDbContextFactory.Create(nameof(DeleteAsync_NonOwnerNonAdmin_ThrowsUnauthorizedAccessException));
        var category = await context.Set<Category>().FirstAsync();
        var service = new EquipmentService(context);

        var created = await service.CreateAsync(new CreateEquipmentDto
        {
            Title = "Plate Compactor",
            CategoryId = category.Id,
            DailyRate = 3500m,
            ReplacementValue = 90000m,
            Location = "Colombo"
        }, _testOwnerId);

        // Act
        var act = () => service.DeleteAsync(created.Id, Guid.NewGuid(), isAdmin: false);

        // Assert
        await act.Should().ThrowAsync<UnauthorizedAccessException>()
            .WithMessage("*not authorized to delete*");
    }

    [Fact]
    public async Task DeleteAsync_WhenRented_ThrowsInvalidOperationException()
    {
        // Arrange
        using var context = TestDbContextFactory.Create(nameof(DeleteAsync_WhenRented_ThrowsInvalidOperationException));
        var category = await context.Set<Category>().FirstAsync();
        var service = new EquipmentService(context);

        var created = await service.CreateAsync(new CreateEquipmentDto
        {
            Title = "Scaffolding Tower",
            CategoryId = category.Id,
            DailyRate = 4000m,
            ReplacementValue = 120000m,
            Location = "Negombo"
        }, _testOwnerId);

        var entity = await context.Set<Equipment>().FindAsync(created.Id);
        entity!.ChangeStatus(EquipmentStatus.Rented);
        await context.SaveChangesAsync();

        // Act
        var act = () => service.DeleteAsync(created.Id, _testOwnerId);

        // Assert
        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*currently rented*");
    }

    [Fact]
    public async Task DeleteAsync_WhenDisputed_ThrowsInvalidOperationException()
    {
        // Arrange
        using var context = TestDbContextFactory.Create(nameof(DeleteAsync_WhenDisputed_ThrowsInvalidOperationException));
        var category = await context.Set<Category>().FirstAsync();
        var service = new EquipmentService(context);

        var created = await service.CreateAsync(new CreateEquipmentDto
        {
            Title = "Laser Level",
            CategoryId = category.Id,
            DailyRate = 1500m,
            ReplacementValue = 45000m,
            Location = "Galle"
        }, _testOwnerId);

        var entity = await context.Set<Equipment>().FindAsync(created.Id);
        entity!.ChangeStatus(EquipmentStatus.Disputed);
        await context.SaveChangesAsync();

        // Act
        var act = () => service.DeleteAsync(created.Id, _testOwnerId);

        // Assert
        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*active dispute*");
    }

    [Fact]
    public async Task DeleteAsync_NonExistentEquipment_ThrowsKeyNotFoundException()
    {
        // Arrange
        using var context = TestDbContextFactory.Create(nameof(DeleteAsync_NonExistentEquipment_ThrowsKeyNotFoundException));
        var service = new EquipmentService(context);

        // Act
        var act = () => service.DeleteAsync(Guid.NewGuid(), _testOwnerId);

        // Assert
        await act.Should().ThrowAsync<KeyNotFoundException>();
    }
}
