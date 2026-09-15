using System.ComponentModel.DataAnnotations;

namespace RentaTool.Modules.Identity.Application.Dtos;

public record SubmitKycRequestDto(
    [property: Required, RegularExpression("^(NIC|DrivingLicense)$", ErrorMessage = "Document type must be NIC or DrivingLicense.")] string DocumentType,
    [property: Required, StringLength(30)] string DocumentNumber,
    [property: Required, Url] string FrontImageUrl,
    [property: Url] string? BackImageUrl);
