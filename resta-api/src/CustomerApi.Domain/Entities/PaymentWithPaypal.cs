namespace CustomerApi.Domain.Entities;

public class PaymentWithPaypal
{
    public int Id { get; set; }
    public int PaymentId { get; set; }
    public string TransactionId { get; set; } = null!;
    public DateTime? CreatedDate { get; set; }
    public DateTime? ModifiedDate { get; set; }
}
