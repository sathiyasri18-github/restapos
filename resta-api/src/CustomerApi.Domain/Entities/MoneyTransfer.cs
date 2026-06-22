namespace CustomerApi.Domain.Entities;

public class MoneyTransfer
{
    public int Id { get; set; }
    public string ReferenceNo { get; set; } = null!;
    public int FromAccountId { get; set; }
    public int ToAccountId { get; set; }
    public double Amount { get; set; }
    public DateTime? CreatedDate { get; set; }
    public DateTime? ModifiedDate { get; set; }
}
