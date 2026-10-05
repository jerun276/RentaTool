using RentaTool.Shared.Kernel.Domain;

namespace RentaTool.Modules.Booking.Domain;

public class Booking : BaseEntity
{
    public Guid EquipmentId { get; private set; }
    public Guid RenterId { get; private set; }
    public Guid OwnerId { get; private set; }
    public DateTime StartDate { get; private set; }
    public DateTime EndDate { get; private set; }
    public decimal DailyRate { get; private set; }
    public decimal TotalRentalFee { get; private set; }
    public BookingStatus Status { get; private set; }
    public string? CancellationReason { get; private set; }

    // Navigation collections
    private readonly List<HandoverEvent> _handoverEvents = new();
    public IReadOnlyCollection<HandoverEvent> HandoverEvents => _handoverEvents.AsReadOnly();

    private readonly List<BookingSchedule> _bookingSchedules = new();
    public IReadOnlyCollection<BookingSchedule> BookingSchedules => _bookingSchedules.AsReadOnly();

    // EF Core Constructor
    private Booking() { }

    public Booking(
        Guid equipmentId,
        Guid renterId,
        Guid ownerId,
        DateTime startDate,
        DateTime endDate,
        decimal dailyRate,
        decimal totalRentalFee)
    {
        if (equipmentId == Guid.Empty)
            throw new ArgumentException("EquipmentId cannot be empty.", nameof(equipmentId));
        if (renterId == Guid.Empty)
            throw new ArgumentException("RenterId cannot be empty.", nameof(renterId));
        if (ownerId == Guid.Empty)
            throw new ArgumentException("OwnerId cannot be empty.", nameof(ownerId));
        if (renterId == ownerId)
            throw new ArgumentException("Renter cannot be the owner of the equipment.");
        if (endDate < startDate)
            throw new ArgumentException("EndDate cannot be earlier than StartDate.");
        if (dailyRate <= 0)
            throw new ArgumentOutOfRangeException(nameof(dailyRate), "DailyRate must be strictly positive.");
        if (totalRentalFee <= 0)
            throw new ArgumentOutOfRangeException(nameof(totalRentalFee), "TotalRentalFee must be strictly positive.");

        EquipmentId = equipmentId;
        RenterId = renterId;
        OwnerId = ownerId;
        StartDate = DateTime.SpecifyKind(startDate, DateTimeKind.Utc);
        EndDate = DateTime.SpecifyKind(endDate, DateTimeKind.Utc);
        DailyRate = dailyRate;
        TotalRentalFee = totalRentalFee;
        Status = BookingStatus.Confirmed; // Initial confirmation once escrow pre-authorized / requested
    }

    public void Confirm()
    {
        if (Status != BookingStatus.Requested)
            throw new InvalidOperationException($"Cannot confirm booking with current status '{Status}'.");

        Status = BookingStatus.Confirmed;
        MarkUpdated();
    }

    public void Activate()
    {
        if (Status != BookingStatus.Confirmed)
            throw new InvalidOperationException($"Cannot activate booking from status '{Status}'. Must be Confirmed.");

        Status = BookingStatus.Active;
        MarkUpdated();
    }

    public void Complete()
    {
        if (Status != BookingStatus.Active)
            throw new InvalidOperationException($"Cannot complete booking from status '{Status}'. Must be Active.");

        Status = BookingStatus.Completed;
        MarkUpdated();
    }

    public void Cancel(string reason)
    {
        if (Status != BookingStatus.Requested && Status != BookingStatus.Confirmed)
            throw new InvalidOperationException($"Cannot cancel booking from status '{Status}'. Only Requested or Confirmed bookings can be cancelled.");

        Status = BookingStatus.Cancelled;
        CancellationReason = reason;
        MarkUpdated();
    }

    public void MarkDisputed()
    {
        if (Status != BookingStatus.Active && Status != BookingStatus.Completed)
            throw new InvalidOperationException($"Cannot dispute booking from status '{Status}'.");

        Status = BookingStatus.Disputed;
        MarkUpdated();
    }

    public void Extend(DateTime newEndDate, decimal additionalFee)
    {
        if (Status != BookingStatus.Confirmed && Status != BookingStatus.Active)
            throw new InvalidOperationException($"Only Confirmed or Active bookings can be extended. Current status: '{Status}'.");
        if (newEndDate <= EndDate)
            throw new ArgumentException("New end date must be strictly after the current end date.", nameof(newEndDate));
        if (additionalFee <= 0)
            throw new ArgumentOutOfRangeException(nameof(additionalFee), "Additional fee for extension must be positive.");

        EndDate = DateTime.SpecifyKind(newEndDate, DateTimeKind.Utc);
        TotalRentalFee += additionalFee;
        MarkUpdated();
    }

    public void AddHandoverEvent(HandoverEvent handoverEvent)
    {
        _handoverEvents.Add(handoverEvent);
    }

    public void AddBookingSchedule(BookingSchedule schedule)
    {
        _bookingSchedules.Add(schedule);
    }
}
