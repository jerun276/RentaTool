using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using RentaTool.Modules.Booking.Application.DTOs;
using RentaTool.Modules.Booking.Application.Services;
using RentaTool.Modules.Booking.Domain;
using RentaTool.Shared.Kernel.Domain;

namespace RentaTool.Modules.Booking.Tests;

public class BookingServiceTests
{
    private readonly Guid _equipmentId = Guid.NewGuid();
    private readonly Guid _renterId = Guid.NewGuid();
    private readonly Guid _ownerId = Guid.NewGuid();

    [Fact]
    public async Task CreateBooking_ValidInputAndNoConflict_CreatesBookingAndSchedule()
    {
        // Arrange
        using var context = TestDbContextFactory.Create(nameof(CreateBooking_ValidInputAndNoConflict_CreatesBookingAndSchedule));
        var bookingService = new BookingService(context);

        var dto = new CreateBookingRequestDto
        {
            EquipmentId = _equipmentId,
            OwnerId = _ownerId,
            StartDate = DateTime.UtcNow.Date.AddDays(1),
            EndDate = DateTime.UtcNow.Date.AddDays(3),
            DailyRate = 2500m
        };

        // Act
        var result = await bookingService.CreateBookingAsync(dto, _renterId);

        // Assert
        result.Should().NotBeNull();
        result.EquipmentId.Should().Be(_equipmentId);
        result.RenterId.Should().Be(_renterId);
        result.OwnerId.Should().Be(_ownerId);
        result.DailyRate.Should().Be(2500m);
        result.TotalRentalFee.Should().Be(7500m); // 3 days * 2500
        result.Status.Should().Be(BookingStatus.Confirmed.ToString());

        var savedSchedule = await context.Set<BookingSchedule>().FirstOrDefaultAsync(s => s.BookingId == result.Id);
        savedSchedule.Should().NotBeNull();
        savedSchedule!.EquipmentId.Should().Be(_equipmentId);
    }

    [Fact]
    public async Task CreateBooking_ConflictingDates_ThrowsInvalidOperationException()
    {
        // Arrange
        using var context = TestDbContextFactory.Create(nameof(CreateBooking_ConflictingDates_ThrowsInvalidOperationException));
        var bookingService = new BookingService(context);

        var firstBooking = new CreateBookingRequestDto
        {
            EquipmentId = _equipmentId,
            OwnerId = _ownerId,
            StartDate = DateTime.UtcNow.Date.AddDays(5),
            EndDate = DateTime.UtcNow.Date.AddDays(8),
            DailyRate = 1500m
        };
        await bookingService.CreateBookingAsync(firstBooking, _renterId);

        var overlappingBooking = new CreateBookingRequestDto
        {
            EquipmentId = _equipmentId,
            OwnerId = _ownerId,
            StartDate = DateTime.UtcNow.Date.AddDays(7), // Overlaps with day 7-8
            EndDate = DateTime.UtcNow.Date.AddDays(10),
            DailyRate = 1500m
        };

        // Act
        var act = async () => await bookingService.CreateBookingAsync(overlappingBooking, Guid.NewGuid());

        // Assert
        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*already reserved or unavailable*");
    }

    [Fact]
    public async Task CreateBooking_EndDateBeforeStartDate_ThrowsArgumentException()
    {
        // Arrange
        using var context = TestDbContextFactory.Create(nameof(CreateBooking_EndDateBeforeStartDate_ThrowsArgumentException));
        var bookingService = new BookingService(context);

        var invalidDto = new CreateBookingRequestDto
        {
            EquipmentId = _equipmentId,
            OwnerId = _ownerId,
            StartDate = DateTime.UtcNow.Date.AddDays(5),
            EndDate = DateTime.UtcNow.Date.AddDays(2), // Before start date
            DailyRate = 1000m
        };

        // Act
        var act = async () => await bookingService.CreateBookingAsync(invalidDto, _renterId);

        // Assert
        await act.Should().ThrowAsync<ArgumentException>()
            .WithMessage("*EndDate cannot be earlier than StartDate*");
    }

    [Fact]
    public async Task CreateBooking_RenterSameAsOwner_ThrowsArgumentException()
    {
        // Arrange
        using var context = TestDbContextFactory.Create(nameof(CreateBooking_RenterSameAsOwner_ThrowsArgumentException));
        var bookingService = new BookingService(context);

        var sameUserDto = new CreateBookingRequestDto
        {
            EquipmentId = _equipmentId,
            OwnerId = _ownerId,
            StartDate = DateTime.UtcNow.Date.AddDays(1),
            EndDate = DateTime.UtcNow.Date.AddDays(2),
            DailyRate = 1000m
        };

        // Act
        var act = async () => await bookingService.CreateBookingAsync(sameUserDto, _ownerId);

        // Assert
        await act.Should().ThrowAsync<ArgumentException>()
            .WithMessage("*cannot rent their own equipment*");
    }

    [Fact]
    public async Task GetActiveBookings_ReturnsOnlyActiveOrConfirmedForUser()
    {
        // Arrange
        using var context = TestDbContextFactory.Create(nameof(GetActiveBookings_ReturnsOnlyActiveOrConfirmedForUser));
        var bookingService = new BookingService(context);

        // Booking 1 for user as renter
        await bookingService.CreateBookingAsync(new CreateBookingRequestDto
        {
            EquipmentId = Guid.NewGuid(),
            OwnerId = _ownerId,
            StartDate = DateTime.UtcNow.Date.AddDays(1),
            EndDate = DateTime.UtcNow.Date.AddDays(2),
            DailyRate = 2000m
        }, _renterId);

        // Booking 2 for someone else
        await bookingService.CreateBookingAsync(new CreateBookingRequestDto
        {
            EquipmentId = Guid.NewGuid(),
            OwnerId = _ownerId,
            StartDate = DateTime.UtcNow.Date.AddDays(1),
            EndDate = DateTime.UtcNow.Date.AddDays(2),
            DailyRate = 2000m
        }, Guid.NewGuid());

        // Act
        var renterBookings = await bookingService.GetActiveBookingsAsync(_renterId);

        // Assert
        renterBookings.Should().HaveCount(1);
        renterBookings.First().RenterId.Should().Be(_renterId);
    }

    [Fact]
    public async Task GetById_ExistingId_ReturnsBookingDto()
    {
        // Arrange
        using var context = TestDbContextFactory.Create(nameof(GetById_ExistingId_ReturnsBookingDto));
        var bookingService = new BookingService(context);

        var created = await bookingService.CreateBookingAsync(new CreateBookingRequestDto
        {
            EquipmentId = _equipmentId,
            OwnerId = _ownerId,
            StartDate = DateTime.UtcNow.Date.AddDays(1),
            EndDate = DateTime.UtcNow.Date.AddDays(2),
            DailyRate = 3000m
        }, _renterId);

        // Act
        var result = await bookingService.GetByIdAsync(created.Id);

        // Assert
        result.Should().NotBeNull();
        result!.Id.Should().Be(created.Id);
        result.TotalRentalFee.Should().Be(6000m);
    }

    [Fact]
    public async Task GetById_NonExistingId_ReturnsNull()
    {
        // Arrange
        using var context = TestDbContextFactory.Create(nameof(GetById_NonExistingId_ReturnsNull));
        var bookingService = new BookingService(context);

        // Act
        var result = await bookingService.GetByIdAsync(Guid.NewGuid());

        // Assert
        result.Should().BeNull();
    }
}
