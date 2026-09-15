using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using RentaTool.Modules.Identity.Application.Dtos;
using RentaTool.Modules.Identity.Application.Services;
using RentaTool.Shared.Kernel.Domain;

namespace RentaTool.Modules.Identity.Controllers;

[ApiController]
[Route("api/v1/users")]
[Produces("application/json")]
public class UsersController(ITrustScoreService trustScoreService, IVerificationService verificationService) : ControllerBase
{
    [Authorize(Roles = "Admin")]
    [HttpGet("kyc-submissions")]
    [ProducesResponseType(typeof(IReadOnlyList<AdminKycReviewDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetKycSubmissions([FromQuery] KycStatus? status, [FromQuery] string? search)
    {
        try { return Ok(await verificationService.GetReviewQueueAsync(status, search)); }
        catch (ArgumentException ex) { return BadRequest(new { message = ex.Message }); }
    }

    [Authorize(Roles = "Admin")]
    [HttpGet("{id:guid}/kyc-submission")]
    [ProducesResponseType(typeof(AdminKycReviewDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetKycSubmission(Guid id)
    {
        try { return Ok(await verificationService.GetSubmissionAsync(id)); }
        catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
    }

    [Authorize]
    [HttpGet("{id:guid}/trust-score")]
    public async Task<IActionResult> GetTrustScore(Guid id)
    {
        if (CurrentUserId() != id && !User.IsInRole("Admin")) return Forbid();
        var score = await trustScoreService.GetAsync(id); return score is null ? NotFound(new { message = "User trust score was not found." }) : Ok(score);
    }
    [Authorize(Roles = "Admin")]
    [HttpPatch("{id:guid}/verification-status")]
    [ProducesResponseType(typeof(KycResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> ReviewKyc(Guid id, VerificationStatusRequestDto request)
    {
        if (!ModelState.IsValid) return ValidationProblem(ModelState);
        try { return Ok(await verificationService.ReviewAsync(id, CurrentUserId(), request)); }
        catch (ArgumentException ex) { return BadRequest(new { message = ex.Message }); }
        catch (InvalidOperationException ex) { return Conflict(new { message = ex.Message }); }
        catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
    }
    private Guid CurrentUserId() => Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub") ?? throw new UnauthorizedAccessException());
}
