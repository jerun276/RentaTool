using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using RentaTool.Modules.Booking.Domain;

namespace RentaTool.Modules.Booking.Infrastructure.Persistence;

public class BookingScheduleConfiguration : IEntityTypeConfiguration<BookingSchedule>
{
    public void Configure(EntityTypeBuilder<BookingSchedule> builder)
    {
        builder.ToTable("booking_schedules");

        builder.HasKey(s => s.Id);

        builder.Property(s => s.EquipmentId)
            .IsRequired();

        builder.Property(s => s.BookingId)
            .IsRequired();

        builder.Property(s => s.BlockedStartDate)
            .IsRequired();

        builder.Property(s => s.BlockedEndDate)
            .IsRequired();

        builder.Property(s => s.Reason)
            .HasMaxLength(200);

        builder.HasIndex(s => s.EquipmentId);
        builder.HasIndex(s => new { s.EquipmentId, s.BlockedStartDate, s.BlockedEndDate });
    }
}
