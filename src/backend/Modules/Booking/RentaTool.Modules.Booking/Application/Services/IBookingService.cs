using RentaTool.Modules.Booking.Application.DTOs;

namespace RentaTool.Modules.Booking.Application.Services;

public interface IBookingService
{
    Task<BookingResponseDto> CreateBookingAsync(CreateBookingRequestDto dto, Guid renterId, CancellationToken cancellationToken = default);
    Task<BookingResponseDto?> GetByIdAsync(Guid bookingId, CancellationToken cancellationToken = default);
    Task<IEnumerable<ActiveBookingSummaryDto>> GetActiveBookingsAsync(Guid userId, CancellationToken cancellationToken = default);
}
