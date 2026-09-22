using RentaTool.Modules.Identity.Application.Dtos;
using RentaTool.Shared.Kernel.Domain;

namespace RentaTool.Modules.Identity.Application.Services;

public interface IUserService
{
    Task<IReadOnlyList<UserSummaryDto>> GetUsersAsync(string? search, UserRole? role, bool? isActive, CancellationToken ct = default);
    Task<UserSummaryDto?> GetUserByIdAsync(Guid id, CancellationToken ct = default);
    Task<UserSummaryDto> UpdateStatusAsync(Guid id, UpdateUserStatusRequestDto request, Guid adminId, CancellationToken ct = default);
    Task<UserSummaryDto> UpdateRoleAsync(Guid id, UpdateUserRoleRequestDto request, Guid adminId, CancellationToken ct = default);
}
