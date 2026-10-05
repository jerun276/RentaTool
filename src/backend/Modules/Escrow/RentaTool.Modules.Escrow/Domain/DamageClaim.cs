using RentaTool.Shared.Kernel.Domain;

namespace RentaTool.Modules.Escrow.Domain;

public class DamageClaim : BaseEntity
{
    public Guid BookingId { get; private set; }
    public Guid FiledByUserId { get; private set; }
    public string DamageDescription { get; private set; }
    public string EvidencePhotosJson { get; private set; }
    public decimal ProposedDeduction { get; private set; }
    public decimal? FinalDeduction { get; private set; }
    public ClaimStatus Status { get; private set; }
    public string? AdjudicationNotes { get; private set; }
    public Guid? AdjudicatedByUserId { get; private set; }
    public DateTime? AdjudicatedAtUtc { get; private set; }

    // Parameterless constructor for EF Core
    protected DamageClaim() { }

    public DamageClaim(
        Guid bookingId,
        Guid filedByUserId,
        string damageDescription,
        string evidencePhotosJson)
    {
        if (bookingId == Guid.Empty)
            throw new ArgumentException("BookingId cannot be empty.", nameof(bookingId));

        if (string.IsNullOrWhiteSpace(damageDescription))
            throw new ArgumentException("DamageDescription cannot be empty.", nameof(damageDescription));

        BookingId = bookingId;
        FiledByUserId = filedByUserId;
        DamageDescription = damageDescription;
        EvidencePhotosJson = string.IsNullOrWhiteSpace(evidencePhotosJson) ? "[]" : evidencePhotosJson;
        ProposedDeduction = 0m;
        Status = ClaimStatus.Filed;
    }

    public void SubmitForAIEvaluation()
    {
        Status = ClaimStatus.UnderAIEvaluation;
        MarkUpdated();
    }

    public void SetAIEvaluationResult(decimal proposedDeduction)
    {
        ProposedDeduction = Math.Max(0m, proposedDeduction);
        Status = ClaimStatus.PendingStaffApproval;
        MarkUpdated();
    }

    public void Adjudicate(string decision, decimal? revisedDeduction, Guid adjudicatorId, string? notes)
    {
        if (Status != ClaimStatus.PendingStaffApproval && Status != ClaimStatus.UnderAIEvaluation && Status != ClaimStatus.Filed)
            throw new InvalidOperationException($"Cannot adjudicate claim in status {Status}.");

        decision = decision.Trim();
        AdjudicatedByUserId = adjudicatorId;
        AdjudicatedAtUtc = DateTime.UtcNow;
        AdjudicationNotes = notes;

        switch (decision.ToLowerInvariant())
        {
            case "approve":
                Status = ClaimStatus.Approved;
                FinalDeduction = ProposedDeduction;
                break;

            case "revise":
                Status = ClaimStatus.Revised;
                if (!revisedDeduction.HasValue || revisedDeduction.Value < 0)
                    throw new ArgumentException("A non-negative revised deduction amount is required for 'Revise' decision.");
                FinalDeduction = revisedDeduction.Value;
                break;

            case "reject":
                Status = ClaimStatus.Rejected;
                FinalDeduction = 0m;
                break;

            default:
                throw new ArgumentException($"Invalid adjudication decision: {decision}. Must be 'Approve', 'Revise', or 'Reject'.");
        }

        MarkUpdated();
    }

    public void MarkSettled()
    {
        Status = ClaimStatus.Settled;
        MarkUpdated();
    }
}
