using RentaTool.Shared.Kernel.Domain;
using System.Text.Json.Serialization;

namespace RentaTool.Modules.Identity.Application.Dtos;

public record KycResponseDto(
    Guid Id,
    Guid UserId,
    string DocumentType,
    string DocumentNumber,
    [property: JsonConverter(typeof(JsonStringEnumConverter))] KycStatus Status,
    string FrontImageUrl,
    string? BackImageUrl,
    string? RejectionReason);
