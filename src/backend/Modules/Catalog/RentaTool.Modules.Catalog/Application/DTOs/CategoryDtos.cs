using System.ComponentModel.DataAnnotations;

namespace RentaTool.Modules.Catalog.Application.DTOs;

public class CategorySpecFieldDto
{
    [Required]
    public string Key { get; set; } = string.Empty;

    [Required]
    public string Label { get; set; } = string.Empty;

    public string Unit { get; set; } = string.Empty;

    public string FieldType { get; set; } = "text"; // "text", "number", "select"

    public bool IsRequired { get; set; } = false;

    public List<string> Options { get; set; } = new();
}

public class CategoryDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string IconUrl { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;
    public string SpecificationSchemaJson { get; set; } = "[]";
    public List<CategorySpecFieldDto> SpecificationSchema { get; set; } = new();
}

public class CreateCategoryDto
{
    [Required(ErrorMessage = "Category name is required.")]
    [StringLength(100, MinimumLength = 2, ErrorMessage = "Category name must be between 2 and 100 characters.")]
    public string Name { get; set; } = string.Empty;

    [StringLength(500, ErrorMessage = "Description cannot exceed 500 characters.")]
    public string Description { get; set; } = string.Empty;

    [StringLength(255, ErrorMessage = "Icon URL cannot exceed 255 characters.")]
    public string IconUrl { get; set; } = string.Empty;

    public List<CategorySpecFieldDto>? SpecificationSchema { get; set; }

    public string? SpecificationSchemaJson { get; set; }
}

public class UpdateCategoryDto
{
    [Required(ErrorMessage = "Category name is required.")]
    [StringLength(100, MinimumLength = 2, ErrorMessage = "Category name must be between 2 and 100 characters.")]
    public string Name { get; set; } = string.Empty;

    [StringLength(500, ErrorMessage = "Description cannot exceed 500 characters.")]
    public string Description { get; set; } = string.Empty;

    [StringLength(255, ErrorMessage = "Icon URL cannot exceed 255 characters.")]
    public string IconUrl { get; set; } = string.Empty;

    public bool IsActive { get; set; } = true;

    public List<CategorySpecFieldDto>? SpecificationSchema { get; set; }

    public string? SpecificationSchemaJson { get; set; }
}
