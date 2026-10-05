using RentaTool.Shared.Kernel.Domain;

namespace RentaTool.Modules.Booking.Domain;

public class GeoLocation : BaseEntity
{
    public double Latitude { get; private set; }
    public double Longitude { get; private set; }
    public string AddressLine { get; private set; } = string.Empty;
    public string City { get; private set; } = string.Empty;
    public string PostalCode { get; private set; } = string.Empty;

    // EF Core Constructor
    private GeoLocation() { }

    public GeoLocation(double latitude, double longitude, string addressLine, string city, string postalCode)
    {
        if (latitude < -90.0 || latitude > 90.0)
            throw new ArgumentOutOfRangeException(nameof(latitude), "Latitude must be between -90 and 90.");
        if (longitude < -180.0 || longitude > 180.0)
            throw new ArgumentOutOfRangeException(nameof(longitude), "Longitude must be between -180 and 180.");

        Latitude = latitude;
        Longitude = longitude;
        AddressLine = addressLine ?? string.Empty;
        City = city ?? string.Empty;
        PostalCode = postalCode ?? string.Empty;
    }
}
