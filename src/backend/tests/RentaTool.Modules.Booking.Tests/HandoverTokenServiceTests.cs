using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using RentaTool.Modules.Booking.Application.DTOs;
using RentaTool.Modules.Booking.Application.Services;
using RentaTool.Modules.Booking.Domain;
using RentaTool.Shared.Kernel.Domain;

namespace RentaTool.Modules.Booking.Tests;

public class HandoverTokenServiceTests
{
    private readonly Guid _equipmentId = Guid.NewGuid();
    private readonly Guid _renterId = Guid.NewGuid();
    private readonly Guid _ownerId = Guid.NewGuid();

    [Fact]
    public async Task GenerateToken_PickupByRenter_GeneratesValidTokenAndPersistsHash()
    {
        // Arrange
        using var context = TestDbContextFactory.Create(nameof(GenerateToken_PickupByRenter_GeneratesValidTokenAndPersistsHash));
        var bookingService = new BookingService(context);
        var tokenService = new HandoverTokenService(context);

        var booking = await bookingService.CreateBookingAsync(new CreateBookingRequestDto
        {
            EquipmentId = _equipmentId,
            OwnerId = _ownerId,
            StartDate = DateTime.UtcNow.Date.AddDays(1),
            EndDate = DateTime.UtcNow.Date.AddDays(2),
            DailyRate = 2000m
        }, _renterId);

        // Act
        var tokenResult = await tokenService.GenerateTokenAsync(booking.Id, HandoverEventType.Pickup, _renterId);

        // Assert
        tokenResult.Should().NotBeNull();
        tokenResult.BookingId.Should().Be(booking.Id);
        tokenResult.Token.Should().StartWith("RT-");
        tokenResult.EventType.Should().Be("Pickup");
        tokenResult.ExpiresAtUtc.Should().BeAfter(DateTime.UtcNow);

        var savedEvent = await context.Set<HandoverEvent>().FirstOrDefaultAsync(h => h.BookingId == booking.Id);
        savedEvent.Should().NotBeNull();
        savedEvent!.IsConfirmed.Should().BeFalse();
        savedEvent.HandoverTokenHash.Should().NotBeNullOrWhiteSpace();
    }

    [Fact]
    public async Task GenerateToken_UnauthorizedUser_ThrowsUnauthorizedAccessException()
    {
        // Arrange
        using var context = TestDbContextFactory.Create(nameof(GenerateToken_UnauthorizedUser_ThrowsUnauthorizedAccessException));
        var bookingService = new BookingService(context);
        var tokenService = new HandoverTokenService(context);

        var booking = await bookingService.CreateBookingAsync(new CreateBookingRequestDto
        {
            EquipmentId = _equipmentId,
            OwnerId = _ownerId,
            StartDate = DateTime.UtcNow.Date.AddDays(1),
            EndDate = DateTime.UtcNow.Date.AddDays(2),
            DailyRate = 2000m
        }, _renterId);

        var randomUser = Guid.NewGuid();

        // Act
        var act = async () => await tokenService.GenerateTokenAsync(booking.Id, HandoverEventType.Pickup, randomUser);

        // Assert
        await act.Should().ThrowAsync<UnauthorizedAccessException>()
            .WithMessage("*Only the renter or equipment owner can generate handover tokens*");
    }

    [Fact]
    public async Task VerifyHandover_ValidPickupToken_TransitionsBookingToActiveAndConfirmsEvent()
    {
        // Arrange
        using var context = TestDbContextFactory.Create(nameof(VerifyHandover_ValidPickupToken_TransitionsBookingToActiveAndConfirmsEvent));
        var bookingService = new BookingService(context);
        var tokenService = new HandoverTokenService(context);

        var booking = await bookingService.CreateBookingAsync(new CreateBookingRequestDto
        {
            EquipmentId = _equipmentId,
            OwnerId = _ownerId,
            StartDate = DateTime.UtcNow.Date.AddDays(1),
            EndDate = DateTime.UtcNow.Date.AddDays(2),
            DailyRate = 2000m
        }, _renterId);

        var tokenResult = await tokenService.GenerateTokenAsync(booking.Id, HandoverEventType.Pickup, _ownerId);

        var verifyDto = new VerifyHandoverRequestDto
        {
            Token = tokenResult.Token,
            EventType = HandoverEventType.Pickup,
            Latitude = 6.9271,
            Longitude = 79.8612,
            AddressLine = "Galle Road",
            City = "Colombo",
            PostalCode = "00300"
        };

        // Act
        var verifyResult = await tokenService.VerifyHandoverAsync(booking.Id, verifyDto, _renterId);

        // Assert
        verifyResult.Should().NotBeNull();
        verifyResult.IsSuccess.Should().BeTrue();
        verifyResult.NewBookingStatus.Should().Be(BookingStatus.Active.ToString());

        var updatedBooking = await context.Set<Domain.Booking>().FindAsync(booking.Id);
        updatedBooking!.Status.Should().Be(BookingStatus.Active);

        var handoverEvent = await context.Set<HandoverEvent>().FirstAsync(h => h.BookingId == booking.Id);
        handoverEvent.IsConfirmed.Should().BeTrue();
        handoverEvent.ScannerUserId.Should().Be(_renterId);
        handoverEvent.GeoLocationId.Should().NotBeNull();
    }

    [Fact]
    public async Task VerifyHandover_ValidReturnToken_TransitionsBookingToCompleted()
    {
        // Arrange
        using var context = TestDbContextFactory.Create(nameof(VerifyHandover_ValidReturnToken_TransitionsBookingToCompleted));
        var bookingService = new BookingService(context);
        var tokenService = new HandoverTokenService(context);

        var booking = await bookingService.CreateBookingAsync(new CreateBookingRequestDto
        {
            EquipmentId = _equipmentId,
            OwnerId = _ownerId,
            StartDate = DateTime.UtcNow.Date.AddDays(1),
            EndDate = DateTime.UtcNow.Date.AddDays(2),
            DailyRate = 2000m
        }, _renterId);

        // 1. Pickup
        var pickupToken = await tokenService.GenerateTokenAsync(booking.Id, HandoverEventType.Pickup, _ownerId);
        await tokenService.VerifyHandoverAsync(booking.Id, new VerifyHandoverRequestDto
        {
            Token = pickupToken.Token,
            EventType = HandoverEventType.Pickup
        }, _renterId);

        // 2. Return
        var returnToken = await tokenService.GenerateTokenAsync(booking.Id, HandoverEventType.Return, _renterId);

        // Act
        var returnVerifyResult = await tokenService.VerifyHandoverAsync(booking.Id, new VerifyHandoverRequestDto
        {
            Token = returnToken.Token,
            EventType = HandoverEventType.Return,
            Latitude = 6.9271,
            Longitude = 79.8612,
            City = "Colombo"
        }, _ownerId);

        // Assert
        returnVerifyResult.Should().NotBeNull();
        returnVerifyResult.NewBookingStatus.Should().Be(BookingStatus.Completed.ToString());

        var updatedBooking = await context.Set<Domain.Booking>().FindAsync(booking.Id);
        updatedBooking!.Status.Should().Be(BookingStatus.Completed);
    }

    [Fact]
    public async Task VerifyHandover_InvalidToken_ThrowsInvalidOperationException()
    {
        // Arrange
        using var context = TestDbContextFactory.Create(nameof(VerifyHandover_InvalidToken_ThrowsInvalidOperationException));
        var bookingService = new BookingService(context);
        var tokenService = new HandoverTokenService(context);

        var booking = await bookingService.CreateBookingAsync(new CreateBookingRequestDto
        {
            EquipmentId = _equipmentId,
            OwnerId = _ownerId,
            StartDate = DateTime.UtcNow.Date.AddDays(1),
            EndDate = DateTime.UtcNow.Date.AddDays(2),
            DailyRate = 2000m
        }, _renterId);

        await tokenService.GenerateTokenAsync(booking.Id, HandoverEventType.Pickup, _ownerId);

        var wrongTokenDto = new VerifyHandoverRequestDto
        {
            Token = "RT-FAKE-TOKEN-9999",
            EventType = HandoverEventType.Pickup
        };

        // Act
        var act = async () => await tokenService.VerifyHandoverAsync(booking.Id, wrongTokenDto, _renterId);

        // Assert
        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*Invalid or unrecognized handover token*");
    }

    [Fact]
    public async Task VerifyHandover_AlreadyConfirmedToken_ThrowsInvalidOperationException()
    {
        // Arrange
        using var context = TestDbContextFactory.Create(nameof(VerifyHandover_AlreadyConfirmedToken_ThrowsInvalidOperationException));
        var bookingService = new BookingService(context);
        var tokenService = new HandoverTokenService(context);

        var booking = await bookingService.CreateBookingAsync(new CreateBookingRequestDto
        {
            EquipmentId = _equipmentId,
            OwnerId = _ownerId,
            StartDate = DateTime.UtcNow.Date.AddDays(1),
            EndDate = DateTime.UtcNow.Date.AddDays(2),
            DailyRate = 2000m
        }, _renterId);

        var pickupToken = await tokenService.GenerateTokenAsync(booking.Id, HandoverEventType.Pickup, _ownerId);
        var verifyDto = new VerifyHandoverRequestDto
        {
            Token = pickupToken.Token,
            EventType = HandoverEventType.Pickup
        };

        // First verification succeeds
        await tokenService.VerifyHandoverAsync(booking.Id, verifyDto, _renterId);

        // Second verification with the same single-use token must fail
        var act = async () => await tokenService.VerifyHandoverAsync(booking.Id, verifyDto, _renterId);

        // Assert
        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*already been confirmed and consumed*");
    }
}
