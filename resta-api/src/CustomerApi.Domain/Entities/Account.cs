namespace CustomerApi.Domain.Entities;

public class Account
{
    public int Id { get; set; }
    public string AccountNo { get; set; } = null!;
    public string Name { get; set; } = null!;
    public double? InitialBalance { get; set; }
    public double TotalBalance { get; set; }
    public string? Note { get; set; }
    public bool? IsDefault { get; set; }
    public bool IsActive { get; set; }
    public DateTime? CreatedDate { get; set; }
    public DateTime? ModifiedDate { get; set; }
}
