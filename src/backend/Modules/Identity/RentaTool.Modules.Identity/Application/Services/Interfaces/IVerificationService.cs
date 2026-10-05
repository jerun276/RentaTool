using RentaTool.Modules.Identity.Application.Dtos;
using RentaTool.Shared.Kernel.Domain;

namespace RentaTool.Modules.Identity.Application.Services;

public interface IVerificationService
{
    Task<KycResponseDto> ReviewAsync(Guid userId, Guid adminId, VerificationStatusRequestDto request);
    Task<IReadOnlyList<AdminKycReviewDto>> GetReviewQueueAsync(KycStatus? status, string? search);
    Task<AdminKycReviewDto> GetSubmissionAsync(Guid userId);
}
