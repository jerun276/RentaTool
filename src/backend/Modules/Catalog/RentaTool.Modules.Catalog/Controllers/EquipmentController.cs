using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using RentaTool.Modules.Catalog.Application.DTOs;
using RentaTool.Modules.Catalog.Application.Services;

namespace RentaTool.Modules.Catalog.Controllers;

[ApiController]
[Route("api/v1/equipment")]
[Produces("application/json")]
public class EquipmentController : ControllerBase
{
    private readonly IEquipmentService _equipmentService;
    private readonly IInspectionService _inspectionService;
    private readonly IBatchAvailabilityService _batchAvailabilityService;

    public EquipmentController(
        IEquipmentService equipmentService,
        IInspectionService inspectionService,
        IBatchAvailabilityService batchAvailabilityService)
    {
        _equipmentService = equipmentService;
        _inspectionService = inspectionService;
        _batchAvailabilityService = batchAvailabilityService;
    }

    /// <summary>
    /// 1. Creates a new equipment listing with specifications, daily rate, and replacement value.
    /// </summary>
    [HttpPost]
    [ProducesResponseType(typeof(EquipmentResponseDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> CreateEquipment([FromBody] CreateEquipmentDto dto)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        try
        {
            var currentUserId = GetCurrentUserId();
            var result = await _equipmentService.CreateAsync(dto, currentUserId);
            return CreatedAtAction(nameof(GetEquipmentById), new { id = result.Id }, result);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Retrieves a single equipment listing by ID.
    /// </summary>
    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(EquipmentResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetEquipmentById(Guid id)
    {
        var result = await _equipmentService.GetByIdAsync(id);
        if (result == null)
        {
            return NotFound(new { message = $"Equipment with ID {id} was not found." });
        }

        return Ok(result);
    }

    /// <summary>
    /// 2. Lists equipment with category filtering, search terms, and pagination.
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(PagedResult<EquipmentResponseDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetEquipmentList([FromQuery] EquipmentFilterDto filter)
    {
        var result = await _equipmentService.GetPagedListAsync(filter);
        return Ok(result);
    }

    /// <summary>
    /// 3. Stores pre-rental or post-rental condition records with photographic evidence.
    /// </summary>
    [HttpPost("{id:guid}/inspection-logs")]
    [ProducesResponseType(typeof(InspectionLogResponseDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> CreateInspectionLog(Guid id, [FromBody] CreateInspectionLogDto dto)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        try
        {
            var inspectorId = GetCurrentUserId();
            var result = await _inspectionService.CreateInspectionLogAsync(id, dto, inspectorId);
            return CreatedAtAction(nameof(GetEquipmentHistory), new { id }, result);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>
    /// 4. Retrieves maintenance and past condition timeline for an equipment item.
    /// </summary>
    [HttpGet("{id:guid}/history")]
    [ProducesResponseType(typeof(EquipmentHistoryTimelineDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetEquipmentHistory(Guid id)
    {
        var result = await _inspectionService.GetEquipmentHistoryAsync(id);
        if (result == null)
        {
            return NotFound(new { message = $"Equipment with ID {id} was not found." });
        }

        return Ok(result);
    }

    /// <summary>
    /// 5. (Business-Specific) Checks dynamic maintenance lockouts and flags tools requiring mandatory servicing.
    /// </summary>
    [HttpPost("batch-availability")]
    [ProducesResponseType(typeof(BatchAvailabilityResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> CheckBatchAvailability([FromBody] BatchAvailabilityRequestDto request)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        try
        {
            var result = await _batchAvailabilityService.CheckBatchAvailabilityAsync(request);
            return Ok(result);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
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

        // 2. Read from custom dev header (useful for Swagger testing prior to Auth service)
        if (Request.Headers.TryGetValue("X-User-Id", out var headerValue) &&
            Guid.TryParse(headerValue.FirstOrDefault(), out var headerGuid))
        {
            return headerGuid;
        }

        // 3. Fallback deterministic developer GUID for local test runs
        return Guid.Parse("22222222-2222-2222-2222-222222222222");
    }
}
