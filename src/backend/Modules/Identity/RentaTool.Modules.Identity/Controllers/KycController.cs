using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using RentaTool.Modules.Identity.Application.Dtos;
using RentaTool.Modules.Identity.Application.Services;

namespace RentaTool.Modules.Identity.Controllers;

[ApiController]
[Route("api/v1/users")]
[Produces("application/json")]
public class KycController(IKycService kycService) : ControllerBase
{
    /// <summary>Submits NIC or driving-license information for the authenticated user.</summary>
    [Authorize]
    [HttpPost("kyc")]
    [ProducesResponseType(typeof(KycResponseDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> SubmitKyc(SubmitKycRequestDto request)
    {
        if (!ModelState.IsValid) return ValidationProblem(ModelState);
        try { return StatusCode(StatusCodes.Status201Created, await kycService.SubmitAsync(CurrentUserId(), request)); }
        catch (ArgumentException ex) { return BadRequest(new { message = ex.Message }); }
        catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
    }

    private Guid CurrentUserId() => Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub") ?? throw new UnauthorizedAccessException());
}
