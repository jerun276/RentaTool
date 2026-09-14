using RentaTool.Modules.Booking.Application.DTOs;
using RentaTool.Modules.Booking.Domain;

namespace RentaTool.Modules.Booking.Application.Services;

public interface IHandoverTokenService
{
    Task<HandoverTokenResponseDto> GenerateTokenAsync(
        Guid bookingId,
        HandoverEventType eventType,
        Guid requestedByUserId,
        CancellationToken cancellationToken = default);

    Task<HandoverVerificationResponseDto> VerifyHandoverAsync(
        Guid bookingId,
        VerifyHandoverRequestDto dto,
        Guid scannerUserId,
        CancellationToken cancellationToken = default);
}
