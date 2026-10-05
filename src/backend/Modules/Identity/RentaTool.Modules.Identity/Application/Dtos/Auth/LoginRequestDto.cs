using System.ComponentModel.DataAnnotations;

namespace RentaTool.Modules.Identity.Application.Dtos;

public record LoginRequestDto(
    [Required, EmailAddress] string Email,
    [Required] string Password);
