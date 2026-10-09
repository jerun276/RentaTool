using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using RentaTool.Modules.Escrow.Application.DTOs;
using RentaTool.Modules.Escrow.Domain;
using System.Net.Http;
using System.Net.Http.Json;
using RentaTool.Shared.Infrastructure.Persistence;
using RentaTool.Shared.Kernel.Domain;
using RentaTool.Modules.Booking.Domain;
using RentaTool.Modules.Catalog.Domain;

namespace RentaTool.Modules.Escrow.Application.Services;

public class ClaimService : IClaimService
{
    private readonly AppDbContext _context;
    private readonly IHttpClientFactory _httpClientFactory;

    public ClaimService(AppDbContext context, IHttpClientFactory httpClientFactory)
    {
        _context = context;
        _httpClientFactory = httpClientFactory;
    }

    public async Task<DamageClaimResponse> FileClaimAsync(
        FileClaimRequest request,
        CancellationToken cancellationToken = default)
    {
        var photosJson = JsonSerializer.Serialize(request.EvidencePhotos ?? new List<string>());

        var claim = new DamageClaim(
            request.BookingId,
            request.FiledByUserId,
            request.DamageDescription,
            photosJson
        );

        // Mark associated escrow as disputed if present
        var escrow = await _context.Set<EscrowHold>()
            .FirstOrDefaultAsync(e => e.BookingId == request.BookingId, cancellationToken);
        if (escrow != null && escrow.Status == EscrowStatus.Held)
        {
            escrow.MarkDisputed();
        }

        _context.Set<DamageClaim>().Add(claim);

        // Initialize WorkflowStateAudit record for AI dispute loop
        var audit = new WorkflowStateAudit(
            claim.Id,
            $"WF-{claim.Id.ToString()[..8].ToUpper()}",
            ClaimStatus.Filed.ToString(),
            "ClientPortal",
            photosJson,
            $"Claim filed by owner: {request.DamageDescription}"
        );
        _context.Set<WorkflowStateAudit>().Add(audit);

        await _context.SaveChangesAsync(cancellationToken);

        // --- Agentic AI Subsystem Integration ---
        claim.SubmitForAIEvaluation();
        await _context.SaveChangesAsync(cancellationToken);

        try
        {
            var client = _httpClientFactory.CreateClient("AIService");
            var payload = new
            {
                equipment_category = "General Equipment",
                damage_severity = "moderate", // simplified for demo
                rental_duration_days = 5,
                tool_age_months = 6,
                held_deposit = escrow?.DepositAmount ?? 0,
                claim_id = claim.Id.ToString(),
                booking_id = claim.BookingId.ToString()
            };

            var aiResponse = await client.PostAsJsonAsync("/api/v1/ai/execute-action", payload, cancellationToken);
            if (aiResponse.IsSuccessStatusCode)
            {
                var result = await aiResponse.Content.ReadFromJsonAsync<JsonElement>(cancellationToken: cancellationToken);
                if (result.TryGetProperty("proposed_deduction", out var deductionProp))
                {
                    decimal proposedDeduction = deductionProp.GetDecimal();
                    string? explanation = null;
                    if (result.TryGetProperty("explanation", out var explanationProp))
                    {
                        explanation = explanationProp.GetString();
                    }
                    
                    claim.SetAIEvaluationResult(proposedDeduction, explanation);
                    
                    var aiAudit = new WorkflowStateAudit(
                        claim.Id,
                        $"WF-{claim.Id.ToString()[..8].ToUpper()}",
                        ClaimStatus.PendingStaffApproval.ToString(),
                        "AgenticAI",
                        result.GetRawText(),
                        $"AI Adjudication complete. Proposed deduction: {proposedDeduction}"
                    );
                    _context.Set<WorkflowStateAudit>().Add(aiAudit);
                    
                    await _context.SaveChangesAsync(cancellationToken);
                }
            }
        }
        catch (Exception ex)
        {
            // If AI service fails, keep it in UnderAIEvaluation or revert to Filed.
            // For now, we'll just log it.
        }

        return await MapToResponseAsync(claim, cancellationToken);
    }

    public async Task<DamageClaimResponse?> GetClaimByIdAsync(Guid claimId, CancellationToken cancellationToken = default)
    {
        var claim = await _context.Set<DamageClaim>()
            .FirstOrDefaultAsync(c => c.Id == claimId, cancellationToken);

        return claim == null ? null : await MapToResponseAsync(claim, cancellationToken);
    }

    public async Task<List<DamageClaimResponse>> GetClaimsAsync(CancellationToken cancellationToken = default)
    {
        var claims = await _context.Set<DamageClaim>()
            .OrderByDescending(c => c.CreatedAtUtc)
            .ToListAsync(cancellationToken);

        var list = new List<DamageClaimResponse>();
        foreach (var c in claims)
        {
            list.Add(await MapToResponseAsync(c, cancellationToken));
        }
        return list;
    }

    public async Task<DamageClaimResponse> AdjudicateClaimAsync(
        Guid claimId,
        AdjudicateClaimRequest request,
        CancellationToken cancellationToken = default)
    {
        var claim = await _context.Set<DamageClaim>()
            .FirstOrDefaultAsync(c => c.Id == claimId, cancellationToken)
            ?? throw new KeyNotFoundException($"Damage claim {claimId} not found.");

        claim.Adjudicate(request.Decision, request.RevisedDeduction, request.AdjudicatorId, request.Notes);

        var audit = new WorkflowStateAudit(
            claim.Id,
            $"WF-{claim.Id.ToString()[..8].ToUpper()}",
            claim.Status.ToString(),
            $"Staff-{request.AdjudicatorId.ToString()[..8]}",
            "[]",
            $"Staff adjudicated decision: {request.Decision}. Notes: {request.Notes}",
            request.Decision
        );
        _context.Set<WorkflowStateAudit>().Add(audit);

        await _context.SaveChangesAsync(cancellationToken);

        return await MapToResponseAsync(claim, cancellationToken);
    }

    public async Task<PayoutClaimResponse> ProcessPayoutAsync(Guid claimId, CancellationToken cancellationToken = default)
    {
        var claim = await _context.Set<DamageClaim>()
            .FirstOrDefaultAsync(c => c.Id == claimId, cancellationToken)
            ?? throw new KeyNotFoundException($"Damage claim {claimId} not found.");

        var escrow = await _context.Set<EscrowHold>()
            .FirstOrDefaultAsync(e => e.BookingId == claim.BookingId, cancellationToken)
            ?? throw new InvalidOperationException($"No escrow hold found for booking {claim.BookingId}.");

        // Compute split settlement
        decimal finalDeduction = claim.FinalDeduction ?? claim.ProposedDeduction;
        decimal ownerPayout = Math.Min(finalDeduction, escrow.DepositAmount);
        decimal renterRefund = Math.Max(0m, escrow.DepositAmount - ownerPayout);

        // Execute escrow settlement
        escrow.Disburse(ownerPayout);
        claim.MarkSettled();

        var payoutTxRef = $"PAYOUT-OWNER-{Guid.NewGuid().ToString("N")[..10].ToUpper()}";
        var refundTxRef = $"REFUND-RENTER-{Guid.NewGuid().ToString("N")[..10].ToUpper()}";

        if (ownerPayout > 0)
        {
            var ownerPayment = new Payment(
                claimId: claim.Id,
                bookingId: claim.BookingId,
                payerUserId: Guid.Empty, // Platform Escrow
                recipientUserId: escrow.OwnerId,
                amount: ownerPayout,
                paymentType: PaymentType.DamagePayout,
                gatewayTransactionRef: payoutTxRef
            );
            ownerPayment.MarkCompleted();
            _context.Set<Payment>().Add(ownerPayment);
        }

        if (renterRefund > 0)
        {
            var renterPayment = new Payment(
                claimId: claim.Id,
                bookingId: claim.BookingId,
                payerUserId: Guid.Empty, // Platform Escrow
                recipientUserId: escrow.RenterId,
                amount: renterRefund,
                paymentType: PaymentType.DepositRefund,
                gatewayTransactionRef: refundTxRef
            );
            renterPayment.MarkCompleted();
            _context.Set<Payment>().Add(renterPayment);
        }

        var audit = new WorkflowStateAudit(
            claim.Id,
            $"WF-{claim.Id.ToString()[..8].ToUpper()}",
            ClaimStatus.Settled.ToString(),
            "PaymentGateway",
            "[]",
            $"Settlement finalized. Owner paid: LKR {ownerPayout:N2}, Renter refunded: LKR {renterRefund:N2}."
        );
        _context.Set<WorkflowStateAudit>().Add(audit);

        await _context.SaveChangesAsync(cancellationToken);

        return new PayoutClaimResponse(
            claim.Id,
            claim.BookingId,
            ownerPayout,
            renterRefund,
            claim.Status.ToString(),
            payoutTxRef,
            DateTime.UtcNow
        );
    }

    private async Task<DamageClaimResponse> MapToResponseAsync(DamageClaim claim, CancellationToken cancellationToken = default)
    {
        List<string> photos;
        try
        {
            photos = JsonSerializer.Deserialize<List<string>>(claim.EvidencePhotosJson) ?? new List<string>();
        }
        catch
        {
            photos = new List<string>();
        }

        List<string> pickupPhotos = new();
        string? equipmentTitle = null;

        try
        {
            var booking = await _context.Set<RentaTool.Modules.Booking.Domain.Booking>()
                .AsNoTracking()
                .FirstOrDefaultAsync(b => b.Id == claim.BookingId, cancellationToken);

            if (booking != null)
            {
                var equipment = await _context.Set<Equipment>()
                    .AsNoTracking()
                    .Include(e => e.Images)
                    .Include(e => e.InspectionLogs)
                    .FirstOrDefaultAsync(e => e.Id == booking.EquipmentId, cancellationToken);

                if (equipment != null)
                {
                    equipmentTitle = equipment.Title;

                    // 1. Look for pre-rental inspection photos for this booking (or latest pre-rental inspection)
                    var preRentalLog = equipment.InspectionLogs
                        .Where(l => l.Type == InspectionType.PreRental)
                        .OrderByDescending(l => l.BookingId == claim.BookingId)
                        .ThenByDescending(l => l.CreatedAtUtc)
                        .FirstOrDefault();

                    if (preRentalLog != null && !string.IsNullOrWhiteSpace(preRentalLog.PhotosJson))
                    {
                        try
                        {
                            using var doc = JsonDocument.Parse(preRentalLog.PhotosJson);
                            if (doc.RootElement.ValueKind == JsonValueKind.Array)
                            {
                                foreach (var elem in doc.RootElement.EnumerateArray())
                                {
                                    if (elem.ValueKind == JsonValueKind.String)
                                    {
                                        pickupPhotos.Add(elem.GetString()!);
                                    }
                                    else if (elem.ValueKind == JsonValueKind.Object && elem.TryGetProperty("PhotoUrl", out var photoUrlProp))
                                    {
                                        var url = photoUrlProp.GetString();
                                        if (!string.IsNullOrWhiteSpace(url))
                                        {
                                            pickupPhotos.Add(url);
                                        }
                                    }
                                }
                            }
                        }
                        catch
                        {
                            // fallback
                        }
                    }

                    // 2. Fallback to equipment catalog images if no inspection photos exist
                    if (pickupPhotos.Count == 0 && equipment.Images.Any())
                    {
                        pickupPhotos.AddRange(equipment.Images
                            .OrderByDescending(i => i.IsPrimary)
                            .Select(i => i.ImageUrl)
                            .Where(u => !string.IsNullOrWhiteSpace(u)));
                    }
                }
            }
        }
        catch
        {
            // Fallback gracefully if database or relationship isn't populated
        }

        return new DamageClaimResponse(
            claim.Id,
            claim.BookingId,
            claim.FiledByUserId,
            claim.DamageDescription,
            photos,
            claim.ProposedDeduction,
            claim.FinalDeduction,
            claim.Status.ToString(),
            claim.AdjudicationNotes,
            claim.AdjudicatedByUserId,
            claim.AdjudicatedAtUtc,
            claim.CreatedAtUtc,
            pickupPhotos.Count > 0 ? pickupPhotos : null,
            equipmentTitle
        );
    }

    private static DamageClaimResponse MapToResponse(DamageClaim claim)
    {
        List<string> photos;
        try
        {
            photos = JsonSerializer.Deserialize<List<string>>(claim.EvidencePhotosJson) ?? new List<string>();
        }
        catch
        {
            photos = new List<string>();
        }

        return new DamageClaimResponse(
            claim.Id,
            claim.BookingId,
            claim.FiledByUserId,
            claim.DamageDescription,
            photos,
            claim.ProposedDeduction,
            claim.FinalDeduction,
            claim.Status.ToString(),
            claim.AdjudicationNotes,
            claim.AdjudicatedByUserId,
            claim.AdjudicatedAtUtc,
            claim.CreatedAtUtc
        );
    }
}
