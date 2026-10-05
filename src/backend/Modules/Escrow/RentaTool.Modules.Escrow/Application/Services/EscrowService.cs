using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using RentaTool.Modules.Escrow.Application.DTOs;
using RentaTool.Modules.Escrow.Domain;
using RentaTool.Shared.Infrastructure.Persistence;

namespace RentaTool.Modules.Escrow.Application.Services;

public class EscrowService : IEscrowService
{
    private readonly AppDbContext _context;

    public EscrowService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<PreAuthorizeDepositResponse> PreAuthorizeDepositAsync(
        PreAuthorizeDepositRequest request,
        CancellationToken cancellationToken = default)
    {
        if (request.DepositAmount <= 0)
            throw new ArgumentException("Deposit amount must be positive.", nameof(request.DepositAmount));

        // Simulated payment gateway pre-auth token
        var preAuthRef = $"GATEWAY-PREAUTH-{Guid.NewGuid().ToString("N")[..12].ToUpper()}";

        var escrow = new EscrowHold(
            request.BookingId,
            request.RenterId,
            request.OwnerId,
            request.DepositAmount,
            preAuthRef
        );

        _context.Set<EscrowHold>().Add(escrow);

        // Record Initial Hold Payment
        var holdPayment = new Payment(
            claimId: null,
            bookingId: request.BookingId,
            payerUserId: request.RenterId,
            recipientUserId: Guid.Empty, // Held in platform escrow account
            amount: request.DepositAmount,
            paymentType: PaymentType.DepositHold,
            gatewayTransactionRef: preAuthRef
        );
        holdPayment.MarkCompleted();
        _context.Set<Payment>().Add(holdPayment);

        await _context.SaveChangesAsync(cancellationToken);

        return new PreAuthorizeDepositResponse(
            escrow.Id,
            escrow.BookingId,
            escrow.DepositAmount,
            escrow.PreAuthTransactionId,
            escrow.Status.ToString(),
            escrow.HeldAtUtc
        );
    }

    public async Task<EscrowHold?> GetEscrowByBookingIdAsync(Guid bookingId, CancellationToken cancellationToken = default)
    {
        return await _context.Set<EscrowHold>()
            .FirstOrDefaultAsync(e => e.BookingId == bookingId, cancellationToken);
    }
}
