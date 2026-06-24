using CustomerApi.Application.Features.Metas.DTOs;
using CustomerApi.Domain.Entities;

namespace CustomerApi.Application.Features.Metas;

public static class MetaMapper
{
    public static MetaDto ToDto(Meta entity) => new()
    {
        MetaId = entity.Id,
        MetaName = entity.Name,
        MetaTypeId = entity.MetaTypeId,
        CreatedDate = entity.CreatedDate,
        ModifiedDate = entity.ModifiedDate,
    };

    public static Meta ToEntity(CreateMetaRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.MetaName))
            throw new ArgumentException("Meta name is required.");
        if (!request.MetaTypeId.HasValue || request.MetaTypeId.Value <= 0)
            throw new ArgumentException("Meta type is required.");

        return new Meta
        {
            Name = request.MetaName.Trim(),
            MetaTypeId = request.MetaTypeId.Value,
        };
    }

    public static void ApplyUpdate(Meta entity, UpdateMetaRequest request)
    {
        if (!string.IsNullOrWhiteSpace(request.MetaName))
            entity.Name = request.MetaName.Trim();
        if (request.MetaTypeId.HasValue && request.MetaTypeId.Value > 0)
            entity.MetaTypeId = request.MetaTypeId.Value;
    }
}
