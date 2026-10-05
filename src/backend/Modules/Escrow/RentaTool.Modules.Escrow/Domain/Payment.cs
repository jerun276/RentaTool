using RentaTool.Shared.Kernel.Domain;

namespace RentaTool.Modules.Escrow.Domain;

public class Payment : BaseEntity
{
    public Guid? ClaimId { get; private set; }
    public Guid BookingId { get; private set; }
    public Guid PayerUserId { get; private set; }
    public Guid RecipientUserId { get; private set; }
    public decimal Amount { get; private set; }
    public PaymentType PaymentType { get; private set; }
    public PaymentStatus Status { get; private set; }
    public string GatewayTransactionRef { get; private set; }

    // Parameterless constructor for EF Core
    protected Payment() { }

    public Payment(
        Guid? claimId,
        Guid bookingId,
        Guid payerUserId,
        Guid recipientUserId,
        decimal amount,
        PaymentType paymentType,
        string gatewayTransactionRef)
    {
        if (bookingId == Guid.Empty)
            throw new ArgumentException("BookingId cannot be empty.", nameof(bookingId));

        if (amount <= 0)
            throw new ArgumentException("Payment amount must be greater than zero.", nameof(amount));

        if (string.IsNullOrWhiteSpace(gatewayTransactionRef))
            throw new ArgumentException("GatewayTransactionRef cannot be empty.", nameof(gatewayTransactionRef));

        ClaimId = claimId;
        BookingId = bookingId;
        PayerUserId = payerUserId;
        RecipientUserId = recipientUserId;
        Amount = amount;
        PaymentType = paymentType;
        Status = PaymentStatus.Pending;
        GatewayTransactionRef = gatewayTransactionRef;
    }

    public void MarkCompleted()
    {
        Status = PaymentStatus.Completed;
        MarkUpdated();
    }

    public void MarkFailed()
    {
        Status = PaymentStatus.Failed;
        MarkUpdated();
    }
}
