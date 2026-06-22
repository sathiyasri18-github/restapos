namespace CustomerApi.Domain.Entities;

public class GiftCardRecharge
{
    public int Id { get; set; }
    public int GiftCardId { get; set; }
    public double Amount { get; set; }
    public int UserId { get; set; }
    public DateTime? CreatedDate { get; set; }
    public DateTime? ModifiedDate { get; set; }
}
