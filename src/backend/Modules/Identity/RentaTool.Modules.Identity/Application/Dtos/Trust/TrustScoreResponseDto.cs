namespace RentaTool.Modules.Identity.Application.Dtos;

public record TrustScoreResponseDto(
    Guid UserId,
    int Score,
    int LedgerEntries,
    DateTime CalculatedAtUtc);
