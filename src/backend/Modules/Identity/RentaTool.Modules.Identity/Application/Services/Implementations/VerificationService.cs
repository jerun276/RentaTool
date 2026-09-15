using Microsoft.EntityFrameworkCore;
using RentaTool.Modules.Identity.Application.Dtos;
using RentaTool.Modules.Identity.Domain;
using RentaTool.Shared.Infrastructure.Persistence;
using RentaTool.Shared.Kernel.Domain;

namespace RentaTool.Modules.Identity.Application.Services;

public sealed class VerificationService(AppDbContext db) : IVerificationService
{
    public async Task<KycResponseDto> ReviewAsync(Guid userId, Guid adminId, VerificationStatusRequestDto request)
    {
        var user = await db.Set<User>().SingleOrDefaultAsync(x => x.Id == userId)
            ?? throw new KeyNotFoundException("User was not found.");
        var record = await db.Set<KycRecord>().Where(x => x.UserId == userId).OrderByDescending(x => x.CreatedAtUtc).FirstOrDefaultAsync()
            ?? throw new KeyNotFoundException("No KYC record was found.");

        record.Review(request.Status, adminId, request.RejectionReason);
        if (request.Status == KycStatus.Approved)
        {
            user.SetVerified();
            var currentScore = await GetCurrentScoreAsync(userId);
            db.Set<TrustLedger>().Add(new TrustLedger(userId, 25, "KYC approved", record.Id.ToString(), currentScore + 25));
        }
        else
        {
            user.SetUnverified();
        }

        await db.SaveChangesAsync();
        return KycDtoMapper.Map(record);
    }

    private async Task<int> GetCurrentScoreAsync(Guid userId) =>
        await db.Set<TrustLedger>().Where(x => x.UserId == userId).OrderByDescending(x => x.CreatedAtUtc)
            .Select(x => (int?)x.RunningTrustScore).FirstOrDefaultAsync() ?? 50;
}
