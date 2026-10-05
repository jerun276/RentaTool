using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using RentaTool.Modules.Catalog.Domain;

namespace RentaTool.Modules.Catalog.Infrastructure.Persistence;

public class EquipmentConfiguration : IEntityTypeConfiguration<Equipment>
{
    public void Configure(EntityTypeBuilder<Equipment> builder)
    {
        builder.ToTable("equipment");

        builder.HasKey(e => e.Id);

        builder.Property(e => e.OwnerId)
            .IsRequired();

        builder.Property(e => e.Title)
            .IsRequired()
            .HasMaxLength(150);

        builder.Property(e => e.Description)
            .HasMaxLength(2000);

        builder.Property(e => e.DailyRate)
            .HasPrecision(18, 2)
            .IsRequired();

        builder.Property(e => e.ReplacementValue)
            .HasPrecision(18, 2)
            .IsRequired();

        builder.Property(e => e.Status)
            .HasConversion<string>()
            .HasMaxLength(50)
            .IsRequired();

        builder.Property(e => e.Location)
            .HasMaxLength(150);

        builder.Property(e => e.SpecificationsJson)
            .HasColumnType("jsonb")
            .HasDefaultValue("{}");

        builder.Property(e => e.TotalRentalDaysAccumulated)
            .HasDefaultValue(0);

        builder.Property(e => e.RequiresMaintenanceCheck)
            .HasDefaultValue(false);

        builder.HasOne(e => e.Category)
            .WithMany()
            .HasForeignKey(e => e.CategoryId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasMany(e => e.Images)
            .WithOne(i => i.Equipment)
            .HasForeignKey(i => i.EquipmentId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(e => e.InspectionLogs)
            .WithOne(l => l.Equipment)
            .HasForeignKey(l => l.EquipmentId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(e => e.OwnerId);
        builder.HasIndex(e => e.CategoryId);
        builder.HasIndex(e => e.Status);
        builder.HasIndex(e => e.RequiresMaintenanceCheck);
    }
}
