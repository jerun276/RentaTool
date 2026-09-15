namespace RentaTool.Modules.Identity.Application.Dtos;

public record TokenResponseDto(
    Guid UserId,
    string Name,
    string Role,
    string AccessToken,
    string RefreshToken,
    DateTime AccessTokenExpiresAtUtc);
