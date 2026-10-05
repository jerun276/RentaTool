using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using RentaTool.Modules.Identity.Application.Dtos;
using RentaTool.Modules.Identity.Domain;

namespace RentaTool.Modules.Identity.Security;

public sealed class JwtTokenService(IConfiguration config) : ITokenService
{
    public TokenResponseDto Create(User user)
    {
        var expires = DateTime.UtcNow.AddMinutes(60);
        var signingKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(config["Jwt:Key"] ?? "RentaTool-development-key-change-before-production-2026!"));
        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(ClaimTypes.Name, user.Name),
            new Claim(ClaimTypes.Role, user.Role.ToString())
        };
        var token = new JwtSecurityToken(config["Jwt:Issuer"] ?? "RentaTool", config["Jwt:Audience"] ?? "RentaToolClients", claims, expires: expires, signingCredentials: new SigningCredentials(signingKey, SecurityAlgorithms.HmacSha256));
        return new TokenResponseDto(user.Id, user.Name, user.Role.ToString(), new JwtSecurityTokenHandler().WriteToken(token), Convert.ToBase64String(RandomNumberGenerator.GetBytes(48)), expires);
    }
}
