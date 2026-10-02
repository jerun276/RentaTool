using RentaTool.Shared.Kernel.Domain;

namespace RentaTool.Modules.Catalog.Domain;

public class Category : BaseEntity
{
    public string Name { get; private set; } = string.Empty;
    public string Description { get; private set; } = string.Empty;
    public string IconUrl { get; private set; } = string.Empty;
    public bool IsActive { get; private set; } = true;
    public string SpecificationSchemaJson { get; private set; } = "[]";

    // EF Core constructor
    private Category() { }

    public Category(string name, string description, string iconUrl, string specificationSchemaJson = "[]", Guid? id = null)
    {
        if (string.IsNullOrWhiteSpace(name))
            throw new ArgumentException("Category name cannot be empty.", nameof(name));

        if (id.HasValue && id.Value != Guid.Empty)
            Id = id.Value;

        Name = name.Trim();
        Description = description?.Trim() ?? string.Empty;
        IconUrl = iconUrl?.Trim() ?? string.Empty;
        SpecificationSchemaJson = string.IsNullOrWhiteSpace(specificationSchemaJson) ? "[]" : specificationSchemaJson.Trim();
        IsActive = true;
    }

    public void Update(string name, string description, string iconUrl, string? specificationSchemaJson = null, bool? isActive = null)
    {
        if (string.IsNullOrWhiteSpace(name))
            throw new ArgumentException("Category name cannot be empty.", nameof(name));

        Name = name.Trim();
        Description = description?.Trim() ?? string.Empty;
        IconUrl = iconUrl?.Trim() ?? string.Empty;
        if (specificationSchemaJson != null)
            SpecificationSchemaJson = string.IsNullOrWhiteSpace(specificationSchemaJson) ? "[]" : specificationSchemaJson.Trim();
        if (isActive.HasValue)
            IsActive = isActive.Value;
        MarkUpdated();
    }

    public void SetSpecificationSchema(string schemaJson)
    {
        SpecificationSchemaJson = string.IsNullOrWhiteSpace(schemaJson) ? "[]" : schemaJson.Trim();
        MarkUpdated();
    }

    public void Deactivate()
    {
        IsActive = false;
        MarkUpdated();
    }

    public void Activate()
    {
        IsActive = true;
        MarkUpdated();
    }
}
