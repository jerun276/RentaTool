using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using RentaTool.Modules.Escrow.Application.DTOs;
using RentaTool.Modules.Escrow.Application.Services;
using RentaTool.Modules.Escrow.Domain;
using RentaTool.Shared.Infrastructure.Persistence;
using RentaTool.Shared.Kernel.Domain;

namespace RentaTool.Modules.Escrow.Tests;

public class ClaimServiceTests
{
    private readonly Guid _bookingId = Guid.NewGuid();
    private readonly Guid _renterId = Guid.NewGuid();
    private readonly Guid _ownerId = Guid.NewGuid();
    private readonly Guid _staffUserId = Guid.NewGuid();

    private async Task<EscrowHold> SetupEscrowHoldAsync(AppDbContext context, decimal deposit = 20000m)
    {
        var hold = new EscrowHold(_bookingId, _renterId, _ownerId, deposit, "preauth_test_123");
        context.Set<EscrowHold>().Add(hold);
        await context.SaveChangesAsync();
        return hold;
    }

    [Fact]
    public async Task FileClaim_ValidClaim_CreatesClaimAndFlagsHoldDisputed()
    {
        // Arrange
        using var context = TestDbContextFactory.Create(nameof(FileClaim_ValidClaim_CreatesClaimAndFlagsHoldDisputed));
        var hold = await SetupEscrowHoldAsync(context, 20000m);
        var claimService = new ClaimService(context);

        var request = new FileClaimRequest(
            _bookingId,
            _ownerId,
            "Broken safety guard and dented motor casing",
            new List<string> { "https://cdn.rentatool.lk/damages/photo1.jpg" }
        );

        // Act
        var result = await claimService.FileClaimAsync(request);

        // Assert
        result.Should().NotBeNull();
        result.BookingId.Should().Be(_bookingId);
        result.FiledByUserId.Should().Be(_ownerId);
        result.DamageDescription.Should().Be("Broken safety guard and dented motor casing");
        result.Status.Should().Be(ClaimStatus.Filed.ToString());

        var updatedHold = await context.Set<EscrowHold>().FindAsync(hold.Id);
        updatedHold!.Status.Should().Be(EscrowStatus.Disputed);

        var claimInDb = await context.Set<DamageClaim>().FindAsync(result.ClaimId);
        claimInDb.Should().NotBeNull();
        claimInDb!.Status.Should().Be(ClaimStatus.Filed);
    }

    [Fact]
    public async Task AdjudicateClaim_Approve_SetsStatusApprovedAndDeduction()
    {
        // Arrange
        using var context = TestDbContextFactory.Create(nameof(AdjudicateClaim_Approve_SetsStatusApprovedAndDeduction));
        await SetupEscrowHoldAsync(context, 20000m);
        var claimService = new ClaimService(context);

        var fileRequest = new FileClaimRequest(
            _bookingId,
            _ownerId,
            "Scratched panel",
            new List<string> { "photo.jpg" }
        );
        var claim = await claimService.FileClaimAsync(fileRequest);

        // Set simulated AI proposal
        var claimEntity = await context.Set<DamageClaim>().FindAsync(claim.ClaimId);
        claimEntity!.SetAIEvaluationResult(5000m);
        await context.SaveChangesAsync();

        var adjRequest = new AdjudicateClaimRequest(
            Decision: "Approve",
            RevisedDeduction: null,
            AdjudicatorId: _staffUserId,
            Notes: "Verified photos. Damage exceeds regular wear and tear."
        );

        // Act
        var result = await claimService.AdjudicateClaimAsync(claim.ClaimId, adjRequest);

        // Assert
        result.Status.Should().Be(ClaimStatus.Approved.ToString());
        result.FinalDeduction.Should().Be(5000m);
        result.AdjudicationNotes.Should().Be(adjRequest.Notes);
        result.AdjudicatedByUserId.Should().Be(_staffUserId);
    }

    [Fact]
    public async Task AdjudicateClaim_Revise_SetsRevisedAmountAndApprovedStatus()
    {
        // Arrange
        using var context = TestDbContextFactory.Create(nameof(AdjudicateClaim_Revise_SetsRevisedAmountAndApprovedStatus));
        await SetupEscrowHoldAsync(context, 20000m);
        var claimService = new ClaimService(context);

        var fileRequest = new FileClaimRequest(
            _bookingId,
            _ownerId,
            "Paint scratched and blade blunt",
            new List<string> { "photo.jpg" }
        );
        var claim = await claimService.FileClaimAsync(fileRequest);

        var adjRequest = new AdjudicateClaimRequest(
            Decision: "Revise",
            RevisedDeduction: 6000m,
            AdjudicatorId: _staffUserId,
            Notes: "Blade wear is normal wear-and-tear. Compensating paint scratches only (Rs. 6000)."
        );

        // Act
        var result = await claimService.AdjudicateClaimAsync(claim.ClaimId, adjRequest);

        // Assert
        result.Status.Should().Be(ClaimStatus.Revised.ToString());
        result.FinalDeduction.Should().Be(6000m);
        result.AdjudicationNotes.Should().Contain("normal wear-and-tear");
    }

    [Fact]
    public async Task AdjudicateClaim_Reject_SetsStatusRejectedAndZeroDeduction()
    {
        // Arrange
        using var context = TestDbContextFactory.Create(nameof(AdjudicateClaim_Reject_SetsStatusRejectedAndZeroDeduction));
        await SetupEscrowHoldAsync(context, 20000m);
        var claimService = new ClaimService(context);

        var fileRequest = new FileClaimRequest(
            _bookingId,
            _ownerId,
            "Dust on wheels",
            new List<string> { "photo.jpg" }
        );
        var claim = await claimService.FileClaimAsync(fileRequest);

        var adjRequest = new AdjudicateClaimRequest(
            Decision: "Reject",
            RevisedDeduction: null,
            AdjudicatorId: _staffUserId,
            Notes: "Dust is normal operating condition, not damage."
        );

        // Act
        var result = await claimService.AdjudicateClaimAsync(claim.ClaimId, adjRequest);

        // Assert
        result.Status.Should().Be(ClaimStatus.Rejected.ToString());
        result.FinalDeduction.Should().Be(0m);
    }

    [Fact]
    public async Task ProcessPayout_ApprovedClaim_SplitsPayoutBetweenOwnerAndRenter()
    {
        // Arrange
        using var context = TestDbContextFactory.Create(nameof(ProcessPayout_ApprovedClaim_SplitsPayoutBetweenOwnerAndRenter));
        var hold = await SetupEscrowHoldAsync(context, 20000m);
        var claimService = new ClaimService(context);

        var fileRequest = new FileClaimRequest(
            _bookingId,
            _ownerId,
            "Cracked handle",
            new List<string> { "photo.jpg" }
        );
        var claim = await claimService.FileClaimAsync(fileRequest);

        await claimService.AdjudicateClaimAsync(claim.ClaimId, new AdjudicateClaimRequest(
            Decision: "Revise",
            RevisedDeduction: 8000m,
            AdjudicatorId: _staffUserId,
            Notes: "Approved deduction of 8,000 LKR"
        ));

        // Act
        var payout = await claimService.ProcessPayoutAsync(claim.ClaimId);

        // Assert
        payout.Should().NotBeNull();
        payout.ClaimId.Should().Be(claim.ClaimId);
        payout.OwnerPayoutAmount.Should().Be(8000m);
        payout.RenterRefundAmount.Should().Be(12000m); // 20000 - 8000
        payout.Status.Should().Be("Settled");

        // Verify Payments table
        var payments = await context.Set<Payment>().Where(p => p.BookingId == _bookingId).ToListAsync();
        payments.Should().HaveCount(2);

        var ownerPayment = payments.FirstOrDefault(p => p.RecipientUserId == _ownerId && p.PaymentType == PaymentType.DamagePayout);
        ownerPayment.Should().NotBeNull();
        ownerPayment!.Amount.Should().Be(8000m);
        ownerPayment.Status.Should().Be(PaymentStatus.Completed);

        var renterRefund = payments.FirstOrDefault(p => p.RecipientUserId == _renterId && p.PaymentType == PaymentType.DepositRefund);
        renterRefund.Should().NotBeNull();
        renterRefund!.Amount.Should().Be(12000m);
        renterRefund.Status.Should().Be(PaymentStatus.Completed);

        var updatedHold = await context.Set<EscrowHold>().FindAsync(hold.Id);
        updatedHold!.Status.Should().Be(EscrowStatus.Disbursed);
    }
}
