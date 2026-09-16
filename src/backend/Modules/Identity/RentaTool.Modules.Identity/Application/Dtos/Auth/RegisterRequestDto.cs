using System.ComponentModel.DataAnnotations;

namespace RentaTool.Modules.Identity.Application.Dtos;

public record RegisterRequestDto(
    [Required, StringLength(120)] string Name,
    [Required, EmailAddress] string Email,
    [Required, MinLength(8), MaxLength(128)] string Password,
    [Required, RegularExpression("^(Renter|Owner)$", ErrorMessage = "Role must be Renter or Owner.")] string Role,
    [Required, StringLength(25)] string PhoneNumber);
