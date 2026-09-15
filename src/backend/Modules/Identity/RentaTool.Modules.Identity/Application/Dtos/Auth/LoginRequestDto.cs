using System.ComponentModel.DataAnnotations;

namespace RentaTool.Modules.Identity.Application.Dtos;

public record LoginRequestDto(
    [property: Required, EmailAddress] string Email,
    [property: Required] string Password);
