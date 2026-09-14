using System.Security.Cryptography;
using System.Text;
using Microsoft.EntityFrameworkCore;
using RentaTool.Modules.Booking.Application.DTOs;
using RentaTool.Modules.Booking.Domain;
using RentaTool.Shared.Infrastructure.Persistence;
using RentaTool.Shared.Kernel.Domain;

namespace RentaTool.Modules.Booking.Application.Services;

public class HandoverTokenService : IHandoverTokenService
{
    private readonly AppDbContext _context;
    private const int TokenTtlMinutes = 15;

    public HandoverTokenService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<HandoverTokenResponseDto> GenerateTokenAsync(
        Guid bookingId,
        HandoverEventType eventType,
        Guid requestedByUserId,
        CancellationToken cancellationToken = default)
    {
        var booking = await _context.Set<Domain.Booking>()
            .FirstOrDefaultAsync(b => b.Id == bookingId, cancellationToken);

        if (booking == null)
        {
            throw new KeyNotFoundException($"Booking with ID {bookingId} was not found.");
        }

        // Authorization check: only parties involved in the booking can generate tokens
        if (booking.RenterId != requestedByUserId && booking.OwnerId != requestedByUserId)
        {
            throw new UnauthorizedAccessException("Only the renter or equipment owner can generate handover tokens.");
        }

        // Status checks
        if (eventType == HandoverEventType.Pickup && booking.Status != BookingStatus.Confirmed)
        {
            throw new InvalidOperationException($"Cannot generate pickup token for booking in status '{booking.Status}'. Must be Confirmed.");
        }

        if (eventType == HandoverEventType.Return && booking.Status != BookingStatus.Active)
        {
            throw new InvalidOperationException($"Cannot generate return token for booking in status '{booking.Status}'. Must be Active.");
        }

        // Generate high-entropy single-use token (e.g., RT-8A9F-2B4C)
        var rawToken = GenerateSecureToken();
        var tokenHash = ComputeSha256Hash(rawToken);
        var expiresAtUtc = DateTime.UtcNow.AddMinutes(TokenTtlMinutes);

        var handoverEvent = new HandoverEvent(bookingId, eventType, tokenHash, expiresAtUtc);
        booking.AddHandoverEvent(handoverEvent);

        await _context.Set<HandoverEvent>().AddAsync(handoverEvent, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);

        return new HandoverTokenResponseDto
        {
            BookingId = bookingId,
            EventType = eventType.ToString(),
            Token = rawToken,
            ExpiresAtUtc = expiresAtUtc,
            Instructions = $"Present this single-use QR token to the other party within {TokenTtlMinutes} minutes to complete the {eventType.ToString().ToLower()} verification."
        };
    }

    public async Task<HandoverVerificationResponseDto> VerifyHandoverAsync(
        Guid bookingId,
        VerifyHandoverRequestDto dto,
        Guid scannerUserId,
        CancellationToken cancellationToken = default)
    {
        var booking = await _context.Set<Domain.Booking>()
            .FirstOrDefaultAsync(b => b.Id == bookingId, cancellationToken);

        if (booking == null)
        {
            throw new KeyNotFoundException($"Booking with ID {bookingId} was not found.");
        }

        var incomingHash = ComputeSha256Hash(dto.Token.Trim());

        var handoverEvent = await _context.Set<HandoverEvent>()
            .FirstOrDefaultAsync(h => h.BookingId == bookingId &&
                                      h.EventType == dto.EventType &&
                                      h.HandoverTokenHash == incomingHash,
                                cancellationToken);

        if (handoverEvent == null)
        {
            throw new InvalidOperationException("Invalid or unrecognized handover token.");
        }

        // Record GPS GeoLocation
        GeoLocation? geoLocation = null;
        if (dto.Latitude != 0 || dto.Longitude != 0)
        {
            geoLocation = new GeoLocation(
                dto.Latitude,
                dto.Longitude,
                dto.AddressLine ?? string.Empty,
                dto.City ?? string.Empty,
                dto.PostalCode ?? string.Empty);

            await _context.Set<GeoLocation>().AddAsync(geoLocation, cancellationToken);
        }

        // Consume and verify the event
        handoverEvent.Verify(scannerUserId, geoLocation?.Id);

        // Transition booking status based on event type
        if (dto.EventType == HandoverEventType.Pickup)
        {
            booking.Activate();
        }
        else if (dto.EventType == HandoverEventType.Return)
        {
            booking.Complete();
        }

        await _context.SaveChangesAsync(cancellationToken);

        return new HandoverVerificationResponseDto
        {
            BookingId = bookingId,
            EventType = dto.EventType.ToString(),
            VerifiedAtUtc = handoverEvent.VerifiedAtUtc ?? DateTime.UtcNow,
            NewBookingStatus = booking.Status.ToString(),
            IsSuccess = true,
            Message = $"Handover {dto.EventType} successfully verified and confirmed via QR cryptographic token."
        };
    }

    private static string GenerateSecureToken()
    {
        var bytes = new byte[8];
        RandomNumberGenerator.Fill(bytes);
        var hex = Convert.ToHexString(bytes);
        return $"RT-{hex[..4]}-{hex[4..8]}-{hex[8..12]}-{hex[12..16]}";
    }

    private static string ComputeSha256Hash(string input)
    {
        var bytes = Encoding.UTF8.GetBytes(input);
        var hashBytes = SHA256.HashData(bytes);
        return Convert.ToHexString(hashBytes);
    }
}
