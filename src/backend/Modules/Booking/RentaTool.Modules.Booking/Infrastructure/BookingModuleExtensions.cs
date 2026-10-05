using Microsoft.Extensions.DependencyInjection;
using RentaTool.Modules.Booking.Application.Services;

namespace RentaTool.Modules.Booking.Infrastructure;

public static class BookingModuleExtensions
{
    public static IServiceCollection AddBookingModule(this IServiceCollection services)
    {
        services.AddScoped<IBookingService, BookingService>();
        services.AddScoped<IHandoverTokenService, HandoverTokenService>();
        services.AddScoped<IScheduleExtensionService, ScheduleExtensionService>();

        return services;
    }
}
