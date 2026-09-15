using RentaTool.Shared.Kernel.Domain;

namespace RentaTool.Modules.Escrow.Domain;

public class WorkflowStateAudit : BaseEntity
{
    public Guid ClaimId { get; private set; }
    public string WorkflowId { get; private set; }
    public string CurrentState { get; private set; }
    public string AgentId { get; private set; }
    public string ToolCallsLog { get; private set; }
    public string DecisionSummary { get; private set; }
    public string? HumanReviewDecision { get; private set; }

    // Parameterless constructor for EF Core
    protected WorkflowStateAudit() { }

    public WorkflowStateAudit(
        Guid claimId,
        string workflowId,
        string currentState,
        string agentId,
        string toolCallsLog,
        string decisionSummary,
        string? humanReviewDecision = null)
    {
        ClaimId = claimId;
        WorkflowId = workflowId;
        CurrentState = currentState;
        AgentId = agentId;
        ToolCallsLog = string.IsNullOrWhiteSpace(toolCallsLog) ? "[]" : toolCallsLog;
        DecisionSummary = decisionSummary;
        HumanReviewDecision = humanReviewDecision;
    }
}
