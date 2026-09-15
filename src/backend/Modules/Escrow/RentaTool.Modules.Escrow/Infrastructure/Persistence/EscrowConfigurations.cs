using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using RentaTool.Modules.Escrow.Domain;

namespace RentaTool.Modules.Escrow.Infrastructure.Persistence;

public sealed class EscrowHoldConfiguration : IEntityTypeConfiguration<EscrowHold>
{
    public void Configure(EntityTypeBuilder<EscrowHold> builder)
    {
        builder.ToTable("escrow_holds");
        builder.HasKey(e => e.Id);
        builder.Property(e => e.DepositAmount).HasPrecision(18, 2).IsRequired();
        builder.Property(e => e.PreAuthTransactionId).HasMaxLength(100).IsRequired();
        builder.Property(e => e.Status).HasConversion<string>().HasMaxLength(50).IsRequired();
        builder.HasIndex(e => e.BookingId);
        builder.HasIndex(e => e.Status);
    }
}

public sealed class DamageClaimConfiguration : IEntityTypeConfiguration<DamageClaim>
{
    public void Configure(EntityTypeBuilder<DamageClaim> builder)
    {
        builder.ToTable("damage_claims");
        builder.HasKey(c => c.Id);
        builder.Property(c => c.DamageDescription).HasMaxLength(2000).IsRequired();
        builder.Property(c => c.EvidencePhotosJson).HasColumnType("jsonb").IsRequired();
        builder.Property(c => c.ProposedDeduction).HasPrecision(18, 2).IsRequired();
        builder.Property(c => c.FinalDeduction).HasPrecision(18, 2);
        builder.Property(c => c.Status).HasConversion<string>().HasMaxLength(50).IsRequired();
        builder.Property(c => c.AdjudicationNotes).HasMaxLength(1000);
        builder.HasIndex(c => c.BookingId);
        builder.HasIndex(c => c.Status);
    }
}

public sealed class PaymentConfiguration : IEntityTypeConfiguration<Payment>
{
    public void Configure(EntityTypeBuilder<Payment> builder)
    {
        builder.ToTable("payments");
        builder.HasKey(p => p.Id);
        builder.Property(p => p.Amount).HasPrecision(18, 2).IsRequired();
        builder.Property(p => p.PaymentType).HasConversion<string>().HasMaxLength(50).IsRequired();
        builder.Property(p => p.Status).HasConversion<string>().HasMaxLength(50).IsRequired();
        builder.Property(p => p.GatewayTransactionRef).HasMaxLength(100).IsRequired();
        builder.HasIndex(p => p.BookingId);
        builder.HasIndex(p => p.ClaimId);
    }
}

public sealed class WorkflowStateAuditConfiguration : IEntityTypeConfiguration<WorkflowStateAudit>
{
    public void Configure(EntityTypeBuilder<WorkflowStateAudit> builder)
    {
        builder.ToTable("workflow_state_audits");
        builder.HasKey(w => w.Id);
        builder.Property(w => w.WorkflowId).HasMaxLength(100).IsRequired();
        builder.Property(w => w.CurrentState).HasMaxLength(50).IsRequired();
        builder.Property(w => w.AgentId).HasMaxLength(100).IsRequired();
        builder.Property(w => w.ToolCallsLog).HasColumnType("jsonb").IsRequired();
        builder.Property(w => w.DecisionSummary).HasMaxLength(2000).IsRequired();
        builder.Property(w => w.HumanReviewDecision).HasMaxLength(50);
        builder.HasIndex(w => w.ClaimId);
        builder.HasIndex(w => w.WorkflowId);
    }
}
