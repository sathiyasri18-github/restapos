namespace CustomerApi.Domain.Entities;

public class GiftCard
{
    public int Id { get; set; }
    public string CardNo { get; set; } = null!;
    public double Amount { get; set; }
    public double Expense { get; set; }
    public int? CustomerId { get; set; }
    public int? UserId { get; set; }
    public DateOnly? ExpiredDate { get; set; }
    public int CreatedBy { get; set; }
    public bool IsActive { get; set; }
    public DateTime? CreatedDate { get; set; }
    public DateTime? ModifiedDate { get; set; }
}
