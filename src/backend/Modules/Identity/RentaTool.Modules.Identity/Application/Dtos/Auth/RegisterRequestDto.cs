using System.ComponentModel.DataAnnotations;

namespace RentaTool.Modules.Identity.Application.Dtos;

public record RegisterRequestDto(
    [property: Required, StringLength(120)] string Name,
    [property: Required, EmailAddress] string Email,
    [property: Required, MinLength(8), MaxLength(128)] string Password,
    [property: Required, RegularExpression("^(Renter|Owner)$", ErrorMessage = "Role must be Renter or Owner.")] string Role,
    [property: Required, StringLength(25)] string PhoneNumber);
