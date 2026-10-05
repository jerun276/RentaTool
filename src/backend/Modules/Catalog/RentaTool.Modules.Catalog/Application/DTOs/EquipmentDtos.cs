using System.ComponentModel.DataAnnotations;
using RentaTool.Shared.Kernel.Domain;

namespace RentaTool.Modules.Catalog.Application.DTOs;

public class CreateEquipmentDto
{
    [Required(ErrorMessage = "Title is required.")]
    [StringLength(150, MinimumLength = 3, ErrorMessage = "Title must be between 3 and 150 characters.")]
    public string Title { get; set; } = string.Empty;

    public string Description { get; set; } = string.Empty;

    [Required(ErrorMessage = "CategoryId is required.")]
    public Guid CategoryId { get; set; }

    [Range(0.01, 1000000.0, ErrorMessage = "Daily rate must be greater than zero.")]
    public decimal DailyRate { get; set; }

    [Range(0.01, 10000000.0, ErrorMessage = "Replacement value must be greater than zero.")]
    public decimal ReplacementValue { get; set; }

    [Required(ErrorMessage = "Location is required.")]
    public string Location { get; set; } = string.Empty;

    public string SpecificationsJson { get; set; } = "{}";

    public List<ToolImageDto> Images { get; set; } = new();
}

public class ToolImageDto
{
    public string ImageUrl { get; set; } = string.Empty;
    public string Angle { get; set; } = "General"; // Casing, Cord, Motor, General
    public bool IsPrimary { get; set; }
}

public class EquipmentResponseDto
{
    public Guid Id { get; set; }
    public Guid OwnerId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public Guid CategoryId { get; set; }
    public string CategoryName { get; set; } = string.Empty;
    public decimal DailyRate { get; set; }
    public decimal ReplacementValue { get; set; }
    public string Status { get; set; } = string.Empty;
    public string Location { get; set; } = string.Empty;
    public string SpecificationsJson { get; set; } = "{}";
    public int TotalRentalDaysAccumulated { get; set; }
    public bool RequiresMaintenanceCheck { get; set; }
    public DateTime? LastMaintenanceDateUtc { get; set; }
    public DateTime CreatedAtUtc { get; set; }
    public List<ToolImageDto> Images { get; set; } = new();
}

public class EquipmentFilterDto
{
    public string? SearchTerm { get; set; }
    public Guid? CategoryId { get; set; }
    public decimal? MinPrice { get; set; }
    public decimal? MaxPrice { get; set; }
    public EquipmentStatus? Status { get; set; }
    public string? Location { get; set; }
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 10;
}

public class PagedResult<T>
{
    public IReadOnlyList<T> Items { get; set; } = Array.Empty<T>();
    public int TotalCount { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }
    public int TotalPages => (int)Math.Ceiling(TotalCount / (double)PageSize);
}
