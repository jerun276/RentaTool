using RentaTool.Shared.Kernel.Domain;

namespace RentaTool.Modules.Identity.Domain;

public class User : BaseEntity
{
    private User() { }

    public User(string name, string email, string passwordHash, UserRole role, string phoneNumber)
    {
        Name = name.Trim();
        Email = email.Trim().ToLowerInvariant();
        PasswordHash = passwordHash;
        Role = role;
        PhoneNumber = phoneNumber.Trim();
    }

    public string Name { get; private set; } = string.Empty;
    public string Email { get; private set; } = string.Empty;
    public string PasswordHash { get; private set; } = string.Empty;
    public UserRole Role { get; private set; }
    public string PhoneNumber { get; private set; } = string.Empty;
    public bool IsVerified { get; private set; }
    public bool IsActive { get; private set; } = true;
    public string? SuspensionReason { get; private set; }

    public void SetVerified() { IsVerified = true; MarkUpdated(); }
    public void SetUnverified() { IsVerified = false; MarkUpdated(); }
    public void Deactivate(string reason) { IsActive = false; SuspensionReason = string.IsNullOrWhiteSpace(reason) ? "Administrative suspension" : reason.Trim(); MarkUpdated(); }
    public void Activate() { IsActive = true; SuspensionReason = null; MarkUpdated(); }
    public void ChangeRole(UserRole newRole) { Role = newRole; MarkUpdated(); }
    public void UpdateProfile(string name, string phoneNumber) { Name = name.Trim(); PhoneNumber = phoneNumber.Trim(); MarkUpdated(); }
}
