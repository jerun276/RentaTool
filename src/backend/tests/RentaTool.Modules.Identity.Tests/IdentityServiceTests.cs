using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using RentaTool.Modules.Identity.Application.Dtos;
using RentaTool.Modules.Identity.Application.Services;
using RentaTool.Modules.Identity.Domain;
using RentaTool.Modules.Identity.Security;
using RentaTool.Shared.Infrastructure.Persistence;
using RentaTool.Shared.Kernel.Domain;

namespace RentaTool.Modules.Identity.Tests;

public class AuthServiceTests
{
    [Fact]
    public async Task Register_creates_user_role_and_initial_trust_ledger()
    {
        await using var db = CreateDb(); var service = new AuthService(db, Tokens());
        var result = await service.RegisterAsync(new("Asha Perera", "asha@example.com", "SecurePass123", "Renter", "0771234567"));
        Assert.Equal("Renter", result.Role); Assert.Single(await db.Set<User>().ToListAsync()); Assert.Single(await db.Set<UserRoleAssignment>().ToListAsync());
        var ledger = Assert.Single(await db.Set<TrustLedger>().ToListAsync()); Assert.Equal(50, ledger.RunningTrustScore);
    }
    [Fact]
    public async Task Login_rejects_wrong_password()
    {
        await using var db = CreateDb(); var service = new AuthService(db, Tokens());
        await service.RegisterAsync(new("Asha", "asha@example.com", "SecurePass123", "Owner", "0771234567"));
        Assert.Null(await service.LoginAsync(new("asha@example.com", "incorrect-password")));
    }
    [Fact]
    public async Task Login_returns_a_jwt_for_valid_credentials()
    {
        await using var db = CreateDb(); var service = new AuthService(db, Tokens());
        await service.RegisterAsync(new("Asha", "asha@example.com", "SecurePass123", "Owner", "0771234567"));
        var result = await service.LoginAsync(new("ASHA@example.com", "SecurePass123"));
        Assert.NotNull(result); Assert.NotEmpty(result.AccessToken); Assert.NotEmpty(result.RefreshToken);
    }
    [Fact]
    public async Task Register_rejects_a_duplicate_email_case_insensitively()
    {
        await using var db = CreateDb(); var service = new AuthService(db, Tokens());
        await service.RegisterAsync(new("Asha", "asha@example.com", "SecurePass123", "Renter", "0771234567"));
        await Assert.ThrowsAsync<InvalidOperationException>(() => service.RegisterAsync(new("Other", "ASHA@example.com", "SecurePass456", "Owner", "0777654321")));
    }
    [Fact]
    public async Task Register_does_not_allow_public_admin_creation()
    {
        await using var db = CreateDb(); var service = new AuthService(db, Tokens());
        await Assert.ThrowsAsync<ArgumentException>(() => service.RegisterAsync(new("Admin", "admin@example.com", "SecurePass123", "Admin", "0771234567")));
    }
    [Fact]
    public async Task Access_token_contains_the_authenticated_user_and_role_claims()
    {
        await using var db = CreateDb(); var service = new AuthService(db, Tokens());
        var response = await service.RegisterAsync(new("Asha", "asha@example.com", "SecurePass123", "Owner", "0771234567"));
        var token = new JwtSecurityTokenHandler().ReadJwtToken(response.AccessToken);
        Assert.Equal(response.UserId.ToString(), token.Claims.Single(x => x.Type == ClaimTypes.NameIdentifier).Value);
        Assert.Equal("Owner", token.Claims.Single(x => x.Type == ClaimTypes.Role).Value);
    }
    [Theory]
    [InlineData("NIC", "not-a-nic")]
    [InlineData("DrivingLicense", "bad!")]
    [InlineData("Passport", "AB123456")]
    public async Task Kyc_submission_rejects_an_invalid_document(string documentType, string documentNumber)
    {
        await using var db = CreateDb(); var identity = new AuthService(db, Tokens()); var user = await identity.RegisterAsync(new("Asha", "asha@example.com", "SecurePass123", "Renter", "0771234567"));
        await Assert.ThrowsAsync<ArgumentException>(() => new KycService(db).SubmitAsync(user.UserId, new(documentType, documentNumber, "https://files.example/front.jpg", null)));
    }
    [Fact]
    public async Task Kyc_submission_rejects_a_nonexistent_user()
    {
        await using var db = CreateDb();
        await Assert.ThrowsAsync<KeyNotFoundException>(() => new KycService(db).SubmitAsync(Guid.NewGuid(), new("NIC", "199012345678", "https://files.example/front.jpg", null)));
    }
    [Fact]
    public async Task Kyc_approval_verifies_user_and_increases_trust_score()
    {
        await using var db = CreateDb(); var identity = new AuthService(db, Tokens()); var user = await identity.RegisterAsync(new("Asha", "asha@example.com", "SecurePass123", "Renter", "0771234567"));
        var kyc = new KycService(db); await kyc.SubmitAsync(user.UserId, new("NIC", "199012345678", "https://files.example/nic-front.jpg", null));
        var reviewed = await new VerificationService(db).ReviewAsync(user.UserId, Guid.NewGuid(), new(KycStatus.Approved, null));
        Assert.Equal(KycStatus.Approved, reviewed.Status); Assert.True((await db.Set<User>().FindAsync(user.UserId))!.IsVerified);
        Assert.Equal(75, (await new TrustScoreService(db).GetAsync(user.UserId))!.Score);
    }
    [Fact]
    public async Task Kyc_rejection_requires_a_reason()
    {
        await using var db = CreateDb(); var identity = new AuthService(db, Tokens()); var user = await identity.RegisterAsync(new("Asha", "asha@example.com", "SecurePass123", "Renter", "0771234567"));
        var kyc = new KycService(db); await kyc.SubmitAsync(user.UserId, new("NIC", "199012345678", "https://files.example/nic-front.jpg", null));
        await Assert.ThrowsAsync<ArgumentException>(() => new VerificationService(db).ReviewAsync(user.UserId, Guid.NewGuid(), new(KycStatus.Rejected, null)));
    }
    [Fact]
    public async Task Verification_rejects_a_user_without_a_kyc_submission()
    {
        await using var db = CreateDb(); var auth = new AuthService(db, Tokens()); var user = await auth.RegisterAsync(new("Asha", "asha@example.com", "SecurePass123", "Renter", "0771234567"));
        await Assert.ThrowsAsync<KeyNotFoundException>(() => new VerificationService(db).ReviewAsync(user.UserId, Guid.NewGuid(), new(KycStatus.Approved, null)));
    }
    [Fact]
    public async Task Kyc_rejection_preserves_the_admin_audit_trail_without_verifying_user()
    {
        await using var db = CreateDb(); var identity = new AuthService(db, Tokens()); var user = await identity.RegisterAsync(new("Asha", "asha@example.com", "SecurePass123", "Renter", "0771234567"));
        var kyc = new KycService(db); await kyc.SubmitAsync(user.UserId, new("NIC", "199012345678", "https://files.example/nic-front.jpg", null)); var adminId = Guid.NewGuid();
        var reviewed = await new VerificationService(db).ReviewAsync(user.UserId, adminId, new(KycStatus.Rejected, "Document image is unreadable."));
        Assert.Equal(KycStatus.Rejected, reviewed.Status); Assert.Equal("Document image is unreadable.", reviewed.RejectionReason);
        var persisted = Assert.Single(await db.Set<KycRecord>().ToListAsync()); Assert.Equal(adminId, persisted.VerifiedByAdminId); Assert.False((await db.Set<User>().FindAsync(user.UserId))!.IsVerified);
    }
    [Fact]
    public async Task Trust_score_returns_null_when_no_ledger_exists()
    {
        await using var db = CreateDb();
        Assert.Null(await new TrustScoreService(db).GetAsync(Guid.NewGuid()));
    }
    private static AppDbContext CreateDb() => new(new DbContextOptionsBuilder<AppDbContext>().UseInMemoryDatabase(Guid.NewGuid().ToString()).Options);
    private static ITokenService Tokens() => new JwtTokenService(new ConfigurationBuilder().AddInMemoryCollection(new Dictionary<string, string?> { ["Jwt:Key"] = "A-development-test-key-that-is-long-enough-for-HS256!" }).Build());
}
