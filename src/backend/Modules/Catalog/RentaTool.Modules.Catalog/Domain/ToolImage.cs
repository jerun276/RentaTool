using RentaTool.Shared.Kernel.Domain;

namespace RentaTool.Modules.Catalog.Domain;

public class ToolImage : BaseEntity
{
    public Guid EquipmentId { get; private set; }
    public virtual Equipment? Equipment { get; private set; }
    
    public string ImageUrl { get; private set; } = string.Empty;
    public string Angle { get; private set; } = "General"; // Casing, Cord, Motor, General
    public bool IsPrimary { get; private set; }

    // EF Core constructor
    private ToolImage() { }

    public ToolImage(Guid equipmentId, string imageUrl, string angle = "General", bool isPrimary = false)
    {
        if (equipmentId == Guid.Empty)
            throw new ArgumentException("Equipment ID cannot be empty.", nameof(equipmentId));

        if (string.IsNullOrWhiteSpace(imageUrl))
            throw new ArgumentException("Image URL cannot be empty.", nameof(imageUrl));

        EquipmentId = equipmentId;
        ImageUrl = imageUrl.Trim();
        Angle = string.IsNullOrWhiteSpace(angle) ? "General" : angle.Trim();
        IsPrimary = isPrimary;
    }

    public void SetPrimary(bool isPrimary)
    {
        IsPrimary = isPrimary;
        MarkUpdated();
    }
}
