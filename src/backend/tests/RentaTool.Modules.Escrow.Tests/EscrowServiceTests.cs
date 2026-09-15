using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using RentaTool.Modules.Escrow.Application.DTOs;
using RentaTool.Modules.Escrow.Application.Services;
using RentaTool.Modules.Escrow.Domain;
using RentaTool.Shared.Infrastructure.Persistence;

namespace RentaTool.Modules.Escrow.Tests;

public class EscrowServiceTests
{
    private readonly Guid _bookingId = Guid.NewGuid();
    private readonly Guid _renterId = Guid.NewGuid();
    private readonly Guid _ownerId = Guid.NewGuid();

    [Fact]
    public async Task PreAuthorizeDeposit_ValidRequest_CreatesHoldAndPayment()
    {
        // Arrange
        using var context = TestDbContextFactory.Create(nameof(PreAuthorizeDeposit_ValidRequest_CreatesHoldAndPayment));
        var escrowService = new EscrowService(context);

        var request = new PreAuthorizeDepositRequest(
            _bookingId,
            _renterId,
            _ownerId,
            15000m,
            "tok_visa_test"
        );

        // Act
        var result = await escrowService.PreAuthorizeDepositAsync(request);

        // Assert
        result.Should().NotBeNull();
        result.BookingId.Should().Be(_bookingId);
        result.DepositAmount.Should().Be(15000m);
        result.Status.Should().Be(EscrowStatus.Held.ToString());
        result.PreAuthTransactionId.Should().StartWith("GATEWAY-PREAUTH-");

        var savedHold = await context.Set<EscrowHold>().FirstOrDefaultAsync(h => h.BookingId == _bookingId);
        savedHold.Should().NotBeNull();
        savedHold!.Status.Should().Be(EscrowStatus.Held);
        savedHold.PreAuthTransactionId.Should().Be(result.PreAuthTransactionId);

        var payment = await context.Set<Payment>().FirstOrDefaultAsync(p => p.BookingId == _bookingId);
        payment.Should().NotBeNull();
        payment!.PaymentType.Should().Be(PaymentType.DepositHold);
        payment.Amount.Should().Be(15000m);
        payment.Status.Should().Be(PaymentStatus.Completed);
    }

    [Fact]
    public async Task PreAuthorizeDeposit_ZeroOrNegativeAmount_ThrowsArgumentException()
    {
        // Arrange
        using var context = TestDbContextFactory.Create(nameof(PreAuthorizeDeposit_ZeroOrNegativeAmount_ThrowsArgumentException));
        var escrowService = new EscrowService(context);

        var request = new PreAuthorizeDepositRequest(
            _bookingId,
            _renterId,
            _ownerId,
            -500m,
            "tok_test"
        );

        // Act & Assert
        var act = () => escrowService.PreAuthorizeDepositAsync(request);
        await act.Should().ThrowAsync<ArgumentException>()
            .WithMessage("*positive*");
    }

    [Fact]
    public async Task GetEscrowByBookingId_ExistingHold_ReturnsHold()
    {
        // Arrange
        using var context = TestDbContextFactory.Create(nameof(GetEscrowByBookingId_ExistingHold_ReturnsHold));
        var escrowService = new EscrowService(context);

        var request = new PreAuthorizeDepositRequest(
            _bookingId,
            _renterId,
            _ownerId,
            12000m,
            "tok_test"
        );
        await escrowService.PreAuthorizeDepositAsync(request);

        // Act
        var hold = await escrowService.GetEscrowByBookingIdAsync(_bookingId);

        // Assert
        hold.Should().NotBeNull();
        hold!.BookingId.Should().Be(_bookingId);
        hold.DepositAmount.Should().Be(12000m);
    }

    [Fact]
    public async Task GetEscrowByBookingId_NonExistent_ReturnsNull()
    {
        // Arrange
        using var context = TestDbContextFactory.Create(nameof(GetEscrowByBookingId_NonExistent_ReturnsNull));
        var escrowService = new EscrowService(context);

        // Act
        var hold = await escrowService.GetEscrowByBookingIdAsync(Guid.NewGuid());

        // Assert
        hold.Should().BeNull();
    }
}
