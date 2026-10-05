using RentaTool.Modules.Identity.Application.Dtos;

namespace RentaTool.Modules.Identity.Application.Services;

public interface ITrustScoreService
{
    Task<TrustScoreResponseDto?> GetAsync(Guid userId);
}
