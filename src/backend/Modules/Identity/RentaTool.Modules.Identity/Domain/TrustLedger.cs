using RentaTool.Shared.Kernel.Domain;

namespace RentaTool.Modules.Identity.Domain;

public class TrustLedger : BaseEntity
{
    private TrustLedger() { }
    public TrustLedger(Guid userId, int scoreDelta, string reason, string? transactionReference, int runningTrustScore)
    { UserId = userId; ScoreDelta = scoreDelta; Reason = reason.Trim(); TransactionReference = transactionReference?.Trim(); RunningTrustScore = runningTrustScore; }
    public Guid UserId { get; private set; }
    public int ScoreDelta { get; private set; }
    public string Reason { get; private set; } = string.Empty;
    public string? TransactionReference { get; private set; }
    public int RunningTrustScore { get; private set; }
}
