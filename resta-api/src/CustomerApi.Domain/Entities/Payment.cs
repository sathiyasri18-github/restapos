namespace CustomerApi.Domain.Entities;

public class Payment
{
    public int Id { get; set; }
    public string PaymentReference { get; set; } = null!;
    public int UserId { get; set; }
    public int? PurchaseId { get; set; }
    public int? SaleId { get; set; }
    public int? CashRegisterId { get; set; }
    public int AccountId { get; set; }
    public double Amount { get; set; }
    public double? UsedPoints { get; set; }
    public double Change { get; set; }
    public string PayingMethod { get; set; } = null!;
    public string? PaymentNote { get; set; }
    public DateTime? CreatedDate { get; set; }
    public DateTime? ModifiedDate { get; set; }
}
