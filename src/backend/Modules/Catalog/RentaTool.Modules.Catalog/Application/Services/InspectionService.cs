using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using RentaTool.Modules.Catalog.Application.DTOs;
using RentaTool.Modules.Catalog.Domain;
using RentaTool.Shared.Infrastructure.Persistence;

namespace RentaTool.Modules.Catalog.Application.Services;

public interface IInspectionService
{
    Task<InspectionLogResponseDto> CreateInspectionLogAsync(Guid equipmentId, CreateInspectionLogDto dto, Guid inspectorId);
    Task<EquipmentHistoryTimelineDto?> GetEquipmentHistoryAsync(Guid equipmentId);
}

public class InspectionService : IInspectionService
{
    private readonly AppDbContext _context;

    public InspectionService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<InspectionLogResponseDto> CreateInspectionLogAsync(Guid equipmentId, CreateInspectionLogDto dto, Guid inspectorId)
    {
        if (dto == null) throw new ArgumentNullException(nameof(dto));

        var equipment = await _context.Set<Equipment>().FindAsync(equipmentId);
        if (equipment == null || equipment.IsDeleted)
        {
            throw new KeyNotFoundException($"Equipment with ID {equipmentId} was not found.");
        }

        var photosJson = dto.Photos != null && dto.Photos.Count > 0
            ? JsonSerializer.Serialize(dto.Photos)
            : "[]";

        var log = new InspectionLog(
            equipmentId,
            dto.BookingId,
            inspectorId,
            dto.Type,
            dto.Severity,
            dto.ConditionNotes,
            photosJson
        );

        // Auto-lockout invariant: Structural damage requires immediate maintenance lockout
        if (dto.Severity == InspectionSeverity.StructuralDamage || dto.Severity == InspectionSeverity.ModerateDamage)
        {
            equipment.FlagForMaintenance();
        }

        _context.Set<InspectionLog>().Add(log);
        await _context.SaveChangesAsync();

        return new InspectionLogResponseDto
        {
            Id = log.Id,
            EquipmentId = log.EquipmentId,
            BookingId = log.BookingId,
            InspectorUserId = log.InspectorUserId,
            Type = log.Type.ToString(),
            Severity = log.Severity.ToString(),
            ConditionNotes = log.ConditionNotes,
            PhotosJson = log.PhotosJson,
            CreatedAtUtc = log.CreatedAtUtc
        };
    }

    public async Task<EquipmentHistoryTimelineDto?> GetEquipmentHistoryAsync(Guid equipmentId)
    {
        var equipment = await _context.Set<Equipment>()
            .Include(e => e.InspectionLogs)
            .FirstOrDefaultAsync(e => e.Id == equipmentId && !e.IsDeleted);

        if (equipment == null) return null;

        var logs = equipment.InspectionLogs
            .OrderByDescending(l => l.CreatedAtUtc)
            .Select(l => new InspectionLogResponseDto
            {
                Id = l.Id,
                EquipmentId = l.EquipmentId,
                BookingId = l.BookingId,
                InspectorUserId = l.InspectorUserId,
                Type = l.Type.ToString(),
                Severity = l.Severity.ToString(),
                ConditionNotes = l.ConditionNotes,
                PhotosJson = l.PhotosJson,
                CreatedAtUtc = l.CreatedAtUtc
            }).ToList();

        return new EquipmentHistoryTimelineDto
        {
            EquipmentId = equipment.Id,
            Title = equipment.Title,
            TotalRentalDays = equipment.TotalRentalDaysAccumulated,
            RequiresMaintenance = equipment.RequiresMaintenanceCheck,
            LastServicingDateUtc = equipment.LastMaintenanceDateUtc,
            InspectionTimeline = logs
        };
    }
}
