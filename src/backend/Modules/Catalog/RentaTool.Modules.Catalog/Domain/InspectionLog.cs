using RentaTool.Shared.Kernel.Domain;

namespace RentaTool.Modules.Catalog.Domain;

public enum InspectionType
{
    PreRental = 1,
    PostRental = 2,
    MaintenanceCheck = 3
}

public enum InspectionSeverity
{
    None = 0,
    MinorWear = 1,
    ModerateDamage = 2,
    StructuralDamage = 3
}

public class InspectionLog : BaseEntity
{
    public Guid EquipmentId { get; private set; }
    public virtual Equipment? Equipment { get; private set; }
    
    public Guid? BookingId { get; private set; }
    public Guid InspectorUserId { get; private set; }
    public InspectionType Type { get; private set; }
    public InspectionSeverity Severity { get; private set; }
    public string ConditionNotes { get; private set; } = string.Empty;
    public string PhotosJson { get; private set; } = "[]"; // JSON array of angle & photo URL

    // EF Core constructor
    private InspectionLog() { }

    public InspectionLog(
        Guid equipmentId,
        Guid? bookingId,
        Guid inspectorUserId,
        InspectionType type,
        InspectionSeverity severity,
        string conditionNotes,
        string photosJson)
    {
        if (equipmentId == Guid.Empty)
            throw new ArgumentException("Equipment ID cannot be empty.", nameof(equipmentId));

        if (inspectorUserId == Guid.Empty)
            throw new ArgumentException("Inspector user ID cannot be empty.", nameof(inspectorUserId));

        EquipmentId = equipmentId;
        BookingId = bookingId;
        InspectorUserId = inspectorUserId;
        Type = type;
        Severity = severity;
        ConditionNotes = conditionNotes?.Trim() ?? string.Empty;
        PhotosJson = string.IsNullOrWhiteSpace(photosJson) ? "[]" : photosJson;
    }
}
