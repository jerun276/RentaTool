using RentaTool.Modules.Identity.Application.Dtos;

namespace RentaTool.Modules.Identity.Application.Services;

public interface IVerificationService
{
    Task<KycResponseDto> ReviewAsync(Guid userId, Guid adminId, VerificationStatusRequestDto request);
}
