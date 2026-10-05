using RentaTool.Modules.Identity.Application.Dtos;
using RentaTool.Modules.Identity.Domain;

namespace RentaTool.Modules.Identity.Application.Services;

internal static class KycDtoMapper
{
    public static KycResponseDto Map(KycRecord record) => new(record.Id, record.UserId, record.DocumentType, record.DocumentNumber, record.Status, record.FrontImageUrl, record.BackImageUrl, record.RejectionReason);
}
