
using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using RentaTool.Modules.Booking.Application.DTOs;
using RentaTool.Modules.Booking.Application.Services;

namespace RentaTool.Modules.Booking.Controllers;

[ApiController]
[Route("api/v1/bookings")]
[Produces("application/json")]
public class BookingsController : ControllerBase
{
    private readonly IBookingService _bookingService;
    private readonly IHandoverTokenService _handoverTokenService;
    private readonly IScheduleExtensionService _scheduleExtensionService;

    public BookingsController(
        IBookingService bookingService,
        IHandoverTokenService handoverTokenService,
        IScheduleExtensionService scheduleExtensionService)
    {
        _bookingService = bookingService;
        _handoverTokenService = handoverTokenService;
        _scheduleExtensionService = scheduleExtensionService;
    }

    /// <summary>
    /// 1. Initiates a new equipment rental booking request with conflict validation.
    /// </summary>
    [HttpPost]
    [ProducesResponseType(typeof(BookingResponseDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> CreateBooking([FromBody] CreateBookingRequestDto dto)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        try
        {
            var renterId = GetCurrentUserId();
            var result = await _bookingService.CreateBookingAsync(dto, renterId);
            return CreatedAtAction(nameof(GetBookingById), new { id = result.Id }, result);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Retrieves a booking by its unique identifier.
    /// </summary>
    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(BookingResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetBookingById(Guid id)
    {
        var result = await _bookingService.GetByIdAsync(id);
        if (result == null)
        {
            return NotFound(new { message = $"Booking with ID {id} was not found." });
        }

        return Ok(result);
    }

    /// <summary>
    /// 2. Returns all active and confirmed bookings for the authenticated user.
    /// </summary>
    [HttpGet("active")]
    [ProducesResponseType(typeof(IEnumerable<ActiveBookingSummaryDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetActiveBookings()
    {
        var role = User.FindFirst(ClaimTypes.Role)?.Value ?? User.FindFirst("role")?.Value;
        var hasUserHeader = Request.Headers.TryGetValue("X-User-Id", out var headerValue) &&
                            Guid.TryParse(headerValue.FirstOrDefault(), out _);
        var hasJwt = User.FindFirst(ClaimTypes.NameIdentifier) != null || User.FindFirst("sub") != null;

        if (string.Equals(role, "Admin", StringComparison.OrdinalIgnoreCase) || (!hasUserHeader && !hasJwt))
        {
            var fleetResults = await _bookingService.GetActiveBookingsAsync(Guid.Empty);
            return Ok(fleetResults);
        }

        var currentUserId = GetCurrentUserId();
        var results = await _bookingService.GetActiveBookingsAsync(currentUserId);
        return Ok(results);
    }

    /// <summary>
    /// 3. Issues a single-use cryptographically hashed handover token for pickup or return.
    /// </summary>
    [HttpPost("{id:guid}/generate-handover-token")]
    [ProducesResponseType(typeof(HandoverTokenResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GenerateHandoverToken(Guid id, [FromBody] GenerateHandoverTokenRequestDto dto)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        try
        {
            var currentUserId = GetCurrentUserId();
            var result = await _handoverTokenService.GenerateTokenAsync(id, dto.EventType, currentUserId);
            return Ok(result);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(StatusCodes.Status403Forbidden, new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>
    /// 4. Confirms equipment pickup or return via QR token scan with GPS location logging.
    /// </summary>
    [HttpPost("{id:guid}/verify-handover")]
    [ProducesResponseType(typeof(HandoverVerificationResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> VerifyHandover(Guid id, [FromBody] VerifyHandoverRequestDto dto)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        try
        {
            var scannerUserId = GetCurrentUserId();
            var result = await _handoverTokenService.VerifyHandoverAsync(id, dto, scannerUserId);
            return Ok(result);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>
    /// 5. (Business-Specific Operation) Checks schedule conflicts and applies schedule extensions with dynamic surge pricing.
    /// </summary>
    [HttpPost("{id:guid}/extend-schedule")]
    [ProducesResponseType(typeof(ExtendScheduleResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> ExtendSchedule(Guid id, [FromBody] ExtendScheduleRequestDto dto)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        try
        {
            var currentUserId = GetCurrentUserId();
            var result = await _scheduleExtensionService.ExtendScheduleAsync(id, dto, currentUserId);
            return Ok(result);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(StatusCodes.Status403Forbidden, new { message = ex.Message });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new { message = ex.Message });
        }
    }

    private Guid GetCurrentUserId()
    {
        // 1. Read from JWT Claim if authenticated
        var claimValue = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                         ?? User.FindFirst("sub")?.Value;
        if (Guid.TryParse(claimValue, out var claimGuid))
        {
            return claimGuid;
        }

        // 2. Read from custom dev header (useful for Swagger UI testing prior to Auth service)
        if (Request.Headers.TryGetValue("X-User-Id", out var headerValue) &&
            Guid.TryParse(headerValue.FirstOrDefault(), out var headerGuid))
        {
            return headerGuid;
        }

        // 3. Fallback deterministic developer GUID for Component 3 local test runs
        return Guid.Parse("33333333-3333-3333-3333-333333333333");
    }
}
