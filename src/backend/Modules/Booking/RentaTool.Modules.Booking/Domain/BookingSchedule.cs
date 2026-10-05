using RentaTool.Shared.Kernel.Domain;

namespace RentaTool.Modules.Booking.Domain;

public class BookingSchedule : BaseEntity
{
    public Guid EquipmentId { get; private set; }
    public Guid BookingId { get; private set; }
    public DateTime BlockedStartDate { get; private set; }
    public DateTime BlockedEndDate { get; private set; }
    public string Reason { get; private set; } = string.Empty;

    // Navigation
    public Booking? Booking { get; private set; }

    // EF Core Constructor
    private BookingSchedule() { }

    public BookingSchedule(Guid equipmentId, Guid bookingId, DateTime blockedStartDate, DateTime blockedEndDate, string reason)
    {
        if (equipmentId == Guid.Empty)
            throw new ArgumentException("EquipmentId cannot be empty.", nameof(equipmentId));
        if (bookingId == Guid.Empty)
            throw new ArgumentException("BookingId cannot be empty.", nameof(bookingId));
        if (blockedEndDate <= blockedStartDate)
            throw new ArgumentException("BlockedEndDate must be strictly after BlockedStartDate.");

        EquipmentId = equipmentId;
        BookingId = bookingId;
        BlockedStartDate = DateTime.SpecifyKind(blockedStartDate, DateTimeKind.Utc);
        BlockedEndDate = DateTime.SpecifyKind(blockedEndDate, DateTimeKind.Utc);
        Reason = string.IsNullOrWhiteSpace(reason) ? "RentalReservation" : reason;
    }

    public void ExtendBlockedEndDate(DateTime newEndDate, string reason)
    {
        if (newEndDate <= BlockedEndDate)
            throw new ArgumentException("New end date must be strictly after current blocked end date.", nameof(newEndDate));

        BlockedEndDate = DateTime.SpecifyKind(newEndDate, DateTimeKind.Utc);
        Reason = reason;
        MarkUpdated();
    }
}
