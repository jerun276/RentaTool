using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.IdentityModel.Tokens;
using RentaTool.Modules.Identity.Application.Services;
using RentaTool.Modules.Identity.Security;

namespace RentaTool.Modules.Identity.Infrastructure;
public static class IdentityModuleExtensions
{
    public static IServiceCollection AddIdentityModule(this IServiceCollection services, IConfiguration config)
    {
        var key = Encoding.UTF8.GetBytes(config["Jwt:Key"] ?? "RentaTool-development-key-change-before-production-2026!");
        services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme).AddJwtBearer(options => options.TokenValidationParameters = new TokenValidationParameters { ValidateIssuer = true, ValidIssuer = config["Jwt:Issuer"] ?? "RentaTool", ValidateAudience = true, ValidAudience = config["Jwt:Audience"] ?? "RentaToolClients", ValidateLifetime = true, ValidateIssuerSigningKey = true, IssuerSigningKey = new SymmetricSecurityKey(key), ClockSkew = TimeSpan.Zero });
        services.AddAuthorization(); services.AddScoped<IAuthService, AuthService>(); services.AddScoped<IKycService, KycService>(); services.AddScoped<IVerificationService, VerificationService>(); services.AddScoped<ITrustScoreService, TrustScoreService>(); services.AddSingleton<ITokenService, JwtTokenService>(); services.AddHostedService<IdentityDevelopmentSeedService>(); return services;
    }
}
