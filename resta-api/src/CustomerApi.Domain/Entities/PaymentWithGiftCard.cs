namespace CustomerApi.Domain.Entities;

public class PaymentWithGiftCard
{
    public int Id { get; set; }
    public int PaymentId { get; set; }
    public int GiftCardId { get; set; }
    public DateTime? CreatedDate { get; set; }
    public DateTime? ModifiedDate { get; set; }
}
