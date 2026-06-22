namespace CustomerApi.Domain.Entities;

public class Brand
{
    public int Id { get; set; }
    public string Title { get; set; } = null!;
    public string? Image { get; set; }
    public bool? IsActive { get; set; }
    public DateTime? CreatedDate { get; set; }
    public DateTime? ModifiedDate { get; set; }
}
