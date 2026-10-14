using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using RentaTool.Modules.Escrow.Application.DTOs;
using RentaTool.Modules.Escrow.Application.Services;

namespace RentaTool.Modules.Escrow.Controllers;

[Authorize]
[ApiController]
[Route("api/v1/escrow")]
public class EscrowController : ControllerBase
{
    private readonly IEscrowService _escrowService;

    public EscrowController(IEscrowService escrowService)
    {
        _escrowService = escrowService;
    }

    /// <summary>Pre-authorizes and locks security deposit funds via simulated gateway.</summary>
    [HttpPost("pre-authorize")]
    [ProducesResponseType(typeof(PreAuthorizeDepositResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> PreAuthorize([FromBody] PreAuthorizeDepositRequest request, CancellationToken cancellationToken)
    {
        var idValue = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub");
        if (Guid.TryParse(idValue, out var userId) && !User.IsInRole("Admin"))
        {
            if (request.RenterId != userId)
                return StatusCode(StatusCodes.Status403Forbidden, new { error = "You cannot pre-authorize escrow for another user." });
        }

        try
        {
            var result = await _escrowService.PreAuthorizeDepositAsync(request, cancellationToken);
            return Ok(result);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    /// <summary>Fetches escrow hold status for a specific booking.</summary>
    [HttpGet("booking/{bookingId:guid}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetByBooking(Guid bookingId, CancellationToken cancellationToken)
    {
        var escrow = await _escrowService.GetEscrowByBookingIdAsync(bookingId, cancellationToken);
        if (escrow == null)
            return NotFound(new { error = $"Escrow hold for booking {bookingId} not found." });

        var idValue = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub");
        if (Guid.TryParse(idValue, out var userId) && !User.IsInRole("Admin"))
        {
            if (escrow.RenterId != userId && escrow.OwnerId != userId)
                return StatusCode(StatusCodes.Status403Forbidden, new { error = "You are not authorized to view this escrow hold." });
        }

        return Ok(new
        {
            escrow.Id,
            escrow.BookingId,
            escrow.DepositAmount,
            escrow.PreAuthTransactionId,
            Status = escrow.Status.ToString(),
            escrow.HeldAtUtc,
            escrow.SettledAtUtc
        });
    }
}
