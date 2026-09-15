using System.Security.Cryptography;

namespace RentaTool.Modules.Identity.Security;

internal static class PasswordHasher
{
    private const int Iterations = 210_000;

    public static string Hash(string password)
    {
        var salt = RandomNumberGenerator.GetBytes(16);
        var key = Rfc2898DeriveBytes.Pbkdf2(password, salt, Iterations, HashAlgorithmName.SHA512, 32);
        return $"{Convert.ToBase64String(salt)}.{Convert.ToBase64String(key)}";
    }

    public static bool Verify(string password, string stored)
    {
        var values = stored.Split('.');
        return values.Length == 2 && CryptographicOperations.FixedTimeEquals(
            Convert.FromBase64String(values[1]),
            Rfc2898DeriveBytes.Pbkdf2(password, Convert.FromBase64String(values[0]), Iterations, HashAlgorithmName.SHA512, 32));
    }
}
