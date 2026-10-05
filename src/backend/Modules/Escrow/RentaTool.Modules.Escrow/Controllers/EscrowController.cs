using Microsoft.AspNetCore.Mvc;
using RentaTool.Modules.Escrow.Application.DTOs;
using RentaTool.Modules.Escrow.Application.Services;

namespace RentaTool.Modules.Escrow.Controllers;

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
    public async Task<IActionResult> PreAuthorize([FromBody] PreAuthorizeDepositRequest request, CancellationToken cancellationToken)
    {
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
    public async Task<IActionResult> GetByBooking(Guid bookingId, CancellationToken cancellationToken)
    {
        var escrow = await _escrowService.GetEscrowByBookingIdAsync(bookingId, cancellationToken);
        if (escrow == null)
            return NotFound(new { error = $"Escrow hold for booking {bookingId} not found." });

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
