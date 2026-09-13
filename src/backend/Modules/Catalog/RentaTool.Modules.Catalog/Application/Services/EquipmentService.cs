using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using RentaTool.Modules.Catalog.Application.DTOs;
using RentaTool.Modules.Catalog.Domain;
using RentaTool.Shared.Infrastructure.Persistence;

namespace RentaTool.Modules.Catalog.Application.Services;

public interface IEquipmentService
{
    Task<EquipmentResponseDto> CreateAsync(CreateEquipmentDto dto, Guid ownerId);
    Task<EquipmentResponseDto?> GetByIdAsync(Guid id);
    Task<PagedResult<EquipmentResponseDto>> GetPagedListAsync(EquipmentFilterDto filter);
}

public class EquipmentService : IEquipmentService
{
    private readonly AppDbContext _context;

    public EquipmentService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<EquipmentResponseDto> CreateAsync(CreateEquipmentDto dto, Guid ownerId)
    {
        if (dto == null) throw new ArgumentNullException(nameof(dto));

        var category = await _context.Set<Category>().FindAsync(dto.CategoryId);
        if (category == null)
        {
            throw new ArgumentException($"Category with ID {dto.CategoryId} does not exist.", nameof(dto.CategoryId));
        }

        var equipment = new Equipment(
            ownerId,
            dto.Title,
            dto.Description,
            dto.CategoryId,
            dto.DailyRate,
            dto.ReplacementValue,
            dto.Location,
            dto.SpecificationsJson
        );

        if (dto.Images != null && dto.Images.Count > 0)
        {
            foreach (var img in dto.Images)
            {
                equipment.Images.Add(new ToolImage(equipment.Id, img.ImageUrl, img.Angle, img.IsPrimary));
            }
        }

        _context.Set<Equipment>().Add(equipment);
        await _context.SaveChangesAsync();

        return MapToDto(equipment, category.Name);
    }

    public async Task<EquipmentResponseDto?> GetByIdAsync(Guid id)
    {
        var equipment = await _context.Set<Equipment>()
            .Include(e => e.Category)
            .Include(e => e.Images)
            .FirstOrDefaultAsync(e => e.Id == id && !e.IsDeleted);

        if (equipment == null) return null;

        return MapToDto(equipment, equipment.Category?.Name ?? string.Empty);
    }

    public async Task<PagedResult<EquipmentResponseDto>> GetPagedListAsync(EquipmentFilterDto filter)
    {
        var query = _context.Set<Equipment>()
            .Include(e => e.Category)
            .Include(e => e.Images)
            .Where(e => !e.IsDeleted);

        if (!string.IsNullOrWhiteSpace(filter.SearchTerm))
        {
            var term = filter.SearchTerm.Trim().ToLower();
            query = query.Where(e => e.Title.ToLower().Contains(term) || e.Description.ToLower().Contains(term));
        }

        if (filter.CategoryId.HasValue && filter.CategoryId.Value != Guid.Empty)
        {
            query = query.Where(e => e.CategoryId == filter.CategoryId.Value);
        }

        if (filter.MinPrice.HasValue)
        {
            query = query.Where(e => e.DailyRate >= filter.MinPrice.Value);
        }

        if (filter.MaxPrice.HasValue)
        {
            query = query.Where(e => e.DailyRate <= filter.MaxPrice.Value);
        }

        if (filter.Status.HasValue)
        {
            query = query.Where(e => e.Status == filter.Status.Value);
        }

        if (!string.IsNullOrWhiteSpace(filter.Location))
        {
            var loc = filter.Location.Trim().ToLower();
            query = query.Where(e => e.Location.ToLower().Contains(loc));
        }

        var totalCount = await query.CountAsync();
        var page = filter.Page < 1 ? 1 : filter.Page;
        var pageSize = filter.PageSize < 1 ? 10 : (filter.PageSize > 100 ? 100 : filter.PageSize);

        var items = await query
            .OrderByDescending(e => e.CreatedAtUtc)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return new PagedResult<EquipmentResponseDto>
        {
            Items = items.Select(e => MapToDto(e, e.Category?.Name ?? string.Empty)).ToList(),
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize
        };
    }

    private static EquipmentResponseDto MapToDto(Equipment e, string categoryName)
    {
        return new EquipmentResponseDto
        {
            Id = e.Id,
            OwnerId = e.OwnerId,
            Title = e.Title,
            Description = e.Description,
            CategoryId = e.CategoryId,
            CategoryName = categoryName,
            DailyRate = e.DailyRate,
            ReplacementValue = e.ReplacementValue,
            Status = e.Status.ToString(),
            Location = e.Location,
            SpecificationsJson = e.SpecificationsJson,
            TotalRentalDaysAccumulated = e.TotalRentalDaysAccumulated,
            RequiresMaintenanceCheck = e.RequiresMaintenanceCheck,
            LastMaintenanceDateUtc = e.LastMaintenanceDateUtc,
            CreatedAtUtc = e.CreatedAtUtc,
            Images = e.Images.Select(i => new ToolImageDto
            {
                ImageUrl = i.ImageUrl,
                Angle = i.Angle,
                IsPrimary = i.IsPrimary
            }).ToList()
        };
    }
}
