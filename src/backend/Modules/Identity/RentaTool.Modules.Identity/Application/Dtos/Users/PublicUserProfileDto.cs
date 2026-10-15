namespace RentaTool.Modules.Identity.Application.Dtos;

public sealed record PublicUserProfileDto(
    Guid Id,
    string Name,
    string Role,
    bool IsVerified,
    int TrustScore,
    DateTime MemberSinceUtc,
    string? PhoneNumber = null,
    string? ProfilePhotoUrl = null
);
