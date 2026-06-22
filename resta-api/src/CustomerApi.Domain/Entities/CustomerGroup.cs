namespace CustomerApi.Domain.Entities;

public class CustomerGroup
{
    public int Id { get; set; }
    public string Name { get; set; } = null!;
    public string Percentage { get; set; } = null!;
    public bool? IsActive { get; set; }
    public DateTime? CreatedDate { get; set; }
    public DateTime? ModifiedDate { get; set; }
}
