using RentaTool.Modules.Escrow.Application.DTOs;
using RentaTool.Modules.Escrow.Domain;

namespace RentaTool.Modules.Escrow.Application.Services;

public interface IEscrowService
{
    Task<PreAuthorizeDepositResponse> PreAuthorizeDepositAsync(PreAuthorizeDepositRequest request, CancellationToken cancellationToken = default);
    Task<EscrowHold?> GetEscrowByBookingIdAsync(Guid bookingId, CancellationToken cancellationToken = default);
}

public interface IClaimService
{
    Task<DamageClaimResponse> FileClaimAsync(FileClaimRequest request, CancellationToken cancellationToken = default);
    Task<DamageClaimResponse?> GetClaimByIdAsync(Guid claimId, CancellationToken cancellationToken = default);
    Task<List<DamageClaimResponse>> GetClaimsAsync(CancellationToken cancellationToken = default);
    Task<DamageClaimResponse> AdjudicateClaimAsync(Guid claimId, AdjudicateClaimRequest request, CancellationToken cancellationToken = default);
    Task<PayoutClaimResponse> ProcessPayoutAsync(Guid claimId, CancellationToken cancellationToken = default);
}
