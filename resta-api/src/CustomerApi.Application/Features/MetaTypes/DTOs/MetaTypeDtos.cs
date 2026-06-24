namespace CustomerApi.Application.Features.MetaTypes.DTOs;

public class MetaTypeDto
{
    public int MetaTypeId { get; set; }
    public string MetaTypeCode { get; set; } = null!;
    public string MetaTypeName { get; set; } = null!;
    public DateTime? CreatedDate { get; set; }
    public DateTime? ModifiedDate { get; set; }
}

public class CreateMetaTypeRequest
{
    public string? MetaTypeCode { get; set; }
    public string? MetaTypeName { get; set; }
}

public class UpdateMetaTypeRequest
{
    public string? MetaTypeCode { get; set; }
    public string? MetaTypeName { get; set; }
}
