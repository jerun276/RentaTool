using Microsoft.EntityFrameworkCore;
using RentaTool.Modules.Identity.Application.Dtos;
using RentaTool.Modules.Identity.Application.Validation;
using RentaTool.Modules.Identity.Domain;
using RentaTool.Shared.Infrastructure.Persistence;

namespace RentaTool.Modules.Identity.Application.Services;

public sealed class KycService(AppDbContext db) : IKycService
{
    public async Task<KycResponseDto> SubmitAsync(Guid userId, SubmitKycRequestDto request)
    {
        if (!DocumentValidator.IsValid(request.DocumentType, request.DocumentNumber))
            throw new ArgumentException("Document number format is invalid.");
        if (!await db.Set<User>().AnyAsync(x => x.Id == userId))
            throw new KeyNotFoundException("User was not found.");

        var record = new KycRecord(userId, request.DocumentType, request.DocumentNumber, request.FrontImageUrl, request.BackImageUrl);
        db.Set<KycRecord>().Add(record);
        await db.SaveChangesAsync();
        return KycDtoMapper.Map(record);
    }
}
