using RentaTool.Shared.Kernel.Domain;

namespace RentaTool.Modules.Identity.Application.Dtos;

public record KycResponseDto(
    Guid Id,
    Guid UserId,
    string DocumentType,
    string DocumentNumber,
    KycStatus Status,
    string FrontImageUrl,
    string? BackImageUrl,
    string? RejectionReason);
