using System.Security.Claims;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Moq;
using RentaTool.Modules.Escrow.Application.DTOs;
using RentaTool.Modules.Escrow.Application.Services;
using RentaTool.Modules.Escrow.Controllers;

namespace RentaTool.Modules.Escrow.Tests;

public class ClaimsControllerTests
{
    private readonly Mock<IClaimService> _mockClaimService = new();
    private readonly ClaimsController _controller;
    private readonly Guid _testUserId = Guid.NewGuid();

    public ClaimsControllerTests()
    {
        _controller = new ClaimsController(_mockClaimService.Object);

        var httpContext = new DefaultHttpContext();
        var identity = new ClaimsIdentity(new[]
        {
            new Claim(ClaimTypes.NameIdentifier, _testUserId.ToString()),
            new Claim(ClaimTypes.Email, "jathu3461@gmail.com")
        }, "TestAuth");
        httpContext.User = new ClaimsPrincipal(identity);

        _controller.ControllerContext = new ControllerContext
        {
            HttpContext = httpContext
        };
    }

    [Fact]
    public async Task FileClaim_ValidRequest_Returns201Created()
    {
        // Arrange
        var request = new FileClaimRequest(
            Guid.NewGuid(),
            _testUserId,
            "Engine smoke damage",
            new List<string> { "smoke.jpg" }
        );

        var responseDto = new DamageClaimResponse(
            Guid.NewGuid(),
            request.BookingId,
            _testUserId,
            request.DamageDescription,
            request.EvidencePhotos!,
            0m,
            null,
            "Filed",
            null,
            null,
            null,
            DateTime.UtcNow
        );

        _mockClaimService
            .Setup(s => s.FileClaimAsync(request, It.IsAny<CancellationToken>()))
            .ReturnsAsync(responseDto);

        // Act
        var result = await _controller.FileClaim(request, CancellationToken.None);

        // Assert
        var createdResult = result as CreatedAtActionResult;
        createdResult.Should().NotBeNull();
        createdResult!.StatusCode.Should().Be(201);
        createdResult.Value.Should().BeEquivalentTo(responseDto);
    }

    [Fact]
    public async Task AdjudicateClaim_ValidDecision_Returns200Ok()
    {
        // Arrange
        var claimId = Guid.NewGuid();
        var request = new AdjudicateClaimRequest(
            "Approve",
            null,
            _testUserId,
            "Deduction validated by staff inspection."
        );

        var responseDto = new DamageClaimResponse(
            claimId,
            Guid.NewGuid(),
            Guid.NewGuid(),
            "Minor crack",
            new List<string>(),
            5000m,
            5000m,
            "Approved",
            request.Notes,
            _testUserId,
            DateTime.UtcNow,
            DateTime.UtcNow
        );

        _mockClaimService
            .Setup(s => s.AdjudicateClaimAsync(claimId, request, It.IsAny<CancellationToken>()))
            .ReturnsAsync(responseDto);

        // Act
        var result = await _controller.Adjudicate(claimId, request, CancellationToken.None);

        // Assert
        var okResult = result as OkObjectResult;
        okResult.Should().NotBeNull();
        okResult!.StatusCode.Should().Be(200);
        okResult.Value.Should().BeEquivalentTo(responseDto);
    }

    [Fact]
    public async Task ProcessPayout_ValidApprovedClaim_Returns200Ok()
    {
        // Arrange
        var claimId = Guid.NewGuid();
        var payoutResponse = new PayoutClaimResponse(
            claimId,
            Guid.NewGuid(),
            6000m,
            9000m,
            "Settled",
            "SETTLE-12345",
            DateTime.UtcNow
        );

        _mockClaimService
            .Setup(s => s.ProcessPayoutAsync(claimId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(payoutResponse);

        // Act
        var result = await _controller.ProcessPayout(claimId, CancellationToken.None);

        // Assert
        var okResult = result as OkObjectResult;
        okResult.Should().NotBeNull();
        okResult!.StatusCode.Should().Be(200);
        okResult.Value.Should().BeEquivalentTo(payoutResponse);
    }
}
