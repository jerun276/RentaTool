using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Moq;
using RentaTool.Modules.Booking.Application.DTOs;
using RentaTool.Modules.Booking.Application.Services;
using RentaTool.Modules.Booking.Controllers;
using RentaTool.Modules.Booking.Domain;

namespace RentaTool.Modules.Booking.Tests;

public class BookingsControllerTests
{
    private readonly Mock<IBookingService> _mockBookingService = new();
    private readonly Mock<IHandoverTokenService> _mockTokenService = new();
    private readonly Mock<IScheduleExtensionService> _mockExtensionService = new();
    private readonly BookingsController _controller;

    public BookingsControllerTests()
    {
        _controller = new BookingsController(
            _mockBookingService.Object,
            _mockTokenService.Object,
            _mockExtensionService.Object
        );
        _controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext()
        };
    }

    [Fact]
    public async Task CreateBooking_ValidDto_Returns201Created()
    {
        // Arrange
        var dto = new CreateBookingRequestDto
        {
            EquipmentId = Guid.NewGuid(),
            OwnerId = Guid.NewGuid(),
            StartDate = DateTime.UtcNow.AddDays(1),
            EndDate = DateTime.UtcNow.AddDays(3),
            DailyRate = 2000m
        };

        var expectedResponse = new BookingResponseDto
        {
            Id = Guid.NewGuid(),
            EquipmentId = dto.EquipmentId,
            DailyRate = dto.DailyRate,
            TotalRentalFee = 6000m,
            Status = "Confirmed"
        };

        _mockBookingService
            .Setup(s => s.CreateBookingAsync(dto, It.IsAny<Guid>(), default))
            .ReturnsAsync(expectedResponse);

        // Act
        var result = await _controller.CreateBooking(dto);

        // Assert
        var createdResult = result.Should().BeOfType<CreatedAtActionResult>().Subject;
        createdResult.StatusCode.Should().Be(StatusCodes.Status201Created);
        createdResult.Value.Should().BeEquivalentTo(expectedResponse);
    }

    [Fact]
    public async Task CreateBooking_ScheduleConflict_Returns409Conflict()
    {
        // Arrange
        var dto = new CreateBookingRequestDto
        {
            EquipmentId = Guid.NewGuid(),
            OwnerId = Guid.NewGuid(),
            StartDate = DateTime.UtcNow.AddDays(1),
            EndDate = DateTime.UtcNow.AddDays(3),
            DailyRate = 2000m
        };

        _mockBookingService
            .Setup(s => s.CreateBookingAsync(dto, It.IsAny<Guid>(), default))
            .ThrowsAsync(new InvalidOperationException("Equipment is already reserved"));

        // Act
        var result = await _controller.CreateBooking(dto);

        // Assert
        var conflictResult = result.Should().BeOfType<ConflictObjectResult>().Subject;
        conflictResult.StatusCode.Should().Be(StatusCodes.Status409Conflict);
    }

    [Fact]
    public async Task GetActiveBookings_Returns200OkWithList()
    {
        // Arrange
        var expectedList = new List<ActiveBookingSummaryDto>
        {
            new() { Id = Guid.NewGuid(), TotalRentalFee = 5000m, Status = "Confirmed" }
        };

        _mockBookingService
            .Setup(s => s.GetActiveBookingsAsync(It.IsAny<Guid>(), default))
            .ReturnsAsync(expectedList);

        // Act
        var result = await _controller.GetActiveBookings();

        // Assert
        var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
        okResult.StatusCode.Should().Be(StatusCodes.Status200OK);
        okResult.Value.Should().BeEquivalentTo(expectedList);
    }

    [Fact]
    public async Task GenerateHandoverToken_ValidRequest_Returns200OkWithToken()
    {
        // Arrange
        var bookingId = Guid.NewGuid();
        var dto = new GenerateHandoverTokenRequestDto
        {
            EventType = HandoverEventType.Pickup
        };

        var expectedResponse = new HandoverTokenResponseDto
        {
            BookingId = bookingId,
            EventType = "Pickup",
            Token = "RT-1A2B-3C4D-5E6F",
            ExpiresAtUtc = DateTime.UtcNow.AddMinutes(15)
        };

        _mockTokenService
            .Setup(s => s.GenerateTokenAsync(bookingId, dto.EventType, It.IsAny<Guid>(), default))
            .ReturnsAsync(expectedResponse);

        // Act
        var result = await _controller.GenerateHandoverToken(bookingId, dto);

        // Assert
        var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
        okResult.StatusCode.Should().Be(StatusCodes.Status200OK);
        okResult.Value.Should().BeEquivalentTo(expectedResponse);
    }

    [Fact]
    public async Task VerifyHandover_ValidToken_Returns200OkWithSummary()
    {
        // Arrange
        var bookingId = Guid.NewGuid();
        var dto = new VerifyHandoverRequestDto
        {
            Token = "RT-1A2B-3C4D-5E6F",
            EventType = HandoverEventType.Pickup
        };

        var expectedResponse = new HandoverVerificationResponseDto
        {
            BookingId = bookingId,
            EventType = "Pickup",
            NewBookingStatus = "Active",
            IsSuccess = true
        };

        _mockTokenService
            .Setup(s => s.VerifyHandoverAsync(bookingId, dto, It.IsAny<Guid>(), default))
            .ReturnsAsync(expectedResponse);

        // Act
        var result = await _controller.VerifyHandover(bookingId, dto);

        // Assert
        var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
        okResult.StatusCode.Should().Be(StatusCodes.Status200OK);
        okResult.Value.Should().BeEquivalentTo(expectedResponse);
    }

    [Fact]
    public async Task ExtendSchedule_ValidRequest_Returns200OkWithSurgeBreakdown()
    {
        // Arrange
        var bookingId = Guid.NewGuid();
        var dto = new ExtendScheduleRequestDto
        {
            NewEndDate = DateTime.UtcNow.AddDays(5)
        };

        var expectedResponse = new ExtendScheduleResponseDto
        {
            BookingId = bookingId,
            ExtendedDays = 2,
            BaseDailyRate = 2000m,
            SurgeMultiplier = 1.25m,
            SurgeDailyRate = 2500m,
            AdditionalFee = 5000m,
            NewTotalRentalFee = 11000m,
            Reason = "High Weekend Demand (+25%)"
        };

        _mockExtensionService
            .Setup(s => s.ExtendScheduleAsync(bookingId, dto, It.IsAny<Guid>(), default))
            .ReturnsAsync(expectedResponse);

        // Act
        var result = await _controller.ExtendSchedule(bookingId, dto);

        // Assert
        var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
        okResult.StatusCode.Should().Be(StatusCodes.Status200OK);
        okResult.Value.Should().BeEquivalentTo(expectedResponse);
    }

    [Fact]
    public async Task ExtendSchedule_Conflict_Returns409Conflict()
    {
        // Arrange
        var bookingId = Guid.NewGuid();
        var dto = new ExtendScheduleRequestDto
        {
            NewEndDate = DateTime.UtcNow.AddDays(5)
        };

        _mockExtensionService
            .Setup(s => s.ExtendScheduleAsync(bookingId, dto, It.IsAny<Guid>(), default))
            .ThrowsAsync(new InvalidOperationException("conflicting reservation"));

        // Act
        var result = await _controller.ExtendSchedule(bookingId, dto);

        // Assert
        var conflictResult = result.Should().BeOfType<ConflictObjectResult>().Subject;
        conflictResult.StatusCode.Should().Be(StatusCodes.Status409Conflict);
    }
}
