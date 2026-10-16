using System.ComponentModel.DataAnnotations;

namespace RentaTool.Modules.Identity.Application.Dtos;

public record RefreshTokenRequestDto(
    [Required] string RefreshToken);
