using Microsoft.EntityFrameworkCore;
using RentaTool.Modules.Booking.Application.DTOs;
using RentaTool.Modules.Booking.Domain;
using RentaTool.Shared.Infrastructure.Persistence;

namespace RentaTool.Modules.Booking.Application.Services;

public class ScheduleExtensionService : IScheduleExtensionService
{
    private readonly AppDbContext _context;

    public ScheduleExtensionService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<ExtendScheduleResponseDto> ExtendScheduleAsync(
        Guid bookingId,
        ExtendScheduleRequestDto dto,
        Guid requestedByUserId,
        CancellationToken cancellationToken = default)
    {
        var booking = await _context.Set<Domain.Booking>()
            .Include(b => b.BookingSchedules)
            .FirstOrDefaultAsync(b => b.Id == bookingId, cancellationToken);

        if (booking == null)
        {
            throw new KeyNotFoundException($"Booking with ID {bookingId} was not found.");
        }

        // Only renter or owner can request an extension
        if (booking.RenterId != requestedByUserId && booking.OwnerId != requestedByUserId)
        {
            throw new UnauthorizedAccessException("Only the renter or owner is authorized to extend the rental schedule.");
        }

        var newEndUtc = DateTime.SpecifyKind(dto.NewEndDate.Date.AddDays(1).AddTicks(-1), DateTimeKind.Utc);
        if (newEndUtc <= booking.EndDate)
        {
            throw new ArgumentException($"New end date ({dto.NewEndDate:yyyy-MM-dd}) must be strictly after the current end date ({booking.EndDate:yyyy-MM-dd}).");
        }

        // Conflict check: Check if another booking schedule blocks this equipment between current EndDate and newEndUtc
        var hasConflict = await _context.Set<BookingSchedule>()
            .AnyAsync(s => s.EquipmentId == booking.EquipmentId &&
                           s.BookingId != booking.Id &&
                           s.BlockedStartDate <= newEndUtc &&
                           s.BlockedEndDate >= booking.EndDate,
                      cancellationToken);

        if (hasConflict)
        {
            throw new InvalidOperationException("Cannot extend schedule: equipment has a conflicting reservation during the requested extension period.");
        }

        var extendedDays = (dto.NewEndDate.Date - booking.EndDate.Date).Days;
        if (extendedDays <= 0)
        {
            throw new ArgumentException("Extension duration must be at least 1 day.");
        }

        // Dynamic Surge Pricing Calculation
        var (surgeMultiplier, reason) = CalculateDynamicSurgeMultiplier(booking.EndDate, dto.NewEndDate);
        var surgeDailyRate = Math.Round(booking.DailyRate * surgeMultiplier, 2);
        var additionalFee = Math.Round(surgeDailyRate * extendedDays, 2);

        var previousEndDate = booking.EndDate;

        // Apply domain extension
        booking.Extend(newEndUtc, additionalFee);

        // Update booking schedule
        var schedule = booking.BookingSchedules.FirstOrDefault(s => s.BookingId == booking.Id)
                       ?? await _context.Set<BookingSchedule>().FirstOrDefaultAsync(s => s.BookingId == booking.Id, cancellationToken);

        if (schedule != null)
        {
            schedule.ExtendBlockedEndDate(newEndUtc, $"Extended: {reason}");
        }
        else
        {
            schedule = new BookingSchedule(booking.EquipmentId, booking.Id, booking.StartDate, newEndUtc, $"Extended: {reason}");
            await _context.Set<BookingSchedule>().AddAsync(schedule, cancellationToken);
        }

        await _context.SaveChangesAsync(cancellationToken);

        return new ExtendScheduleResponseDto
        {
            BookingId = booking.Id,
            PreviousEndDate = previousEndDate,
            NewEndDate = newEndUtc,
            ExtendedDays = extendedDays,
            BaseDailyRate = booking.DailyRate,
            SurgeMultiplier = surgeMultiplier,
            SurgeDailyRate = surgeDailyRate,
            AdditionalFee = additionalFee,
            NewTotalRentalFee = booking.TotalRentalFee,
            Reason = reason
        };
    }

    private static (decimal Multiplier, string Reason) CalculateDynamicSurgeMultiplier(DateTime currentEndDate, DateTime newEndDate)
    {
        decimal multiplier = 1.0m;
        var reasons = new List<string>();

        // 1. Weekend Demand Surge
        bool includesWeekend = false;
        for (var day = currentEndDate.Date.AddDays(1); day <= newEndDate.Date; day = day.AddDays(1))
        {
            if (day.DayOfWeek is DayOfWeek.Friday or DayOfWeek.Saturday or DayOfWeek.Sunday)
            {
                includesWeekend = true;
                break;
            }
        }

        if (includesWeekend)
        {
            multiplier += 0.25m;
            reasons.Add("High Weekend Demand (+25%)");
        }

        // 2. Short Notice Surge (Requested with <= 24 hours remaining on existing booking)
        var hoursRemaining = (currentEndDate - DateTime.UtcNow).TotalHours;
        if (hoursRemaining <= 24)
        {
            multiplier += 0.15m;
            reasons.Add("Last-Minute Schedule Extension (+15%)");
        }

        // Standard extension factor if no surges triggered
        if (reasons.Count == 0)
        {
            multiplier = 1.10m;
            reasons.Add("Standard Schedule Extension Adjustment (+10%)");
        }

        return (multiplier, string.Join(", ", reasons));
    }
}
