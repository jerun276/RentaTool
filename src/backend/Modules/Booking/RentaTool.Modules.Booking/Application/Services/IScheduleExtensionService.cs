using RentaTool.Modules.Booking.Application.DTOs;

namespace RentaTool.Modules.Booking.Application.Services;

public interface IScheduleExtensionService
{
    Task<ExtendScheduleResponseDto> ExtendScheduleAsync(
        Guid bookingId,
        ExtendScheduleRequestDto dto,
        Guid requestedByUserId,
        CancellationToken cancellationToken = default);
}
