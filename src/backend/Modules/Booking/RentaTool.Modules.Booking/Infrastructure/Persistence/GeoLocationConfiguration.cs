using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using RentaTool.Modules.Booking.Domain;

namespace RentaTool.Modules.Booking.Infrastructure.Persistence;

public class GeoLocationConfiguration : IEntityTypeConfiguration<GeoLocation>
{
    public void Configure(EntityTypeBuilder<GeoLocation> builder)
    {
        builder.ToTable("geo_locations");

        builder.HasKey(g => g.Id);

        builder.Property(g => g.Latitude)
            .IsRequired();

        builder.Property(g => g.Longitude)
            .IsRequired();

        builder.Property(g => g.AddressLine)
            .HasMaxLength(500);

        builder.Property(g => g.City)
            .HasMaxLength(100);

        builder.Property(g => g.PostalCode)
            .HasMaxLength(20);
    }
}
