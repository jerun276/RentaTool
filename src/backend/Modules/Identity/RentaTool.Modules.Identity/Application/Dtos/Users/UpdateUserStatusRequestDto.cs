using System.ComponentModel.DataAnnotations;

namespace RentaTool.Modules.Identity.Application.Dtos;

public sealed record UpdateUserStatusRequestDto(
    [Required] bool IsActive,
    [MaxLength(500)] string? Reason
);
