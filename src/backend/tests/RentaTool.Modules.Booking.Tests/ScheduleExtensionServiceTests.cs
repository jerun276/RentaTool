using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using RentaTool.Modules.Booking.Application.DTOs;
using RentaTool.Modules.Booking.Application.Services;
using RentaTool.Modules.Booking.Domain;

namespace RentaTool.Modules.Booking.Tests;

public class ScheduleExtensionServiceTests
{
    private readonly Guid _equipmentId = Guid.NewGuid();
    private readonly Guid _renterId = Guid.NewGuid();
    private readonly Guid _ownerId = Guid.NewGuid();

    [Fact]
    public async Task ExtendSchedule_ValidRequest_ExtendsScheduleAndAppliesSurgePricing()
    {
        // Arrange
        using var context = TestDbContextFactory.Create(nameof(ExtendSchedule_ValidRequest_ExtendsScheduleAndAppliesSurgePricing));
        var bookingService = new BookingService(context);
        var extensionService = new ScheduleExtensionService(context);

        var start = DateTime.UtcNow.Date.AddDays(1);
        var initialEnd = start.AddDays(2); // 3 days total

        var booking = await bookingService.CreateBookingAsync(new CreateBookingRequestDto
        {
            EquipmentId = _equipmentId,
            OwnerId = _ownerId,
            StartDate = start,
            EndDate = initialEnd,
            DailyRate = 2000m
        }, _renterId);

        var extensionDto = new ExtendScheduleRequestDto
        {
            NewEndDate = initialEnd.AddDays(2) // 2 days extension
        };

        // Act
        var result = await extensionService.ExtendScheduleAsync(booking.Id, extensionDto, _renterId);

        // Assert
        result.Should().NotBeNull();
        result.BookingId.Should().Be(booking.Id);
        result.ExtendedDays.Should().Be(2);
        result.BaseDailyRate.Should().Be(2000m);
        result.SurgeMultiplier.Should().BeGreaterThan(1.0m);
        result.AdditionalFee.Should().BeGreaterThan(4000m); // 2 days * 2000 with surge > 4000
        result.NewTotalRentalFee.Should().Be(6000m + result.AdditionalFee);

        var updatedSchedule = await context.Set<BookingSchedule>().FirstOrDefaultAsync(s => s.BookingId == booking.Id);
        updatedSchedule.Should().NotBeNull();
        updatedSchedule!.BlockedEndDate.Date.Should().Be(extensionDto.NewEndDate.Date);
    }

    [Fact]
    public async Task ExtendSchedule_ConflictingReservation_ThrowsInvalidOperationException()
    {
        // Arrange
        using var context = TestDbContextFactory.Create(nameof(ExtendSchedule_ConflictingReservation_ThrowsInvalidOperationException));
        var bookingService = new BookingService(context);
        var extensionService = new ScheduleExtensionService(context);

        // Booking 1: Days 1 to 3
        var booking1 = await bookingService.CreateBookingAsync(new CreateBookingRequestDto
        {
            EquipmentId = _equipmentId,
            OwnerId = _ownerId,
            StartDate = DateTime.UtcNow.Date.AddDays(1),
            EndDate = DateTime.UtcNow.Date.AddDays(3),
            DailyRate = 1500m
        }, _renterId);

        // Booking 2 by another user: Days 5 to 7
        await bookingService.CreateBookingAsync(new CreateBookingRequestDto
        {
            EquipmentId = _equipmentId,
            OwnerId = _ownerId,
            StartDate = DateTime.UtcNow.Date.AddDays(5),
            EndDate = DateTime.UtcNow.Date.AddDays(7),
            DailyRate = 1500m
        }, Guid.NewGuid());

        // Attempt to extend Booking 1 into Day 6 (which overlaps Booking 2)
        var conflictingExtension = new ExtendScheduleRequestDto
        {
            NewEndDate = DateTime.UtcNow.Date.AddDays(6)
        };

        // Act
        var act = async () => await extensionService.ExtendScheduleAsync(booking1.Id, conflictingExtension, _renterId);

        // Assert
        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*conflicting reservation during the requested extension period*");
    }

    [Fact]
    public async Task ExtendSchedule_NewDateBeforeCurrentEndDate_ThrowsArgumentException()
    {
        // Arrange
        using var context = TestDbContextFactory.Create(nameof(ExtendSchedule_NewDateBeforeCurrentEndDate_ThrowsArgumentException));
        var bookingService = new BookingService(context);
        var extensionService = new ScheduleExtensionService(context);

        var booking = await bookingService.CreateBookingAsync(new CreateBookingRequestDto
        {
            EquipmentId = _equipmentId,
            OwnerId = _ownerId,
            StartDate = DateTime.UtcNow.Date.AddDays(2),
            EndDate = DateTime.UtcNow.Date.AddDays(5),
            DailyRate = 1000m
        }, _renterId);

        var invalidDto = new ExtendScheduleRequestDto
        {
            NewEndDate = DateTime.UtcNow.Date.AddDays(3) // Before current end date
        };

        // Act
        var act = async () => await extensionService.ExtendScheduleAsync(booking.Id, invalidDto, _renterId);

        // Assert
        await act.Should().ThrowAsync<ArgumentException>()
            .WithMessage("*must be strictly after the current end date*");
    }

    [Fact]
    public async Task ExtendSchedule_UnauthorizedUser_ThrowsUnauthorizedAccessException()
    {
        // Arrange
        using var context = TestDbContextFactory.Create(nameof(ExtendSchedule_UnauthorizedUser_ThrowsUnauthorizedAccessException));
        var bookingService = new BookingService(context);
        var extensionService = new ScheduleExtensionService(context);

        var booking = await bookingService.CreateBookingAsync(new CreateBookingRequestDto
        {
            EquipmentId = _equipmentId,
            OwnerId = _ownerId,
            StartDate = DateTime.UtcNow.Date.AddDays(1),
            EndDate = DateTime.UtcNow.Date.AddDays(3),
            DailyRate = 1000m
        }, _renterId);

        var extensionDto = new ExtendScheduleRequestDto
        {
            NewEndDate = DateTime.UtcNow.Date.AddDays(5)
        };

        // Act
        var act = async () => await extensionService.ExtendScheduleAsync(booking.Id, extensionDto, Guid.NewGuid());

        // Assert
        await act.Should().ThrowAsync<UnauthorizedAccessException>()
            .WithMessage("*Only the renter or owner is authorized*");
    }
}
