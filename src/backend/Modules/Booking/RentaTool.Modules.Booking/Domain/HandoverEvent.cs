using RentaTool.Shared.Kernel.Domain;

namespace RentaTool.Modules.Booking.Domain;

public class HandoverEvent : BaseEntity
{
    public Guid BookingId { get; private set; }
    public HandoverEventType EventType { get; private set; }
    public DateTime? VerifiedAtUtc { get; private set; }
    public Guid? GeoLocationId { get; private set; }
    public Guid? ScannerUserId { get; private set; }
    public string HandoverTokenHash { get; private set; } = string.Empty;
    public bool IsConfirmed { get; private set; } = false;
    public DateTime ExpiresAtUtc { get; private set; }

    // Navigations
    public Booking? Booking { get; private set; }
    public GeoLocation? GeoLocation { get; private set; }

    // EF Core Constructor
    private HandoverEvent() { }

    public HandoverEvent(Guid bookingId, HandoverEventType eventType, string tokenHash, DateTime expiresAtUtc)
    {
        if (bookingId == Guid.Empty)
            throw new ArgumentException("BookingId cannot be empty.", nameof(bookingId));
        if (string.IsNullOrWhiteSpace(tokenHash))
            throw new ArgumentException("Token hash cannot be empty.", nameof(tokenHash));

        BookingId = bookingId;
        EventType = eventType;
        HandoverTokenHash = tokenHash;
        ExpiresAtUtc = DateTime.SpecifyKind(expiresAtUtc, DateTimeKind.Utc);
        IsConfirmed = false;
    }

    public void Verify(Guid scannerUserId, Guid? geoLocationId)
    {
        if (IsConfirmed)
            throw new InvalidOperationException("This handover token has already been confirmed and consumed.");
        if (DateTime.UtcNow > ExpiresAtUtc)
            throw new InvalidOperationException("This handover token has expired. Please request a new token.");
        if (scannerUserId == Guid.Empty)
            throw new ArgumentException("Scanner user ID cannot be empty.", nameof(scannerUserId));

        ScannerUserId = scannerUserId;
        GeoLocationId = geoLocationId;
        VerifiedAtUtc = DateTime.UtcNow;
        IsConfirmed = true;
        MarkUpdated();
    }
}
