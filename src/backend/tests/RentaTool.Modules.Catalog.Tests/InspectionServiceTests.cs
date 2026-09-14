using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using RentaTool.Modules.Catalog.Application.DTOs;
using RentaTool.Modules.Catalog.Application.Services;
using RentaTool.Modules.Catalog.Domain;
using RentaTool.Shared.Kernel.Domain;

namespace RentaTool.Modules.Catalog.Tests;

public class InspectionServiceTests
{
    private readonly Guid _testOwnerId = Guid.NewGuid();
    private readonly Guid _testInspectorId = Guid.NewGuid();

    [Fact]
    public async Task CreateInspectionLogAsync_ValidInput_PersistsLogSuccessfully()
    {
        // Arrange
        using var context = TestDbContextFactory.Create(nameof(CreateInspectionLogAsync_ValidInput_PersistsLogSuccessfully));
        var category = await context.Set<Category>().FirstAsync();
        var eqService = new EquipmentService(context);
        var inspectionService = new InspectionService(context);

        var equipment = await eqService.CreateAsync(new CreateEquipmentDto
        {
            Title = "Karcher High Pressure Washer",
            CategoryId = category.Id,
            DailyRate = 3500m,
            ReplacementValue = 65000m,
            Location = "Colombo"
        }, _testOwnerId);

        var logDto = new CreateInspectionLogDto
        {
            BookingId = Guid.NewGuid(),
            Type = InspectionType.PreRental,
            Severity = InspectionSeverity.None,
            ConditionNotes = "Pre-rental handover: motor casing clean, power cord intact, pressure hose undamaged.",
            Photos = new List<InspectionPhotoDto>
            {
                new() { Angle = "Casing", PhotoUrl = "https://example.com/casing.jpg" },
                new() { Angle = "Cord", PhotoUrl = "https://example.com/cord.jpg" },
                new() { Angle = "Motor", PhotoUrl = "https://example.com/motor.jpg" }
            }
        };

        // Act
        var result = await inspectionService.CreateInspectionLogAsync(equipment.Id, logDto, _testInspectorId);

        // Assert
        result.Should().NotBeNull();
        result.Id.Should().NotBeEmpty();
        result.EquipmentId.Should().Be(equipment.Id);
        result.Severity.Should().Be(InspectionSeverity.None.ToString());
        result.PhotosJson.Should().Contain("https://example.com/casing.jpg");
    }

    [Fact]
    public async Task CreateInspectionLogAsync_StructuralDamage_AutoFlagsEquipmentForMaintenance()
    {
        // Arrange
        using var context = TestDbContextFactory.Create(nameof(CreateInspectionLogAsync_StructuralDamage_AutoFlagsEquipmentForMaintenance));
        var category = await context.Set<Category>().FirstAsync();
        var eqService = new EquipmentService(context);
        var inspectionService = new InspectionService(context);

        var equipment = await eqService.CreateAsync(new CreateEquipmentDto
        {
            Title = "DeWalt Demolition Hammer",
            CategoryId = category.Id,
            DailyRate = 4500m,
            ReplacementValue = 85000m,
            Location = "Negombo"
        }, _testOwnerId);

        var returnLogDto = new CreateInspectionLogDto
        {
            Type = InspectionType.PostRental,
            Severity = InspectionSeverity.StructuralDamage,
            ConditionNotes = "Post-rental return: Cracked motor housing and exposed wiring.",
            Photos = new List<InspectionPhotoDto>
            {
                new() { Angle = "Motor", PhotoUrl = "https://example.com/cracked_motor.jpg" }
            }
        };

        // Act
        await inspectionService.CreateInspectionLogAsync(equipment.Id, returnLogDto, _testInspectorId);

        // Assert - Equipment should be auto-flagged and set to UnderMaintenance
        var updated = await context.Set<Equipment>().FindAsync(equipment.Id);
        updated.Should().NotBeNull();
        updated!.Status.Should().Be(EquipmentStatus.UnderMaintenance);
        updated.RequiresMaintenanceCheck.Should().BeTrue();
    }

    [Fact]
    public async Task GetEquipmentHistoryAsync_ReturnsChronologicalTimeline_MostRecentFirst()
    {
        // Arrange
        using var context = TestDbContextFactory.Create(nameof(GetEquipmentHistoryAsync_ReturnsChronologicalTimeline_MostRecentFirst));
        var category = await context.Set<Category>().FirstAsync();
        var eqService = new EquipmentService(context);
        var inspectionService = new InspectionService(context);

        var equipment = await eqService.CreateAsync(new CreateEquipmentDto
        {
            Title = "Honda Concrete Vibrator",
            CategoryId = category.Id,
            DailyRate = 2800m,
            ReplacementValue = 42000m,
            Location = "Colombo"
        }, _testOwnerId);

        await inspectionService.CreateInspectionLogAsync(equipment.Id, new CreateInspectionLogDto
        {
            Type = InspectionType.PreRental,
            ConditionNotes = "Pre-rental baseline"
        }, _testInspectorId);

        await Task.Delay(10); // Ensure timestamp delta

        await inspectionService.CreateInspectionLogAsync(equipment.Id, new CreateInspectionLogDto
        {
            Type = InspectionType.PostRental,
            ConditionNotes = "Post-rental check"
        }, _testInspectorId);

        // Act
        var history = await inspectionService.GetEquipmentHistoryAsync(equipment.Id);

        // Assert
        history.Should().NotBeNull();
        history!.InspectionTimeline.Should().HaveCount(2);
        history.InspectionTimeline[0].Type.Should().Be(InspectionType.PostRental.ToString());
        history.InspectionTimeline[1].Type.Should().Be(InspectionType.PreRental.ToString());
    }
}
