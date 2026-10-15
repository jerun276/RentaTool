using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RentaTool.Modules.Booking.Domain;
using RentaTool.Modules.Catalog.Domain;
using RentaTool.Modules.Escrow.Application.DTOs;
using RentaTool.Modules.Escrow.Application.Services;
using RentaTool.Shared.Infrastructure.Persistence;

namespace RentaTool.Modules.Escrow.Controllers;

[Authorize]
[ApiController]
[Route("api/v1/escrow")]
public class EscrowController : ControllerBase
{
    private readonly IEscrowService _escrowService;
    private readonly AppDbContext _context;

    public EscrowController(IEscrowService escrowService, AppDbContext context)
    {
        _escrowService = escrowService;
        _context = context;
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

        Guid? equipmentId = null;
        string? equipmentTitle = null;
        string? equipmentImageUrl = null;
        try
        {
            var booking = await _context.Set<RentaTool.Modules.Booking.Domain.Booking>()
                .AsNoTracking()
                .FirstOrDefaultAsync(b => b.Id == bookingId, cancellationToken);

            if (booking != null)
            {
                equipmentId = booking.EquipmentId;
                var equipment = await _context.Set<Equipment>()
                    .AsNoTracking()
                    .Include(e => e.Images)
                    .FirstOrDefaultAsync(e => e.Id == booking.EquipmentId, cancellationToken);

                if (equipment != null)
                {
                    equipmentTitle = equipment.Title;
                    equipmentImageUrl = equipment.Images.FirstOrDefault(i => i.IsPrimary)?.ImageUrl
                        ?? equipment.Images.FirstOrDefault()?.ImageUrl;
                }
            }
        }
        catch
        {
            // Gracefully degrade if relational joins are not populated
        }

        return Ok(new
        {
            escrow.Id,
            escrow.BookingId,
            escrow.DepositAmount,
            escrow.PreAuthTransactionId,
            Status = escrow.Status.ToString(),
            escrow.HeldAtUtc,
            escrow.SettledAtUtc,
            EquipmentId = equipmentId,
            EquipmentTitle = equipmentTitle,
            EquipmentImageUrl = equipmentImageUrl
        });
    }
}
