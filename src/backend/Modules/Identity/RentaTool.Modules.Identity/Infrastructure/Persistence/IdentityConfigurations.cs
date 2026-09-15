using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using RentaTool.Modules.Identity.Domain;

namespace RentaTool.Modules.Identity.Infrastructure.Persistence;

public sealed class UserConfiguration : IEntityTypeConfiguration<User>
{
    public void Configure(EntityTypeBuilder<User> builder)
    {
        builder.ToTable("users"); builder.HasKey(x => x.Id); builder.Property(x => x.Name).HasMaxLength(120).IsRequired(); builder.Property(x => x.Email).HasMaxLength(255).IsRequired(); builder.HasIndex(x => x.Email).IsUnique(); builder.Property(x => x.PasswordHash).HasMaxLength(255).IsRequired(); builder.Property(x => x.PhoneNumber).HasMaxLength(25).IsRequired(); builder.Property(x => x.Role).HasConversion<string>().HasMaxLength(20).IsRequired();
    }
}
public sealed class UserRoleAssignmentConfiguration : IEntityTypeConfiguration<UserRoleAssignment>
{ public void Configure(EntityTypeBuilder<UserRoleAssignment> builder) { builder.ToTable("user_roles"); builder.HasKey(x => x.Id); builder.Property(x => x.Role).HasConversion<string>().HasMaxLength(20); builder.HasIndex(x => new { x.UserId, x.Role }).IsUnique(); } }
public sealed class KycRecordConfiguration : IEntityTypeConfiguration<KycRecord>
{ public void Configure(EntityTypeBuilder<KycRecord> builder) { builder.ToTable("kyc_records"); builder.HasKey(x => x.Id); builder.Property(x => x.DocumentType).HasMaxLength(30).IsRequired(); builder.Property(x => x.DocumentNumber).HasMaxLength(30).IsRequired(); builder.Property(x => x.FrontImageUrl).HasMaxLength(2048).IsRequired(); builder.Property(x => x.BackImageUrl).HasMaxLength(2048); builder.Property(x => x.Status).HasConversion<string>().HasMaxLength(20); builder.Property(x => x.RejectionReason).HasMaxLength(500); builder.HasIndex(x => x.UserId); builder.HasIndex(x => new { x.Status, x.CreatedAtUtc }); } }
public sealed class TrustLedgerConfiguration : IEntityTypeConfiguration<TrustLedger>
{ public void Configure(EntityTypeBuilder<TrustLedger> builder) { builder.ToTable("trust_ledger"); builder.HasKey(x => x.Id); builder.Property(x => x.Reason).HasMaxLength(250).IsRequired(); builder.Property(x => x.TransactionReference).HasMaxLength(100); builder.HasIndex(x => new { x.UserId, x.CreatedAtUtc }); } }
