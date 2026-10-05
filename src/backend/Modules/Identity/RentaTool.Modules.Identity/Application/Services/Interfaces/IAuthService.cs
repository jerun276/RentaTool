using RentaTool.Modules.Identity.Application.Dtos;

namespace RentaTool.Modules.Identity.Application.Services;

public interface IAuthService
{
    Task<TokenResponseDto> RegisterAsync(RegisterRequestDto request);
    Task<TokenResponseDto?> LoginAsync(LoginRequestDto request);
}
