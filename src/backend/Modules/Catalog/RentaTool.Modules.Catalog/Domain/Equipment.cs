using RentaTool.Shared.Kernel.Domain;

namespace RentaTool.Modules.Catalog.Domain;

public class Equipment : BaseEntity
{
    public Guid OwnerId { get; private set; }
    public string Title { get; private set; } = string.Empty;
    public string Description { get; private set; } = string.Empty;
    public Guid CategoryId { get; private set; }
    public virtual Category? Category { get; private set; }
    
    public decimal DailyRate { get; private set; }
    public decimal ReplacementValue { get; private set; }
    public EquipmentStatus Status { get; private set; } = EquipmentStatus.Available;
    public string Location { get; private set; } = string.Empty;
    public string SpecificationsJson { get; private set; } = "{}";
    
    // Dynamic maintenance metrics
    public int TotalRentalDaysAccumulated { get; private set; }
    public bool RequiresMaintenanceCheck { get; private set; }
    public DateTime? LastMaintenanceDateUtc { get; private set; }

    public virtual ICollection<ToolImage> Images { get; private set; } = new List<ToolImage>();
    public virtual ICollection<InspectionLog> InspectionLogs { get; private set; } = new List<InspectionLog>();

    // Constant wear-and-tear threshold: tools must be serviced every 60 rental days
    public const int MandatoryServicingDaysThreshold = 60;

    // EF Core constructor
    private Equipment() { }

    public Equipment(
        Guid ownerId,
        string title,
        string description,
        Guid categoryId,
        decimal dailyRate,
        decimal replacementValue,
        string location,
        string specificationsJson = "{}")
    {
        if (ownerId == Guid.Empty)
            throw new ArgumentException("Owner ID cannot be empty.", nameof(ownerId));

        if (string.IsNullOrWhiteSpace(title))
            throw new ArgumentException("Equipment title cannot be empty.", nameof(title));

        if (dailyRate <= 0)
            throw new ArgumentException("Daily rate must be greater than zero.", nameof(dailyRate));

        if (replacementValue <= 0)
            throw new ArgumentException("Replacement value must be greater than zero.", nameof(replacementValue));

        OwnerId = ownerId;
        Title = title.Trim();
        Description = description?.Trim() ?? string.Empty;
        CategoryId = categoryId;
        DailyRate = dailyRate;
        ReplacementValue = replacementValue;
        Location = location?.Trim() ?? string.Empty;
        SpecificationsJson = string.IsNullOrWhiteSpace(specificationsJson) ? "{}" : specificationsJson;
        Status = EquipmentStatus.Available;
        TotalRentalDaysAccumulated = 0;
        RequiresMaintenanceCheck = false;
    }

    public void UpdateDetails(
        string title,
        string description,
        Guid categoryId,
        decimal dailyRate,
        decimal replacementValue,
        string location,
        string specificationsJson)
    {
        if (string.IsNullOrWhiteSpace(title))
            throw new ArgumentException("Equipment title cannot be empty.", nameof(title));

        if (dailyRate <= 0)
            throw new ArgumentException("Daily rate must be greater than zero.", nameof(dailyRate));

        if (replacementValue <= 0)
            throw new ArgumentException("Replacement value must be greater than zero.", nameof(replacementValue));

        Title = title.Trim();
        Description = description?.Trim() ?? string.Empty;
        CategoryId = categoryId;
        DailyRate = dailyRate;
        ReplacementValue = replacementValue;
        Location = location?.Trim() ?? string.Empty;
        SpecificationsJson = string.IsNullOrWhiteSpace(specificationsJson) ? "{}" : specificationsJson;
        MarkUpdated();
    }

    public void RecordRentalDays(int days)
    {
        if (days <= 0) return;

        TotalRentalDaysAccumulated += days;
        if (TotalRentalDaysAccumulated >= MandatoryServicingDaysThreshold)
        {
            RequiresMaintenanceCheck = true;
        }
        MarkUpdated();
    }

    public void FlagForMaintenance()
    {
        RequiresMaintenanceCheck = true;
        Status = EquipmentStatus.UnderMaintenance;
        MarkUpdated();
    }

    public void CompleteMaintenance()
    {
        RequiresMaintenanceCheck = false;
        TotalRentalDaysAccumulated = 0;
        LastMaintenanceDateUtc = DateTime.UtcNow;
        Status = EquipmentStatus.Available;
        MarkUpdated();
    }

    public void ChangeStatus(EquipmentStatus newStatus)
    {
        Status = newStatus;
        MarkUpdated();
    }
}
