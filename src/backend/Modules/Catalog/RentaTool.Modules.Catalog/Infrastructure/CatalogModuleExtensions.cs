using Microsoft.Extensions.DependencyInjection;
using RentaTool.Modules.Catalog.Application.Services;

namespace RentaTool.Modules.Catalog.Infrastructure;

public static class CatalogModuleExtensions
{
    public static IServiceCollection AddCatalogModule(this IServiceCollection services)
    {
        services.AddScoped<IEquipmentService, EquipmentService>();
        services.AddScoped<IInspectionService, InspectionService>();
        services.AddScoped<IBatchAvailabilityService, BatchAvailabilityService>();

        return services;
    }
}
