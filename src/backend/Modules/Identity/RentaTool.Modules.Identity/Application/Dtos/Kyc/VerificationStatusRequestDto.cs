using System.ComponentModel.DataAnnotations;
using RentaTool.Shared.Kernel.Domain;

namespace RentaTool.Modules.Identity.Application.Dtos;

public record VerificationStatusRequestDto(
    KycStatus Status,
    [property: StringLength(500)] string? RejectionReason);
