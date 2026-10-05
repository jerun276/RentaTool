namespace RentaTool.Modules.Escrow.Application.DTOs;

public record PreAuthorizeDepositRequest(
    Guid BookingId,
    Guid RenterId,
    Guid OwnerId,
    decimal DepositAmount,
    string? PaymentMethodToken
);

public record PreAuthorizeDepositResponse(
    Guid EscrowId,
    Guid BookingId,
    decimal DepositAmount,
    string PreAuthTransactionId,
    string Status,
    DateTime HeldAtUtc
);

public record FileClaimRequest(
    Guid BookingId,
    Guid FiledByUserId,
    string DamageDescription,
    List<string>? EvidencePhotos
);

public record DamageClaimResponse(
    Guid ClaimId,
    Guid BookingId,
    Guid FiledByUserId,
    string DamageDescription,
    List<string> EvidencePhotos,
    decimal ProposedDeduction,
    decimal? FinalDeduction,
    string Status,
    string? AdjudicationNotes,
    Guid? AdjudicatedByUserId,
    DateTime? AdjudicatedAtUtc,
    DateTime CreatedAtUtc
);

public record AdjudicateClaimRequest(
    string Decision,
    decimal? RevisedDeduction,
    Guid AdjudicatorId,
    string? Notes
);

public record PayoutClaimResponse(
    Guid ClaimId,
    Guid BookingId,
    decimal OwnerPayoutAmount,
    decimal RenterRefundAmount,
    string Status,
    string SettlementReference,
    DateTime SettledAtUtc
);
