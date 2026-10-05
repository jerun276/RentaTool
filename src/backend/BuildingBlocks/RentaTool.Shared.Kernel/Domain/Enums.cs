namespace RentaTool.Shared.Kernel.Domain;

public enum UserRole
{
    Renter = 1,
    Owner = 2,
    Admin = 3
}

public enum KycStatus
{
    Pending = 1,
    Approved = 2,
    Rejected = 3
}

public enum EquipmentStatus
{
    Available = 1,
    Rented = 2,
    UnderMaintenance = 3,
    Disputed = 4
}

public enum BookingStatus
{
    Requested = 1,
    Confirmed = 2,
    Active = 3,
    Completed = 4,
    Cancelled = 5,
    Disputed = 6
}

public enum ClaimStatus
{
    Filed = 1,
    UnderAIEvaluation = 2,
    PendingStaffApproval = 3,
    Approved = 4,
    Revised = 5,
    Rejected = 6,
    Settled = 7
}
