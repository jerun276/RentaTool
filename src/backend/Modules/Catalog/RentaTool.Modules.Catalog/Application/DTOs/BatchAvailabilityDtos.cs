using System.ComponentModel.DataAnnotations;

namespace RentaTool.Modules.Catalog.Application.DTOs;

public class BatchAvailabilityRequestDto
{
    [Required]
    [MinLength(1, ErrorMessage = "At least one equipment ID must be provided.")]
    public List<Guid> EquipmentIds { get; set; } = new();

    [Required]
    public DateTime DesiredStartDate { get; set; }

    [Required]
    public DateTime DesiredEndDate { get; set; }
}

public class BatchAvailabilityResponseDto
{
    public int TotalRequested { get; set; }
    public int TotalAvailable { get; set; }
    public int TotalLockedOut { get; set; }
    public List<EquipmentAvailabilityItemDto> AvailableItems { get; set; } = new();
    public List<LockedOutEquipmentDto> LockedOutItems { get; set; } = new();
}

public class EquipmentAvailabilityItemDto
{
    public Guid EquipmentId { get; set; }
    public string Title { get; set; } = string.Empty;
    public decimal DailyRate { get; set; }
    public int AccumulatedDays { get; set; }
    public bool IsSafeForDispatch { get; set; } = true;
}

public class LockedOutEquipmentDto
{
    public Guid EquipmentId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string LockoutReason { get; set; } = string.Empty;
    public string RequiredAction { get; set; } = string.Empty;
    public int AccumulatedRentalDays { get; set; }
    public bool ServicingMandatory { get; set; }
}
