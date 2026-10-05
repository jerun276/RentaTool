using RentaTool.Modules.Identity.Application.Dtos;
using RentaTool.Modules.Identity.Domain;

namespace RentaTool.Modules.Identity.Security;

public interface ITokenService
{
    TokenResponseDto Create(User user);
}
