using Microsoft.Extensions.DependencyInjection;
using RentaTool.Modules.Escrow.Application.Services;

namespace RentaTool.Modules.Escrow.Infrastructure;

public static class EscrowModuleExtensions
{
    public static IServiceCollection AddEscrowModule(this IServiceCollection services)
    {
        services.AddScoped<IEscrowService, EscrowService>();
        services.AddScoped<IClaimService, ClaimService>();
        return services;
    }
}
