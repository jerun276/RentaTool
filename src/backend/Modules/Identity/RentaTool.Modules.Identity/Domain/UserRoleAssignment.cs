using RentaTool.Shared.Kernel.Domain;

namespace RentaTool.Modules.Identity.Domain;

/// <summary>Normalized audit-friendly mapping of a user to their assigned role.</summary>
public class UserRoleAssignment : BaseEntity
{
    private UserRoleAssignment() { }
    public UserRoleAssignment(Guid userId, UserRole role) { UserId = userId; Role = role; }
    public Guid UserId { get; private set; }
    public UserRole Role { get; private set; }
}
