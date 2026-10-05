using RentaTool.Shared.Kernel.Domain;
using System.Text.Json.Serialization;

namespace RentaTool.Modules.Identity.Application.Dtos;

/// <summary>
/// KYC evidence and audit information exposed only to an administrator.
/// </summary>
public record AdminKycReviewDto(
    Guid KycRecordId,
    Guid UserId,
    string Name,
    string Email,
    string PhoneNumber,
    [property: JsonConverter(typeof(JsonStringEnumConverter))] UserRole Role,
    string DocumentType,
    string DocumentNumber,
    string FrontImageUrl,
    string? BackImageUrl,
    [property: JsonConverter(typeof(JsonStringEnumConverter))] KycStatus Status,
    DateTime SubmittedAtUtc,
    Guid? VerifiedByAdminId,
    DateTime? VerifiedAtUtc,
    string? RejectionReason);
