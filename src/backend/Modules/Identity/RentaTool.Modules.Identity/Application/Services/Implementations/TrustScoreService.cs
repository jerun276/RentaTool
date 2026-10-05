using Microsoft.EntityFrameworkCore;
using RentaTool.Modules.Identity.Application.Dtos;
using RentaTool.Modules.Identity.Domain;
using RentaTool.Shared.Infrastructure.Persistence;

namespace RentaTool.Modules.Identity.Application.Services;

public sealed class TrustScoreService(AppDbContext db) : ITrustScoreService
{
    public async Task<TrustScoreResponseDto?> GetAsync(Guid userId)
    {
        var entries = await db.Set<TrustLedger>().Where(x => x.UserId == userId).OrderByDescending(x => x.CreatedAtUtc).ToListAsync();
        return entries.Count == 0 ? null : new TrustScoreResponseDto(userId, entries[0].RunningTrustScore, entries.Count, DateTime.UtcNow);
    }
}
