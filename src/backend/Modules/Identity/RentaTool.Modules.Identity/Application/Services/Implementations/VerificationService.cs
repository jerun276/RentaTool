using Microsoft.EntityFrameworkCore;
using RentaTool.Modules.Identity.Application.Dtos;
using RentaTool.Modules.Identity.Domain;
using RentaTool.Shared.Infrastructure.Persistence;
using RentaTool.Shared.Kernel.Domain;

namespace RentaTool.Modules.Identity.Application.Services;

public sealed class VerificationService(AppDbContext db) : IVerificationService
{
    public async Task<IReadOnlyList<AdminKycReviewDto>> GetReviewQueueAsync(KycStatus? status, string? search)
    {
        if (status.HasValue && !Enum.IsDefined(status.Value))
            throw new ArgumentException("KYC status is invalid.");

        var query = from record in db.Set<KycRecord>().AsNoTracking()
                    join user in db.Set<User>().AsNoTracking() on record.UserId equals user.Id
                    select new { record, user };

        if (status.HasValue)
            query = query.Where(x => x.record.Status == status.Value);
        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim().ToLower();
            query = query.Where(x => x.user.Name.ToLower().Contains(term)
                                     || x.user.Email.ToLower().Contains(term)
                                     || x.record.DocumentNumber.ToLower().Contains(term));
        }

        return await query.OrderBy(x => x.record.Status == KycStatus.Pending ? 0 : 1)
            .ThenByDescending(x => x.record.CreatedAtUtc)
            .Select(x => new AdminKycReviewDto(
                x.record.Id, x.user.Id, x.user.Name, x.user.Email, x.user.PhoneNumber, x.user.Role,
                x.record.DocumentType, x.record.DocumentNumber, x.record.FrontImageUrl, x.record.BackImageUrl,
                x.record.Status, x.record.CreatedAtUtc, x.record.VerifiedByAdminId, x.record.VerifiedAtUtc,
                x.record.RejectionReason))
            .ToListAsync();
    }

    public async Task<AdminKycReviewDto> GetSubmissionAsync(Guid userId)
    {
        var submission = await (from record in db.Set<KycRecord>().AsNoTracking()
                                join user in db.Set<User>().AsNoTracking() on record.UserId equals user.Id
                                where record.UserId == userId
                                orderby record.CreatedAtUtc descending
                                select new { record, user }).FirstOrDefaultAsync()
            ?? throw new KeyNotFoundException("No KYC record was found.");

        return ToAdminDto(submission.record, submission.user);
    }

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

    private static AdminKycReviewDto ToAdminDto(KycRecord record, User user) => new(
        record.Id, user.Id, user.Name, user.Email, user.PhoneNumber, user.Role,
        record.DocumentType, record.DocumentNumber, record.FrontImageUrl, record.BackImageUrl,
        record.Status, record.CreatedAtUtc, record.VerifiedByAdminId, record.VerifiedAtUtc, record.RejectionReason);
}
