namespace CustomerApi.Domain.Entities;

public class PaymentWithCheque
{
    public int Id { get; set; }
    public int PaymentId { get; set; }
    public string ChequeNo { get; set; } = null!;
    public DateTime? CreatedDate { get; set; }
    public DateTime? ModifiedDate { get; set; }
}
