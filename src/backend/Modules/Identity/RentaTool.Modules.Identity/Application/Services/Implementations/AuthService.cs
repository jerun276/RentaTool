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

        var user = new User(request.Name, email, PasswordHasher.Hash(request.Password), role, request.PhoneNumber);
        db.Set<User>().Add(user);
        db.Set<UserRoleAssignment>().Add(new UserRoleAssignment(user.Id, role));
        db.Set<TrustLedger>().Add(new TrustLedger(user.Id, 50, "Account created", "registration", 50));
        await db.SaveChangesAsync();
        return tokens.Create(user);
    }

    public async Task<TokenResponseDto?> LoginAsync(LoginRequestDto request)
    {
        var email = request.Email.Trim().ToLowerInvariant();
        var user = await db.Set<User>().SingleOrDefaultAsync(x => x.Email == email);
        return user is not null && PasswordHasher.Verify(request.Password, user.PasswordHash) ? tokens.Create(user) : null;
    }
}
