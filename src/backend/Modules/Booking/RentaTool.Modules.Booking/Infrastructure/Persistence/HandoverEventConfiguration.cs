using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using RentaTool.Modules.Booking.Domain;

namespace RentaTool.Modules.Booking.Infrastructure.Persistence;

public class HandoverEventConfiguration : IEntityTypeConfiguration<HandoverEvent>
{
    public void Configure(EntityTypeBuilder<HandoverEvent> builder)
    {
        builder.ToTable("handover_events");

        builder.HasKey(h => h.Id);

        builder.Property(h => h.BookingId)
            .IsRequired();

        builder.Property(h => h.EventType)
            .HasConversion<string>()
            .HasMaxLength(50)
            .IsRequired();

        builder.Property(h => h.HandoverTokenHash)
            .IsRequired()
            .HasMaxLength(128);

        builder.Property(h => h.IsConfirmed)
            .IsRequired();

        builder.Property(h => h.ExpiresAtUtc)
            .IsRequired();

        builder.HasOne(h => h.GeoLocation)
            .WithMany()
            .HasForeignKey(h => h.GeoLocationId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasIndex(h => h.BookingId);
        builder.HasIndex(h => h.HandoverTokenHash);
        builder.HasIndex(h => h.IsConfirmed);
    }
}
