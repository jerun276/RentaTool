using System.ComponentModel.DataAnnotations;

namespace RentaTool.Modules.Identity.Application.Dtos;

public sealed record UpdateProfileRequestDto(
    [Required, StringLength(120, MinimumLength = 3)] string Name,
    [Required, StringLength(25, MinimumLength = 7)] string PhoneNumber,
    [StringLength(2048)] string? ProfilePhotoUrl = null
);
