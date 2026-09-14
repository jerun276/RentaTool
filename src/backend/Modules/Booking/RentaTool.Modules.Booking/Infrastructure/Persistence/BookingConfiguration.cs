using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using RentaTool.Modules.Booking.Domain;

namespace RentaTool.Modules.Booking.Infrastructure.Persistence;

public class BookingConfiguration : IEntityTypeConfiguration<Domain.Booking>
{
    public void Configure(EntityTypeBuilder<Domain.Booking> builder)
    {
        builder.ToTable("bookings");

        builder.HasKey(b => b.Id);

        builder.Property(b => b.EquipmentId)
            .IsRequired();

        builder.Property(b => b.RenterId)
            .IsRequired();

        builder.Property(b => b.OwnerId)
            .IsRequired();

        builder.Property(b => b.StartDate)
            .IsRequired();

        builder.Property(b => b.EndDate)
            .IsRequired();

        builder.Property(b => b.DailyRate)
            .HasPrecision(18, 2)
            .IsRequired();

        builder.Property(b => b.TotalRentalFee)
            .HasPrecision(18, 2)
            .IsRequired();

        builder.Property(b => b.Status)
            .HasConversion<string>()
            .HasMaxLength(50)
            .IsRequired();

        builder.Property(b => b.CancellationReason)
            .HasMaxLength(500);

        builder.HasMany(b => b.HandoverEvents)
            .WithOne(h => h.Booking)
            .HasForeignKey(h => h.BookingId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(b => b.BookingSchedules)
            .WithOne(s => s.Booking)
            .HasForeignKey(s => s.BookingId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(b => b.EquipmentId);
        builder.HasIndex(b => b.RenterId);
        builder.HasIndex(b => b.OwnerId);
        builder.HasIndex(b => b.Status);
        builder.HasIndex(b => new { b.StartDate, b.EndDate });
    }
}
