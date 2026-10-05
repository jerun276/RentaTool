namespace RentaTool.Modules.Escrow.Domain;

public enum EscrowStatus
{
    Held = 1,
    Disbursed = 2,
    Refunded = 3,
    Disputed = 4
}

public enum PaymentType
{
    DepositHold = 1,
    DamagePayout = 2,
    DepositRefund = 3,
    PlatformFee = 4
}

public enum PaymentStatus
{
    Pending = 1,
    Completed = 2,
    Failed = 3
}
