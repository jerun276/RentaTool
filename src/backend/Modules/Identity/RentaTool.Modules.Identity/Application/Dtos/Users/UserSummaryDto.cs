namespace RentaTool.Modules.Identity.Application.Dtos;

public sealed record UserSummaryDto(
    Guid Id,
    string Name,
    string Email,
    string PhoneNumber,
    string Role,
    bool IsVerified,
    bool IsActive,
    string? SuspensionReason,
    int TrustScore,
    DateTime CreatedAtUtc,
    DateTime? UpdatedAtUtc
);
