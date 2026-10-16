using Microsoft.EntityFrameworkCore;
using RentaTool.Modules.Identity.Application.Dtos;
using RentaTool.Modules.Identity.Domain;
using RentaTool.Modules.Identity.Security;
using RentaTool.Shared.Infrastructure.Persistence;
using RentaTool.Shared.Kernel.Domain;

namespace RentaTool.Modules.Identity.Application.Services;

public sealed class AuthService(AppDbContext db, ITokenService tokens) : IAuthService
{
    public async Task<TokenResponseDto> RegisterAsync(RegisterRequestDto request)
    {
        if (!Enum.TryParse<UserRole>(request.Role, true, out var role) || role == UserRole.Admin)
            throw new ArgumentException("Role must be Renter or Owner.");

        var email = request.Email.Trim().ToLowerInvariant();
        if (await db.Set<User>().AnyAsync(x => x.Email == email))
            throw new InvalidOperationException("An account with this email already exists.");

        var phone = (request.PhoneNumber ?? string.Empty).Replace(" ", "").Replace("-", "").Trim();
        if (phone.Length > 0 && await db.Set<User>().AnyAsync(x => x.PhoneNumber.Replace(" ", "").Replace("-", "") == phone))
            throw new InvalidOperationException("An account with this phone number already exists.");

        var user = new User(request.Name, email, PasswordHasher.Hash(request.Password), role, request.PhoneNumber);
        var token = tokens.Create(user);
        user.SetRefreshToken(token.RefreshToken, DateTime.UtcNow.AddDays(14));
        db.Set<User>().Add(user);
        db.Set<UserRoleAssignment>().Add(new UserRoleAssignment(user.Id, role));
        db.Set<TrustLedger>().Add(new TrustLedger(user.Id, 50, "Account created", "registration", 50));
        await db.SaveChangesAsync();
        return token;
    }

    public async Task<TokenResponseDto?> LoginAsync(LoginRequestDto request)
    {
        var email = request.Email.Trim().ToLowerInvariant();
        var user = await db.Set<User>().SingleOrDefaultAsync(x => x.Email == email);
        if (user is null || !PasswordHasher.Verify(request.Password, user.PasswordHash))
            return null;

        if (!user.IsActive)
            throw new InvalidOperationException($"Account is suspended: {user.SuspensionReason ?? "Administrative action"}. Please contact support.");

        var token = tokens.Create(user);
        user.SetRefreshToken(token.RefreshToken, DateTime.UtcNow.AddDays(14));
        await db.SaveChangesAsync();
        return token;
    }

    public async Task<TokenResponseDto?> RefreshTokenAsync(string refreshToken)
    {
        if (string.IsNullOrWhiteSpace(refreshToken))
            return null;

        var tokenClean = refreshToken.Trim();
        var user = await db.Set<User>().SingleOrDefaultAsync(x => x.RefreshToken == tokenClean);
        if (user is null)
            return null;

        if (user.RefreshTokenExpiresAtUtc.HasValue && user.RefreshTokenExpiresAtUtc.Value < DateTime.UtcNow)
            return null;

        if (!user.IsActive)
            throw new InvalidOperationException($"Account is suspended: {user.SuspensionReason ?? "Administrative action"}. Please contact support.");

        var newToken = tokens.Create(user);
        user.SetRefreshToken(newToken.RefreshToken, DateTime.UtcNow.AddDays(14));
        await db.SaveChangesAsync();

        return newToken;
    }
}

