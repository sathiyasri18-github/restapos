namespace CustomerApi.Domain.Entities;

public class Coupon
{
    public int Id { get; set; }
    public string Code { get; set; } = null!;
    public string Type { get; set; } = null!;
    public double Amount { get; set; }
    public double? MinimumAmount { get; set; }
    public int Quantity { get; set; }
    public int Used { get; set; }
    public DateOnly ExpiredDate { get; set; }
    public int UserId { get; set; }
    public bool IsActive { get; set; }
    public DateTime? CreatedDate { get; set; }
    public DateTime? ModifiedDate { get; set; }
}
