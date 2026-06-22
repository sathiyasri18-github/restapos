namespace CustomerApi.Domain.Entities;

public class PaymentWithCreditCard
{
    public int Id { get; set; }
    public int PaymentId { get; set; }
    public int? CustomerId { get; set; }
    public string? CustomerStripeId { get; set; }
    public string ChargeId { get; set; } = null!;
    public DateTime? CreatedDate { get; set; }
    public DateTime? ModifiedDate { get; set; }
}
