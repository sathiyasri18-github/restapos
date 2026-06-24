namespace CustomerApi.Application.Features.Metas.DTOs;

public class MetaDto
{
    public int MetaId { get; set; }
    public string MetaName { get; set; } = null!;
    public int MetaTypeId { get; set; }
    public DateTime? CreatedDate { get; set; }
    public DateTime? ModifiedDate { get; set; }
}

public class CreateMetaRequest
{
    public string? MetaName { get; set; }
    public int? MetaTypeId { get; set; }
}

public class UpdateMetaRequest
{
    public string? MetaName { get; set; }
    public int? MetaTypeId { get; set; }
}
