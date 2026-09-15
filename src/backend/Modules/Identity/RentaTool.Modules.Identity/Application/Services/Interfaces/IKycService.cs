using RentaTool.Modules.Identity.Application.Dtos;

namespace RentaTool.Modules.Identity.Application.Services;

public interface IKycService
{
    Task<KycResponseDto> SubmitAsync(Guid userId, SubmitKycRequestDto request);
}
