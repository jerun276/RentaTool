using Microsoft.AspNetCore.Mvc;
using RentaTool.Modules.Escrow.Application.DTOs;
using RentaTool.Modules.Escrow.Application.Services;

namespace RentaTool.Modules.Escrow.Controllers;

[ApiController]
[Route("api/v1/claims")]
public class ClaimsController : ControllerBase
{
    private readonly IClaimService _claimService;

    public ClaimsController(IClaimService claimService)
    {
        _claimService = claimService;
    }

    /// <summary>Files a photographic damage claim upon tool return.</summary>
    [HttpPost]
    public async Task<IActionResult> FileClaim([FromBody] FileClaimRequest request, CancellationToken cancellationToken)
    {
        try
        {
            var result = await _claimService.FileClaimAsync(request, cancellationToken);
            return CreatedAtAction(nameof(GetById), new { id = result.ClaimId }, result);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    /// <summary>Retrieves all damage claims for the arbitration desk.</summary>
    [HttpGet]
    public async Task<IActionResult> GetAll(CancellationToken cancellationToken)
    {
        var claims = await _claimService.GetClaimsAsync(cancellationToken);
        return Ok(claims);
    }

    /// <summary>Retrieves a damage claim with its AI evaluation and deduction breakdown.</summary>
    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id, CancellationToken cancellationToken)
    {
        var claim = await _claimService.GetClaimByIdAsync(id, cancellationToken);
        if (claim == null)
            return NotFound(new { error = $"Damage claim {id} not found." });

        return Ok(claim);
    }

    /// <summary>Disburses final settlement payments (owner payout + renter refund).</summary>
    [HttpPost("{id:guid}/payout")]
    public async Task<IActionResult> ProcessPayout(Guid id, CancellationToken cancellationToken)
    {
        try
        {
            var result = await _claimService.ProcessPayoutAsync(id, cancellationToken);
            return Ok(result);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { error = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    /// <summary>Business-Specific: Enforces human review decisions (Approve, Revise, Reject) and updates ledger.</summary>
    [HttpPost("{id:guid}/adjudicate")]
    public async Task<IActionResult> Adjudicate(Guid id, [FromBody] AdjudicateClaimRequest request, CancellationToken cancellationToken)
    {
        try
        {
            var result = await _claimService.AdjudicateClaimAsync(id, request, cancellationToken);
            return Ok(result);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { error = ex.Message });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }
}
