using Microsoft.EntityFrameworkCore;
using RentaTool.Modules.Catalog.Application.DTOs;
using RentaTool.Modules.Catalog.Domain;
using RentaTool.Shared.Infrastructure.Persistence;
using RentaTool.Shared.Kernel.Domain;

namespace RentaTool.Modules.Catalog.Application.Services;

public interface IBatchAvailabilityService
{
    Task<BatchAvailabilityResponseDto> CheckBatchAvailabilityAsync(BatchAvailabilityRequestDto request);
}

public class BatchAvailabilityService : IBatchAvailabilityService
{
    private readonly AppDbContext _context;

    public BatchAvailabilityService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<BatchAvailabilityResponseDto> CheckBatchAvailabilityAsync(BatchAvailabilityRequestDto request)
    {
        if (request == null) throw new ArgumentNullException(nameof(request));

        if (request.DesiredEndDate < request.DesiredStartDate)
        {
            throw new ArgumentException("Desired end date cannot be earlier than start date.", nameof(request.DesiredEndDate));
        }

        var distinctIds = request.EquipmentIds.Distinct().ToList();

        var equipmentList = await _context.Set<Equipment>()
            .Where(e => distinctIds.Contains(e.Id) && !e.IsDeleted)
            .ToListAsync();

        var response = new BatchAvailabilityResponseDto
        {
            TotalRequested = distinctIds.Count
        };

        foreach (var id in distinctIds)
        {
            var eq = equipmentList.FirstOrDefault(e => e.Id == id);
            if (eq == null)
            {
                response.LockedOutItems.Add(new LockedOutEquipmentDto
                {
                    EquipmentId = id,
                    Title = "Unknown Equipment",
                    LockoutReason = "Equipment does not exist or has been decommissioned.",
                    RequiredAction = "Remove from batch list.",
                    AccumulatedRentalDays = 0,
                    ServicingMandatory = false
                });
                continue;
            }

            // 1. Check direct status lockout
            if (eq.Status == EquipmentStatus.UnderMaintenance)
            {
                response.LockedOutItems.Add(new LockedOutEquipmentDto
                {
                    EquipmentId = eq.Id,
                    Title = eq.Title,
                    LockoutReason = "Equipment is currently under scheduled maintenance.",
                    RequiredAction = "Await maintenance completion and workshop release.",
                    AccumulatedRentalDays = eq.TotalRentalDaysAccumulated,
                    ServicingMandatory = true
                });
                continue;
            }

            if (eq.Status == EquipmentStatus.Disputed)
            {
                response.LockedOutItems.Add(new LockedOutEquipmentDto
                {
                    EquipmentId = eq.Id,
                    Title = eq.Title,
                    LockoutReason = "Equipment is locked due to an active damage arbitration claim.",
                    RequiredAction = "Complete claim adjudication before re-dispatching.",
                    AccumulatedRentalDays = eq.TotalRentalDaysAccumulated,
                    ServicingMandatory = false
                });
                continue;
            }

            if (eq.Status == EquipmentStatus.Rented)
            {
                response.LockedOutItems.Add(new LockedOutEquipmentDto
                {
                    EquipmentId = eq.Id,
                    Title = eq.Title,
                    LockoutReason = "Equipment is currently active in another rental booking.",
                    RequiredAction = "Verify expected return date before dispatch.",
                    AccumulatedRentalDays = eq.TotalRentalDaysAccumulated,
                    ServicingMandatory = false
                });
                continue;
            }

            // 2. Dynamic Wear-and-Tear Lockout Check (PRD Business-Specific Rule)
            if (eq.RequiresMaintenanceCheck || eq.TotalRentalDaysAccumulated >= Equipment.MandatoryServicingDaysThreshold)
            {
                response.LockedOutItems.Add(new LockedOutEquipmentDto
                {
                    EquipmentId = eq.Id,
                    Title = eq.Title,
                    LockoutReason = $"Mandatory safety servicing threshold exceeded ({eq.TotalRentalDaysAccumulated} accumulated rental days >= {Equipment.MandatoryServicingDaysThreshold} days limit).",
                    RequiredAction = "Owner must conduct safety inspection and register servicing log prior to next rental dispatch.",
                    AccumulatedRentalDays = eq.TotalRentalDaysAccumulated,
                    ServicingMandatory = true
                });
                continue;
            }

            // If all checks pass, equipment is available
            response.AvailableItems.Add(new EquipmentAvailabilityItemDto
            {
                EquipmentId = eq.Id,
                Title = eq.Title,
                DailyRate = eq.DailyRate,
                AccumulatedDays = eq.TotalRentalDaysAccumulated,
                IsSafeForDispatch = true
            });
        }

        response.TotalAvailable = response.AvailableItems.Count;
        response.TotalLockedOut = response.LockedOutItems.Count;

        return response;
    }
}
