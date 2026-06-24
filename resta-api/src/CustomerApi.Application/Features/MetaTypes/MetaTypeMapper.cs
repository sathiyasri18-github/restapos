using CustomerApi.Application.Features.MetaTypes.DTOs;
using CustomerApi.Domain.Entities;

namespace CustomerApi.Application.Features.MetaTypes;

public static class MetaTypeMapper
{
    public static MetaTypeDto ToDto(MetaType entity) => new()
    {
        MetaTypeId = entity.Id,
        MetaTypeCode = entity.Code,
        MetaTypeName = entity.Name,
        CreatedDate = entity.CreatedDate,
        ModifiedDate = entity.ModifiedDate,
    };

    public static MetaType ToEntity(CreateMetaTypeRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.MetaTypeCode))
            throw new ArgumentException("Meta type code is required.");
        if (string.IsNullOrWhiteSpace(request.MetaTypeName))
            throw new ArgumentException("Meta type name is required.");

        return new MetaType
        {
            Code = request.MetaTypeCode.Trim().ToUpperInvariant(),
            Name = request.MetaTypeName.Trim(),
        };
    }

    public static void ApplyUpdate(MetaType entity, UpdateMetaTypeRequest request)
    {
        if (!string.IsNullOrWhiteSpace(request.MetaTypeCode))
            entity.Code = request.MetaTypeCode.Trim().ToUpperInvariant();
        if (!string.IsNullOrWhiteSpace(request.MetaTypeName))
            entity.Name = request.MetaTypeName.Trim();
    }
}
