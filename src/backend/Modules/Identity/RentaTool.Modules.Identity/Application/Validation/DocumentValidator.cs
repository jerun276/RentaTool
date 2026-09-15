using System.Text.RegularExpressions;

namespace RentaTool.Modules.Identity.Application.Validation;

internal static class DocumentValidator
{
    public static bool IsValid(string type, string number) => type == "NIC"
        ? Regex.IsMatch(number, @"^(\d{9}[VXvx]|\d{12})$")
        : type == "DrivingLicense" && Regex.IsMatch(number, @"^[A-Za-z0-9/-]{5,30}$");
}
