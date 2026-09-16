using System.ComponentModel.DataAnnotations;

namespace RentaTool.Modules.Identity.Application.Dtos;

public record SubmitKycRequestDto(
    [Required, RegularExpression("^(NIC|DrivingLicense)$", ErrorMessage = "Document type must be NIC or DrivingLicense.")] string DocumentType,
    [Required, StringLength(30)] string DocumentNumber,
    [Required, Url] string FrontImageUrl,
    [Url] string? BackImageUrl);
