using System.ComponentModel.DataAnnotations;

namespace RentaTool.Modules.Identity.Application.Dtos;

public sealed record UpdateUserRoleRequestDto(
    [Required] string Role
);
