using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using RentaTool.Modules.Escrow.Application.Services;

namespace RentaTool.Modules.Escrow.Infrastructure;

public static class EscrowModuleExtensions
{
    public static IServiceCollection AddEscrowModule(this IServiceCollection services)
    {
        services.AddScoped<IEscrowService, EscrowService>();
        services.AddScoped<IClaimService, ClaimService>();
        services.AddHttpClient("AIService", (sp, client) =>
        {
            var config = sp.GetRequiredService<IConfiguration>();
            var baseUrl = config["AiService:BaseUrl"] ?? config["AiService__BaseUrl"] ?? "http://localhost:8000";
            client.BaseAddress = new Uri(baseUrl);
        });
        return services;
    }
}
