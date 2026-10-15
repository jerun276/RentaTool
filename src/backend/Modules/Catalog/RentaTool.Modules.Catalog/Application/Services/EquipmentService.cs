using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using RentaTool.Modules.Catalog.Application.DTOs;
using RentaTool.Modules.Catalog.Domain;
using RentaTool.Shared.Infrastructure.Persistence;

namespace RentaTool.Modules.Catalog.Application.Services;

public interface IEquipmentService
{
    Task<EquipmentResponseDto> CreateAsync(CreateEquipmentDto dto, Guid ownerId);
    Task<EquipmentResponseDto> UpdateAsync(Guid id, UpdateEquipmentDto dto, Guid currentUserId);
    Task<EquipmentResponseDto?> GetByIdAsync(Guid id);
    Task<PagedResult<EquipmentResponseDto>> GetPagedListAsync(EquipmentFilterDto filter);
    Task<bool> CompleteMaintenanceAsync(Guid id);
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

    public async Task<EquipmentResponseDto> UpdateAsync(Guid id, UpdateEquipmentDto dto, Guid currentUserId)
    {
        if (dto == null) throw new ArgumentNullException(nameof(dto));

        var equipment = await _context.Set<Equipment>()
            .Include(e => e.Category)
            .Include(e => e.Images)
            .FirstOrDefaultAsync(e => e.Id == id && !e.IsDeleted);

        if (equipment == null)
        {
            throw new KeyNotFoundException($"Equipment with ID {id} was not found.");
        }

        if (equipment.OwnerId != currentUserId)
        {
            throw new UnauthorizedAccessException("You are not authorized to update this equipment.");
        }

        var category = await _context.Set<Category>().FindAsync(dto.CategoryId);
        if (category == null)
        {
            throw new ArgumentException($"Category with ID {dto.CategoryId} does not exist.", nameof(dto.CategoryId));
        }

        equipment.UpdateDetails(
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
            equipment.Images.Clear();
            foreach (var img in dto.Images)
            {
                var newImg = new ToolImage(equipment.Id, img.ImageUrl, img.Angle, img.IsPrimary);
                _context.Set<ToolImage>().Add(newImg);
            }
        }


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

        var dto = MapToDto(equipment, equipment.Category?.Name ?? string.Empty);
        await PopulateOwnerDetailsAsync(new List<EquipmentResponseDto> { dto });
        return dto;
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

        var dtos = items.Select(e => MapToDto(e, e.Category?.Name ?? string.Empty)).ToList();
        await PopulateOwnerDetailsAsync(dtos);

        return new PagedResult<EquipmentResponseDto>
        {
            Items = dtos,
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize
        };
    }

    public async Task<bool> CompleteMaintenanceAsync(Guid id)
    {
        var equipment = await _context.Set<Equipment>().FindAsync(id);
        if (equipment == null || equipment.IsDeleted) return false;

        equipment.CompleteMaintenance();
        await _context.SaveChangesAsync();
        return true;
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

    private async Task PopulateOwnerDetailsAsync(List<EquipmentResponseDto> dtos)
    {
        if (dtos.Count == 0 || !_context.Database.IsRelational()) return;

        var ownerIds = dtos.Select(d => d.OwnerId).Distinct().ToList();
        try
        {
            var conn = _context.Database.GetDbConnection();
            var shouldClose = false;
            if (conn.State != System.Data.ConnectionState.Open)
            {
                await conn.OpenAsync();
                shouldClose = true;
            }

            try
            {
                using var cmd = conn.CreateCommand();
                var inParams = string.Join(",", ownerIds.Select((_, i) => $"@p{i}"));
                cmd.CommandText = $@"
                    SELECT u.id, u.name, u.phone_number, u.is_verified, u.profile_photo_url, u.created_at_utc,
                           COALESCE((SELECT t.running_trust_score FROM trust_ledger t WHERE t.user_id = u.id ORDER BY t.created_at_utc DESC LIMIT 1), 50) AS trust_score
                    FROM users u
                    WHERE u.id IN ({inParams})";

                for (int i = 0; i < ownerIds.Count; i++)
                {
                    var param = cmd.CreateParameter();
                    param.ParameterName = $"@p{i}";
                    param.Value = ownerIds[i];
                    cmd.Parameters.Add(param);
                }

                var ownerMap = new Dictionary<Guid, (string Name, string? Phone, bool IsVerified, string? Photo, DateTime MemberSince, int TrustScore)>();
                using var reader = await cmd.ExecuteReaderAsync();
                while (await reader.ReadAsync())
                {
                    var id = reader.GetGuid(0);
                    var name = reader.IsDBNull(1) ? "Equipment Owner" : reader.GetString(1);
                    var phone = reader.IsDBNull(2) ? null : reader.GetString(2);
                    var isVerified = !reader.IsDBNull(3) && reader.GetBoolean(3);
                    var photo = reader.IsDBNull(4) ? null : reader.GetString(4);
                    var memberSince = reader.IsDBNull(5) ? DateTime.UtcNow : reader.GetDateTime(5);
                    var trustScore = reader.IsDBNull(6) ? 50 : Convert.ToInt32(reader.GetValue(6));

                    ownerMap[id] = (name, phone, isVerified, photo, memberSince, trustScore);
                }

                foreach (var dto in dtos)
                {
                    if (ownerMap.TryGetValue(dto.OwnerId, out var o))
                    {
                        dto.OwnerName = o.Name;
                        dto.OwnerPhoneNumber = o.Phone;
                        dto.OwnerIsVerified = o.IsVerified;
                        dto.OwnerProfilePhotoUrl = o.Photo;
                        dto.OwnerMemberSinceUtc = o.MemberSince;
                        dto.OwnerTrustScore = o.TrustScore;
                    }
                }
            }
            finally
            {
                if (shouldClose && conn.State == System.Data.ConnectionState.Open)
                {
                    await conn.CloseAsync();
                }
            }
        }
        catch
        {
            // Gracefully ignore SQL failure if schema differs
        }
    }
}

