using System.ComponentModel.DataAnnotations;
using RentaTool.Modules.Catalog.Domain;

namespace RentaTool.Modules.Catalog.Application.DTOs;

public class CreateInspectionLogDto
{
    public Guid? BookingId { get; set; }

    [Required]
    public InspectionType Type { get; set; } = InspectionType.PreRental;

    [Required]
    public InspectionSeverity Severity { get; set; } = InspectionSeverity.None;

    public string ConditionNotes { get; set; } = string.Empty;

    public List<InspectionPhotoDto> Photos { get; set; } = new();
}

public class InspectionPhotoDto
{
    public string Angle { get; set; } = "General"; // Casing, Cord, Motor
    public string PhotoUrl { get; set; } = string.Empty;
    public string? ObservationNote { get; set; }
}

public class InspectionLogResponseDto
{
    public Guid Id { get; set; }
    public Guid EquipmentId { get; set; }
    public Guid? BookingId { get; set; }
    public Guid InspectorUserId { get; set; }
    public string Type { get; set; } = string.Empty;
    public string Severity { get; set; } = string.Empty;
    public string ConditionNotes { get; set; } = string.Empty;
    public string PhotosJson { get; set; } = "[]";
    public DateTime CreatedAtUtc { get; set; }
}

public class EquipmentHistoryTimelineDto
{
    public Guid EquipmentId { get; set; }
    public string Title { get; set; } = string.Empty;
    public int TotalRentalDays { get; set; }
    public bool RequiresMaintenance { get; set; }
    public DateTime? LastServicingDateUtc { get; set; }
    public List<InspectionLogResponseDto> InspectionTimeline { get; set; } = new();
}
