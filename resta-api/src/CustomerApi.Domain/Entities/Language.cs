namespace CustomerApi.Domain.Entities;

public class Language
{
    public int Id { get; set; }
    public string Code { get; set; } = null!;
    public DateTime? CreatedDate { get; set; }
    public DateTime? ModifiedDate { get; set; }
}
