using Microsoft.EntityFrameworkCore;
using RentaTool.Modules.Identity.Application.Dtos;
using RentaTool.Modules.Identity.Domain;
using RentaTool.Shared.Infrastructure.Persistence;
using RentaTool.Shared.Kernel.Domain;

namespace RentaTool.Modules.Identity.Application.Services;

public sealed class UserService(AppDbContext db) : IUserService
{
    public async Task<IReadOnlyList<UserSummaryDto>> GetUsersAsync(
        string? search,
        UserRole? role,
        bool? isActive,
        CancellationToken ct = default)
    {
        var query = db.Set<User>().AsNoTracking().AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim().ToLower();
            query = query.Where(u =>
                u.Name.ToLower().Contains(term) ||
                u.Email.ToLower().Contains(term) ||
                u.PhoneNumber.Contains(term));
        }

        if (role.HasValue)
        {
            query = query.Where(u => u.Role == role.Value);
        }

        if (isActive.HasValue)
        {
            query = query.Where(u => u.IsActive == isActive.Value);
        }

        var users = await query.OrderByDescending(u => u.CreatedAtUtc).ToListAsync(ct);
        if (users.Count == 0)
            return Array.Empty<UserSummaryDto>();

        var userIds = users.Select(u => u.Id).ToList();
        var trustLedgers = await db.Set<TrustLedger>()
            .AsNoTracking()
            .Where(t => userIds.Contains(t.UserId))
            .OrderByDescending(t => t.CreatedAtUtc)
            .ToListAsync(ct);

        var scoreMap = trustLedgers
            .GroupBy(t => t.UserId)
            .ToDictionary(g => g.Key, g => g.First().RunningTrustScore);

        return users.Select(u => new UserSummaryDto(
            u.Id,
            u.Name,
            u.Email,
            u.PhoneNumber,
            u.Role.ToString(),
            u.IsVerified,
            u.IsActive,
            u.SuspensionReason,
            scoreMap.GetValueOrDefault(u.Id, 50),
            u.CreatedAtUtc,
            u.UpdatedAtUtc
        )).ToList();
    }

    public async Task<UserSummaryDto?> GetUserByIdAsync(Guid id, CancellationToken ct = default)
    {
        var user = await db.Set<User>().AsNoTracking().SingleOrDefaultAsync(u => u.Id == id, ct);
        if (user is null) return null;

        var latestLedger = await db.Set<TrustLedger>()
            .AsNoTracking()
            .Where(t => t.UserId == id)
            .OrderByDescending(t => t.CreatedAtUtc)
            .FirstOrDefaultAsync(ct);

        var trustScore = latestLedger?.RunningTrustScore ?? 50;

        return new UserSummaryDto(
            user.Id,
            user.Name,
            user.Email,
            user.PhoneNumber,
            user.Role.ToString(),
            user.IsVerified,
            user.IsActive,
            user.SuspensionReason,
            trustScore,
            user.CreatedAtUtc,
            user.UpdatedAtUtc
        );
    }

    public async Task<UserSummaryDto> UpdateStatusAsync(
        Guid id,
        UpdateUserStatusRequestDto request,
        Guid adminId,
        CancellationToken ct = default)
    {
        var user = await db.Set<User>().SingleOrDefaultAsync(u => u.Id == id, ct);
        if (user is null)
            throw new KeyNotFoundException($"User with ID '{id}' was not found.");

        if (user.Id == adminId && !request.IsActive)
            throw new InvalidOperationException("Administrators cannot suspend their own account.");

        if (request.IsActive)
        {
            user.Activate();
        }
        else
        {
            user.Deactivate(request.Reason ?? "Administrative suspension");
        }

        await db.SaveChangesAsync(ct);
        return (await GetUserByIdAsync(id, ct))!;
    }

    public async Task<UserSummaryDto> UpdateRoleAsync(
        Guid id,
        UpdateUserRoleRequestDto request,
        Guid adminId,
        CancellationToken ct = default)
    {
        if (!Enum.TryParse<UserRole>(request.Role, true, out var newRole))
            throw new ArgumentException($"Invalid role '{request.Role}'. Must be Admin, Owner, or Renter.");

        var user = await db.Set<User>().SingleOrDefaultAsync(u => u.Id == id, ct);
        if (user is null)
            throw new KeyNotFoundException($"User with ID '{id}' was not found.");

        if (user.Id == adminId && newRole != UserRole.Admin)
            throw new InvalidOperationException("Administrators cannot revoke their own administrator role.");

        user.ChangeRole(newRole);

        // Sync UserRoleAssignment
        var existingAssignments = await db.Set<UserRoleAssignment>()
            .Where(a => a.UserId == user.Id)
            .ToListAsync(ct);

        if (existingAssignments.Count > 0)
        {
            db.Set<UserRoleAssignment>().RemoveRange(existingAssignments);
        }

        db.Set<UserRoleAssignment>().Add(new UserRoleAssignment(user.Id, newRole));

        await db.SaveChangesAsync(ct);
        return (await GetUserByIdAsync(id, ct))!;
    }
}
