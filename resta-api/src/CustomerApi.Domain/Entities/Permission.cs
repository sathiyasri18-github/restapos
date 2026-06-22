namespace CustomerApi.Domain.Entities;

public class Permission
{
    public int Id { get; set; }
    public string Name { get; set; } = null!;
    public string GuardName { get; set; } = null!;
    public DateTime? CreatedDate { get; set; }
    public DateTime? ModifiedDate { get; set; }
}
