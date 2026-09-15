using RentaTool.Shared.Kernel.Domain;

namespace RentaTool.Modules.Identity.Domain;

public class KycRecord : BaseEntity
{
    private KycRecord() { }
    public KycRecord(Guid userId, string documentType, string documentNumber, string frontImageUrl, string? backImageUrl)
    {
        UserId = userId; DocumentType = documentType.Trim(); DocumentNumber = documentNumber.Trim().ToUpperInvariant();
        FrontImageUrl = frontImageUrl.Trim(); BackImageUrl = backImageUrl?.Trim(); Status = KycStatus.Pending;
    }
    public Guid UserId { get; private set; }
    public string DocumentType { get; private set; } = string.Empty;
    public string DocumentNumber { get; private set; } = string.Empty;
    public string FrontImageUrl { get; private set; } = string.Empty;
    public string? BackImageUrl { get; private set; }
    public KycStatus Status { get; private set; }
    public Guid? VerifiedByAdminId { get; private set; }
    public string? RejectionReason { get; private set; }
    public DateTime? VerifiedAtUtc { get; private set; }
    public void Review(KycStatus status, Guid adminId, string? rejectionReason)
    {
        if (status == KycStatus.Pending) throw new ArgumentException("Verification status must be Approved or Rejected.");
        if (status == KycStatus.Rejected && string.IsNullOrWhiteSpace(rejectionReason)) throw new ArgumentException("A rejection reason is required.");
        Status = status; VerifiedByAdminId = adminId; RejectionReason = status == KycStatus.Rejected ? rejectionReason!.Trim() : null;
        VerifiedAtUtc = DateTime.UtcNow; MarkUpdated();
    }
}
