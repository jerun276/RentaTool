using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Moq;
using RentaTool.Modules.Catalog.Application.DTOs;
using RentaTool.Modules.Catalog.Application.Services;
using RentaTool.Modules.Catalog.Controllers;
using RentaTool.Modules.Catalog.Domain;

namespace RentaTool.Modules.Catalog.Tests;

public class EquipmentControllerTests
{
    private readonly Mock<IEquipmentService> _mockEquipmentService = new();
    private readonly Mock<IInspectionService> _mockInspectionService = new();
    private readonly Mock<IBatchAvailabilityService> _mockBatchService = new();
    private readonly EquipmentController _controller;

    public EquipmentControllerTests()
    {
        _controller = new EquipmentController(
            _mockEquipmentService.Object,
            _mockInspectionService.Object,
            _mockBatchService.Object
        );
        _controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext()
        };
    }

    [Fact]
    public async Task CreateEquipment_ValidDto_Returns201Created()
    {
        // Arrange
        var dto = new CreateEquipmentDto
        {
            Title = "Rotary Hammer",
            CategoryId = Guid.NewGuid(),
            DailyRate = 2500m,
            ReplacementValue = 40000m,
            Location = "Colombo"
        };

        var expected = new EquipmentResponseDto
        {
            Id = Guid.NewGuid(),
            Title = dto.Title,
            DailyRate = dto.DailyRate,
            Location = dto.Location
        };

        _mockEquipmentService
            .Setup(s => s.CreateAsync(dto, It.IsAny<Guid>()))
            .ReturnsAsync(expected);

        // Act
        var result = await _controller.CreateEquipment(dto);

        // Assert
        var createdResult = result.Should().BeOfType<CreatedAtActionResult>().Subject;
        createdResult.StatusCode.Should().Be(StatusCodes.Status201Created);
        createdResult.Value.Should().BeEquivalentTo(expected);
    }

    [Fact]
    public async Task GetEquipmentById_ExistingId_Returns200Ok()
    {
        // Arrange
        var id = Guid.NewGuid();
        var expected = new EquipmentResponseDto
        {
            Id = id,
            Title = "High Pressure Washer",
            DailyRate = 3000m
        };

        _mockEquipmentService.Setup(s => s.GetByIdAsync(id)).ReturnsAsync(expected);

        // Act
        var result = await _controller.GetEquipmentById(id);

        // Assert
        var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
        okResult.StatusCode.Should().Be(StatusCodes.Status200OK);
        okResult.Value.Should().BeEquivalentTo(expected);
    }

    [Fact]
    public async Task GetEquipmentById_NonExistentId_Returns404NotFound()
    {
        // Arrange
        var id = Guid.NewGuid();
        _mockEquipmentService.Setup(s => s.GetByIdAsync(id)).ReturnsAsync((EquipmentResponseDto?)null);

        // Act
        var result = await _controller.GetEquipmentById(id);

        // Assert
        result.Should().BeOfType<NotFoundObjectResult>();
    }

    [Fact]
    public async Task GetEquipmentList_ValidFilter_Returns200OkWithPagedResult()
    {
        // Arrange
        var filter = new EquipmentFilterDto { Page = 1, PageSize = 10 };
        var paged = new PagedResult<EquipmentResponseDto>
        {
            Items = new List<EquipmentResponseDto>
            {
                new() { Id = Guid.NewGuid(), Title = "Tool 1" }
            },
            TotalCount = 1,
            Page = 1,
            PageSize = 10
        };

        _mockEquipmentService.Setup(s => s.GetPagedListAsync(filter)).ReturnsAsync(paged);

        // Act
        var result = await _controller.GetEquipmentList(filter);

        // Assert
        var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
        okResult.Value.Should().BeEquivalentTo(paged);
    }

    [Fact]
    public async Task CreateInspectionLog_ValidDto_Returns201Created()
    {
        // Arrange
        var eqId = Guid.NewGuid();
        var dto = new CreateInspectionLogDto
        {
            Type = InspectionType.PreRental,
            ConditionNotes = "All clean"
        };
        var expected = new InspectionLogResponseDto
        {
            Id = Guid.NewGuid(),
            EquipmentId = eqId,
            Type = "PreRental",
            ConditionNotes = "All clean"
        };

        _mockInspectionService
            .Setup(s => s.CreateInspectionLogAsync(eqId, dto, It.IsAny<Guid>()))
            .ReturnsAsync(expected);

        // Act
        var result = await _controller.CreateInspectionLog(eqId, dto);

        // Assert
        var createdResult = result.Should().BeOfType<CreatedAtActionResult>().Subject;
        createdResult.StatusCode.Should().Be(StatusCodes.Status201Created);
    }

    [Fact]
    public async Task CheckBatchAvailability_ValidRequest_Returns200OkWithReport()
    {
        // Arrange
        var request = new BatchAvailabilityRequestDto
        {
            EquipmentIds = new List<Guid> { Guid.NewGuid() },
            DesiredStartDate = DateTime.UtcNow.AddDays(1),
            DesiredEndDate = DateTime.UtcNow.AddDays(2)
        };

        var response = new BatchAvailabilityResponseDto
        {
            TotalRequested = 1,
            TotalAvailable = 1,
            TotalLockedOut = 0,
            AvailableItems = new List<EquipmentAvailabilityItemDto>
            {
                new() { EquipmentId = request.EquipmentIds[0], Title = "Safe Tool", DailyRate = 1500m }
            }
        };

        _mockBatchService
            .Setup(s => s.CheckBatchAvailabilityAsync(request))
            .ReturnsAsync(response);

        // Act
        var result = await _controller.CheckBatchAvailability(request);

        // Assert
        var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
        okResult.StatusCode.Should().Be(StatusCodes.Status200OK);
        okResult.Value.Should().BeEquivalentTo(response);
    }
}
