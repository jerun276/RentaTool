using System.ComponentModel.DataAnnotations;
using RentaTool.Modules.Booking.Domain;

namespace RentaTool.Modules.Booking.Application.DTOs;

public class CreateBookingRequestDto
{
    [Required]
    public Guid EquipmentId { get; set; }

    [Required]
    public Guid OwnerId { get; set; }

    [Required]
    public DateTime StartDate { get; set; }

    [Required]
    public DateTime EndDate { get; set; }

    [Required]
    [Range(0.01, 1000000.0, ErrorMessage = "Daily rate must be strictly positive.")]
    public decimal DailyRate { get; set; }
}

public class BookingResponseDto
{
    public Guid Id { get; set; }
    public Guid EquipmentId { get; set; }
    public Guid RenterId { get; set; }
    public Guid OwnerId { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public decimal DailyRate { get; set; }
    public decimal TotalRentalFee { get; set; }
    public string Status { get; set; } = string.Empty;
    public string? CancellationReason { get; set; }
    public DateTime CreatedAtUtc { get; set; }
    public DateTime? UpdatedAtUtc { get; set; }
}

public class ActiveBookingSummaryDto
{
    public Guid Id { get; set; }
    public Guid EquipmentId { get; set; }
    public Guid RenterId { get; set; }
    public Guid OwnerId { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public decimal TotalRentalFee { get; set; }
    public string Status { get; set; } = string.Empty;
    public bool PickupVerified { get; set; }
    public bool ReturnVerified { get; set; }
    public DateTime CreatedAtUtc { get; set; }
}

public class GenerateHandoverTokenRequestDto
{
    [Required]
    public HandoverEventType EventType { get; set; }
}

public class HandoverTokenResponseDto
{
    public Guid BookingId { get; set; }
    public string EventType { get; set; } = string.Empty;
    public string Token { get; set; } = string.Empty;
    public DateTime ExpiresAtUtc { get; set; }
    public string Instructions { get; set; } = string.Empty;
}

public class VerifyHandoverRequestDto
{
    [Required(ErrorMessage = "Handover token is required.")]
    public string Token { get; set; } = string.Empty;

    [Required]
    public HandoverEventType EventType { get; set; }

    [Range(-90.0, 90.0, ErrorMessage = "Latitude must be between -90 and 90.")]
    public double Latitude { get; set; }

    [Range(-180.0, 180.0, ErrorMessage = "Longitude must be between -180 and 180.")]
    public double Longitude { get; set; }

    public string? AddressLine { get; set; }
    public string? City { get; set; }
    public string? PostalCode { get; set; }
}

public class HandoverVerificationResponseDto
{
    public Guid BookingId { get; set; }
    public string EventType { get; set; } = string.Empty;
    public DateTime VerifiedAtUtc { get; set; }
    public string NewBookingStatus { get; set; } = string.Empty;
    public bool IsSuccess { get; set; }
    public string Message { get; set; } = string.Empty;
}

public class ExtendScheduleRequestDto
{
    [Required]
    public DateTime NewEndDate { get; set; }
}

public class ExtendScheduleResponseDto
{
    public Guid BookingId { get; set; }
    public DateTime PreviousEndDate { get; set; }
    public DateTime NewEndDate { get; set; }
    public int ExtendedDays { get; set; }
    public decimal BaseDailyRate { get; set; }
    public decimal SurgeMultiplier { get; set; }
    public decimal SurgeDailyRate { get; set; }
    public decimal AdditionalFee { get; set; }
    public decimal NewTotalRentalFee { get; set; }
    public string Reason { get; set; } = string.Empty;
}
