namespace CustomerApi.Domain.Entities;

public class Meta
{
    public int Id { get; set; }
    public int MetaTypeId { get; set; }
    public string Name { get; set; } = null!;
    public DateTime? CreatedDate { get; set; }
    public DateTime? ModifiedDate { get; set; }
    public MetaType? MetaType { get; set; }
}
