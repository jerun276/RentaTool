using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using RentaTool.Modules.Catalog.Application.DTOs;
using RentaTool.Modules.Catalog.Domain;
using RentaTool.Shared.Infrastructure.Persistence;

namespace RentaTool.Modules.Catalog.Application.Services;

public class CategoryService : ICategoryService
{
    private readonly AppDbContext _context;
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true,
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase
    };

    public CategoryService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<IReadOnlyList<CategoryDto>> GetAllAsync(bool activeOnly = true, CancellationToken ct = default)
    {
        var query = _context.Set<Category>().AsNoTracking().Where(c => !c.IsDeleted);

        if (activeOnly)
        {
            query = query.Where(c => c.IsActive);
        }

        var categories = await query.OrderBy(c => c.Name).ToListAsync(ct);
        return categories.Select(MapToDto).ToList();
    }

    public async Task<CategoryDto?> GetByIdAsync(Guid id, CancellationToken ct = default)
    {
        var category = await _context.Set<Category>()
            .AsNoTracking()
            .FirstOrDefaultAsync(c => c.Id == id && !c.IsDeleted, ct);

        return category != null ? MapToDto(category) : null;
    }

    public async Task<CategoryDto> CreateAsync(CreateCategoryDto dto, CancellationToken ct = default)
    {
        if (dto == null) throw new ArgumentNullException(nameof(dto));

        var normalizedName = dto.Name.Trim().ToLower();
        var exists = await _context.Set<Category>()
            .AnyAsync(c => c.Name.ToLower() == normalizedName && !c.IsDeleted, ct);

        if (exists)
        {
            throw new ArgumentException($"A category with name '{dto.Name}' already exists.");
        }

        var schemaJson = ResolveSchemaJson(dto.SpecificationSchema, dto.SpecificationSchemaJson);
        var category = new Category(dto.Name, dto.Description, dto.IconUrl, schemaJson);

        _context.Set<Category>().Add(category);
        await _context.SaveChangesAsync(ct);

        return MapToDto(category);
    }

    public async Task<CategoryDto> UpdateAsync(Guid id, UpdateCategoryDto dto, CancellationToken ct = default)
    {
        if (dto == null) throw new ArgumentNullException(nameof(dto));

        var category = await _context.Set<Category>()
            .FirstOrDefaultAsync(c => c.Id == id && !c.IsDeleted, ct);

        if (category == null)
        {
            throw new KeyNotFoundException($"Category with ID '{id}' was not found.");
        }

        var normalizedName = dto.Name.Trim().ToLower();
        var duplicate = await _context.Set<Category>()
            .AnyAsync(c => c.Id != id && c.Name.ToLower() == normalizedName && !c.IsDeleted, ct);

        if (duplicate)
        {
            throw new ArgumentException($"A category with name '{dto.Name}' already exists.");
        }

        var schemaJson = ResolveSchemaJson(dto.SpecificationSchema, dto.SpecificationSchemaJson);
        category.Update(dto.Name, dto.Description, dto.IconUrl, schemaJson, dto.IsActive);

        await _context.SaveChangesAsync(ct);
        return MapToDto(category);
    }

    public async Task<bool> DeleteAsync(Guid id, CancellationToken ct = default)
    {
        var category = await _context.Set<Category>()
            .FirstOrDefaultAsync(c => c.Id == id && !c.IsDeleted, ct);

        if (category == null) return false;

        // Check if active equipment exists in this category
        var hasEquipment = await _context.Set<Equipment>()
            .AnyAsync(e => e.CategoryId == id && !e.IsDeleted, ct);

        if (hasEquipment)
        {
            // Deactivate rather than delete if equipment is assigned
            category.Deactivate();
        }
        else
        {
            category.SoftDelete();
            category.Deactivate();
        }

        await _context.SaveChangesAsync(ct);
        return true;
    }

    private static string ResolveSchemaJson(List<CategorySpecFieldDto>? schemaList, string? rawJson)
    {
        if (schemaList != null && schemaList.Count > 0)
        {
            return JsonSerializer.Serialize(schemaList, JsonOptions);
        }

        if (!string.IsNullOrWhiteSpace(rawJson))
        {
            try
            {
                // Validate that it's valid JSON
                using var doc = JsonDocument.Parse(rawJson);
                return rawJson.Trim();
            }
            catch
            {
                return "[]";
            }
        }

        return "[]";
    }

    private static CategoryDto MapToDto(Category category)
    {
        var schemaFields = new List<CategorySpecFieldDto>();
        if (!string.IsNullOrWhiteSpace(category.SpecificationSchemaJson) &&
            category.SpecificationSchemaJson != "[]")
        {
            try
            {
                schemaFields = JsonSerializer.Deserialize<List<CategorySpecFieldDto>>(
                    category.SpecificationSchemaJson, JsonOptions) ?? new();
            }
            catch
            {
                schemaFields = new List<CategorySpecFieldDto>();
            }
        }

        return new CategoryDto
        {
            Id = category.Id,
            Name = category.Name,
            Description = category.Description,
            IconUrl = category.IconUrl,
            IsActive = category.IsActive,
            SpecificationSchemaJson = category.SpecificationSchemaJson,
            SpecificationSchema = schemaFields
        };
    }
}
