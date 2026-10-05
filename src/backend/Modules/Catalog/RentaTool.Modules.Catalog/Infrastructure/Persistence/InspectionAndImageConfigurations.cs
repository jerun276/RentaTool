using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using RentaTool.Modules.Catalog.Domain;

namespace RentaTool.Modules.Catalog.Infrastructure.Persistence;

public class InspectionLogConfiguration : IEntityTypeConfiguration<InspectionLog>
{
    public void Configure(EntityTypeBuilder<InspectionLog> builder)
    {
        builder.ToTable("inspection_logs");

        builder.HasKey(l => l.Id);

        builder.Property(l => l.EquipmentId)
            .IsRequired();

        builder.Property(l => l.InspectorUserId)
            .IsRequired();

        builder.Property(l => l.Type)
            .HasConversion<string>()
            .HasMaxLength(50)
            .IsRequired();

        builder.Property(l => l.Severity)
            .HasConversion<string>()
            .HasMaxLength(50)
            .IsRequired();

        builder.Property(l => l.ConditionNotes)
            .HasMaxLength(2000);

        builder.Property(l => l.PhotosJson)
            .HasColumnType("jsonb")
            .HasDefaultValue("[]");

        builder.HasIndex(l => l.EquipmentId);
        builder.HasIndex(l => l.BookingId);
        builder.HasIndex(l => l.CreatedAtUtc);
    }
}

public class ToolImageConfiguration : IEntityTypeConfiguration<ToolImage>
{
    public void Configure(EntityTypeBuilder<ToolImage> builder)
    {
        builder.ToTable("tool_images");

        builder.HasKey(i => i.Id);

        builder.Property(i => i.EquipmentId)
            .IsRequired();

        builder.Property(i => i.ImageUrl)
            .IsRequired()
            .HasMaxLength(500);

        builder.Property(i => i.Angle)
            .HasMaxLength(50)
            .HasDefaultValue("General");

        builder.Property(i => i.IsPrimary)
            .HasDefaultValue(false);

        builder.HasIndex(i => i.EquipmentId);
    }
}
