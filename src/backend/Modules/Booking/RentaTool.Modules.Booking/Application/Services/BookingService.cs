using Microsoft.EntityFrameworkCore;
using RentaTool.Modules.Booking.Application.DTOs;
using RentaTool.Modules.Booking.Domain;
using RentaTool.Shared.Infrastructure.Persistence;
using RentaTool.Shared.Kernel.Domain;

namespace RentaTool.Modules.Booking.Application.Services;

public class BookingService : IBookingService
{
    private readonly AppDbContext _context;

    public BookingService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<BookingResponseDto> CreateBookingAsync(
        CreateBookingRequestDto dto,
        Guid renterId,
        CancellationToken cancellationToken = default)
    {
        if (dto.EndDate.Date < dto.StartDate.Date)
        {
            throw new ArgumentException("EndDate cannot be earlier than StartDate.");
        }

        if (renterId == dto.OwnerId)
        {
            throw new ArgumentException("Renter cannot rent their own equipment.");
        }

        var startUtc = DateTime.SpecifyKind(dto.StartDate.Date, DateTimeKind.Utc);
        var endUtc = DateTime.SpecifyKind(dto.EndDate.Date.AddDays(1).AddTicks(-1), DateTimeKind.Utc);

        // Schedule Conflict Validation: Check for existing overlapping schedules
        var hasConflict = await _context.Set<BookingSchedule>()
            .AnyAsync(s => s.EquipmentId == dto.EquipmentId &&
                           s.BlockedStartDate <= endUtc &&
                           s.BlockedEndDate >= startUtc,
                      cancellationToken);

        if (hasConflict)
        {
            throw new InvalidOperationException("Equipment is already reserved or unavailable for the selected date range.");
        }

        var rentalDays = (dto.EndDate.Date - dto.StartDate.Date).Days + 1;
        var totalFee = rentalDays * dto.DailyRate;

        var booking = new Domain.Booking(
            dto.EquipmentId,
            renterId,
            dto.OwnerId,
            startUtc,
            endUtc,
            dto.DailyRate,
            totalFee);

        var schedule = new BookingSchedule(
            dto.EquipmentId,
            booking.Id,
            startUtc,
            endUtc,
            "RentalReservation");

        booking.AddBookingSchedule(schedule);

        await _context.Set<Domain.Booking>().AddAsync(booking, cancellationToken);
        await _context.Set<BookingSchedule>().AddAsync(schedule, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);

        return MapToDto(booking);
    }

    public async Task<BookingResponseDto?> GetByIdAsync(Guid bookingId, CancellationToken cancellationToken = default)
    {
        var booking = await _context.Set<Domain.Booking>()
            .AsNoTracking()
            .FirstOrDefaultAsync(b => b.Id == bookingId, cancellationToken);

        return booking == null ? null : MapToDto(booking);
    }

    public async Task<IEnumerable<ActiveBookingSummaryDto>> GetActiveBookingsAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        var activeStatuses = new[]
        {
            BookingStatus.Requested,
            BookingStatus.Confirmed,
            BookingStatus.Active
        };

        var bookings = await _context.Set<Domain.Booking>()
            .Include(b => b.HandoverEvents)
            .AsNoTracking()
            .Where(b => (b.RenterId == userId || b.OwnerId == userId) &&
                        activeStatuses.Contains(b.Status))
            .OrderByDescending(b => b.StartDate)
            .ToListAsync(cancellationToken);

        return bookings.Select(b => new ActiveBookingSummaryDto
        {
            Id = b.Id,
            EquipmentId = b.EquipmentId,
            RenterId = b.RenterId,
            OwnerId = b.OwnerId,
            StartDate = b.StartDate,
            EndDate = b.EndDate,
            TotalRentalFee = b.TotalRentalFee,
            Status = b.Status.ToString(),
            PickupVerified = b.HandoverEvents.Any(h => h.EventType == HandoverEventType.Pickup && h.IsConfirmed),
            ReturnVerified = b.HandoverEvents.Any(h => h.EventType == HandoverEventType.Return && h.IsConfirmed),
            CreatedAtUtc = b.CreatedAtUtc
        });
    }

    private static BookingResponseDto MapToDto(Domain.Booking booking)
    {
        return new BookingResponseDto
        {
            Id = booking.Id,
            EquipmentId = booking.EquipmentId,
            RenterId = booking.RenterId,
            OwnerId = booking.OwnerId,
            StartDate = booking.StartDate,
            EndDate = booking.EndDate,
            DailyRate = booking.DailyRate,
            TotalRentalFee = booking.TotalRentalFee,
            Status = booking.Status.ToString(),
            CancellationReason = booking.CancellationReason,
            CreatedAtUtc = booking.CreatedAtUtc,
            UpdatedAtUtc = booking.UpdatedAtUtc
        };
    }
}
