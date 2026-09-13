using RentaTool.Shared.Kernel.Domain;

namespace RentaTool.Modules.Catalog.Domain;

public class Category : BaseEntity
{
    public string Name { get; private set; } = string.Empty;
    public string Description { get; private set; } = string.Empty;
    public string IconUrl { get; private set; } = string.Empty;
    public bool IsActive { get; private set; } = true;

    // EF Core constructor
    private Category() { }

    public Category(string name, string description, string iconUrl)
    {
        if (string.IsNullOrWhiteSpace(name))
            throw new ArgumentException("Category name cannot be empty.", nameof(name));

        Name = name.Trim();
        Description = description?.Trim() ?? string.Empty;
        IconUrl = iconUrl?.Trim() ?? string.Empty;
        IsActive = true;
    }

    public void Update(string name, string description, string iconUrl)
    {
        if (string.IsNullOrWhiteSpace(name))
            throw new ArgumentException("Category name cannot be empty.", nameof(name));

        Name = name.Trim();
        Description = description?.Trim() ?? string.Empty;
        IconUrl = iconUrl?.Trim() ?? string.Empty;
        MarkUpdated();
    }

    public void Deactivate()
    {
        IsActive = false;
        MarkUpdated();
    }
}
