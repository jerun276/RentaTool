using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;
using RentaTool.Shared.Kernel.Domain;

namespace RentaTool.Modules.Identity.Application.Dtos;

public record VerificationStatusRequestDto(
    [property: JsonConverter(typeof(JsonStringEnumConverter))] KycStatus Status,
    [property: StringLength(500)] string? RejectionReason);
