using RentaTool.Shared.Kernel.Domain;

namespace RentaTool.Modules.Escrow.Domain;

public class EscrowHold : BaseEntity
{
    public Guid BookingId { get; private set; }
    public Guid RenterId { get; private set; }
    public Guid OwnerId { get; private set; }
    public decimal DepositAmount { get; private set; }
    public string PreAuthTransactionId { get; private set; }
    public EscrowStatus Status { get; private set; }
    public DateTime HeldAtUtc { get; private set; }
    public DateTime? SettledAtUtc { get; private set; }

    // Parameterless constructor for EF Core
    protected EscrowHold() { }

    public EscrowHold(
        Guid bookingId,
        Guid renterId,
        Guid ownerId,
        decimal depositAmount,
        string preAuthTransactionId)
    {
        if (bookingId == Guid.Empty)
            throw new ArgumentException("BookingId cannot be empty.", nameof(bookingId));

        if (depositAmount <= 0)
            throw new ArgumentException("Deposit amount must be greater than zero.", nameof(depositAmount));

        if (string.IsNullOrWhiteSpace(preAuthTransactionId))
            throw new ArgumentException("PreAuthTransactionId is required.", nameof(preAuthTransactionId));

        BookingId = bookingId;
        RenterId = renterId;
        OwnerId = ownerId;
        DepositAmount = depositAmount;
        PreAuthTransactionId = preAuthTransactionId;
        Status = EscrowStatus.Held;
        HeldAtUtc = DateTime.UtcNow;
    }

    public void MarkDisputed()
    {
        if (Status != EscrowStatus.Held)
            throw new InvalidOperationException($"Cannot dispute escrow in status {Status}.");

        Status = EscrowStatus.Disputed;
        MarkUpdated();
    }

    public void Disburse(decimal damageDeduction)
    {
        if (Status != EscrowStatus.Held && Status != EscrowStatus.Disputed)
            throw new InvalidOperationException($"Cannot disburse escrow in status {Status}.");

        if (damageDeduction < 0 || damageDeduction > DepositAmount)
            throw new ArgumentException($"Deduction {damageDeduction} must be between 0 and held deposit {DepositAmount}.");

        Status = damageDeduction > 0 ? EscrowStatus.Disbursed : EscrowStatus.Refunded;
        SettledAtUtc = DateTime.UtcNow;
        MarkUpdated();
    }

    public void RefundFull()
    {
        if (Status != EscrowStatus.Held && Status != EscrowStatus.Disputed)
            throw new InvalidOperationException($"Cannot refund escrow in status {Status}.");

        Status = EscrowStatus.Refunded;
        SettledAtUtc = DateTime.UtcNow;
        MarkUpdated();
    }
}
