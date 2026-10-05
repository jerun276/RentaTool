using Microsoft.EntityFrameworkCore;
using RentaTool.Modules.Identity.Application.Dtos;
using RentaTool.Modules.Identity.Application.Validation;
using RentaTool.Modules.Identity.Domain;
using RentaTool.Shared.Infrastructure.Persistence;
using RentaTool.Shared.Kernel.Domain;

namespace RentaTool.Modules.Identity.Application.Services;

public sealed class KycService(AppDbContext db) : IKycService
{
    public async Task<KycResponseDto> SubmitAsync(Guid userId, SubmitKycRequestDto request)
    {
        if (!DocumentValidator.IsValid(request.DocumentType, request.DocumentNumber))
            throw new ArgumentException("Document number format is invalid.");
        if (!await db.Set<User>().AnyAsync(x => x.Id == userId))
            throw new KeyNotFoundException("User was not found.");
        if (await db.Set<KycRecord>().AnyAsync(x => x.UserId == userId
                                                    && (x.Status == KycStatus.Pending || x.Status == KycStatus.Approved)))
            throw new InvalidOperationException("You already have a KYC submission that is pending or approved.");

        var record = new KycRecord(userId, request.DocumentType, request.DocumentNumber, request.FrontImageUrl, request.BackImageUrl);
        db.Set<KycRecord>().Add(record);
        await db.SaveChangesAsync();
        return KycDtoMapper.Map(record);
    }
}
