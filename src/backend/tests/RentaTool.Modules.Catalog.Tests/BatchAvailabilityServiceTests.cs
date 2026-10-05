using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using RentaTool.Modules.Catalog.Application.DTOs;
using RentaTool.Modules.Catalog.Application.Services;
using RentaTool.Modules.Catalog.Domain;
using RentaTool.Shared.Kernel.Domain;

namespace RentaTool.Modules.Catalog.Tests;

public class BatchAvailabilityServiceTests
{
    private readonly Guid _testOwnerId = Guid.NewGuid();

    [Fact]
    public async Task CheckBatchAvailability_AllToolsAvailable_ReturnsAllAvailable()
    {
        // Arrange
        using var context = TestDbContextFactory.Create(nameof(CheckBatchAvailability_AllToolsAvailable_ReturnsAllAvailable));
        var category = await context.Set<Category>().FirstAsync();
        var eqService = new EquipmentService(context);
        var batchService = new BatchAvailabilityService(context);

        var tool1 = await eqService.CreateAsync(new CreateEquipmentDto
        {
            Title = "Cordless Drill",
            CategoryId = category.Id,
            DailyRate = 1200m,
            ReplacementValue = 18000m,
            Location = "Colombo"
        }, _testOwnerId);

        var tool2 = await eqService.CreateAsync(new CreateEquipmentDto
        {
            Title = "Electric Sander",
            CategoryId = category.Id,
            DailyRate = 1400m,
            ReplacementValue = 20000m,
            Location = "Colombo"
        }, _testOwnerId);

        var request = new BatchAvailabilityRequestDto
        {
            EquipmentIds = new List<Guid> { tool1.Id, tool2.Id },
            DesiredStartDate = DateTime.UtcNow.AddDays(1),
            DesiredEndDate = DateTime.UtcNow.AddDays(3)
        };

        // Act
        var result = await batchService.CheckBatchAvailabilityAsync(request);

        // Assert
        result.TotalRequested.Should().Be(2);
        result.TotalAvailable.Should().Be(2);
        result.TotalLockedOut.Should().Be(0);
        result.AvailableItems.Should().HaveCount(2);
        result.LockedOutItems.Should().BeEmpty();
    }

    [Fact]
    public async Task CheckBatchAvailability_ToolUnderMaintenance_LocksOutWithReason()
    {
        // Arrange
        using var context = TestDbContextFactory.Create(nameof(CheckBatchAvailability_ToolUnderMaintenance_LocksOutWithReason));
        var category = await context.Set<Category>().FirstAsync();
        var eqService = new EquipmentService(context);
        var batchService = new BatchAvailabilityService(context);

        var tool = await eqService.CreateAsync(new CreateEquipmentDto
        {
            Title = "Concrete Mixer 200L",
            CategoryId = category.Id,
            DailyRate = 5000m,
            ReplacementValue = 120000m,
            Location = "Gampaha"
        }, _testOwnerId);

        // Manually flag for maintenance
        var dbTool = await context.Set<Equipment>().FindAsync(tool.Id);
        dbTool!.FlagForMaintenance();
        await context.SaveChangesAsync();

        var request = new BatchAvailabilityRequestDto
        {
            EquipmentIds = new List<Guid> { tool.Id },
            DesiredStartDate = DateTime.UtcNow.AddDays(1),
            DesiredEndDate = DateTime.UtcNow.AddDays(3)
        };

        // Act
        var result = await batchService.CheckBatchAvailabilityAsync(request);

        // Assert
        result.TotalRequested.Should().Be(1);
        result.TotalAvailable.Should().Be(0);
        result.TotalLockedOut.Should().Be(1);
        result.LockedOutItems[0].LockoutReason.Should().Contain("scheduled maintenance");
        result.LockedOutItems[0].ServicingMandatory.Should().BeTrue();
    }

    [Fact]
    public async Task CheckBatchAvailability_RentalDaysExceedThreshold_FlagsMandatoryServicing()
    {
        // Arrange
        using var context = TestDbContextFactory.Create(nameof(CheckBatchAvailability_RentalDaysExceedThreshold_FlagsMandatoryServicing));
        var category = await context.Set<Category>().FirstAsync();
        var eqService = new EquipmentService(context);
        var batchService = new BatchAvailabilityService(context);

        var tool = await eqService.CreateAsync(new CreateEquipmentDto
        {
            Title = "Industrial Jackhammer",
            CategoryId = category.Id,
            DailyRate = 6000m,
            ReplacementValue = 150000m,
            Location = "Colombo"
        }, _testOwnerId);

        // Simulate tool exceeding 60-day threshold
        var dbTool = await context.Set<Equipment>().FindAsync(tool.Id);
        dbTool!.RecordRentalDays(65);
        await context.SaveChangesAsync();

        var request = new BatchAvailabilityRequestDto
        {
            EquipmentIds = new List<Guid> { tool.Id },
            DesiredStartDate = DateTime.UtcNow.AddDays(1),
            DesiredEndDate = DateTime.UtcNow.AddDays(4)
        };

        // Act
        var result = await batchService.CheckBatchAvailabilityAsync(request);

        // Assert
        result.TotalAvailable.Should().Be(0);
        result.TotalLockedOut.Should().Be(1);
        result.LockedOutItems[0].LockoutReason.Should().Contain("Mandatory safety servicing threshold exceeded");
        result.LockedOutItems[0].AccumulatedRentalDays.Should().Be(65);
        result.LockedOutItems[0].ServicingMandatory.Should().BeTrue();
    }

    [Fact]
    public async Task CheckBatchAvailability_InvalidDateRange_ThrowsArgumentException()
    {
        // Arrange
        using var context = TestDbContextFactory.Create(nameof(CheckBatchAvailability_InvalidDateRange_ThrowsArgumentException));
        var batchService = new BatchAvailabilityService(context);

        var request = new BatchAvailabilityRequestDto
        {
            EquipmentIds = new List<Guid> { Guid.NewGuid() },
            DesiredStartDate = DateTime.UtcNow.AddDays(5),
            DesiredEndDate = DateTime.UtcNow.AddDays(2) // End before start
        };

        // Act
        var act = () => batchService.CheckBatchAvailabilityAsync(request);

        // Assert
        await act.Should().ThrowAsync<ArgumentException>()
            .WithMessage("*earlier than start date*");
    }
}
