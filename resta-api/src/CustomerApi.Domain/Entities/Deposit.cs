namespace CustomerApi.Domain.Entities;

public class Deposit
{
    public int Id { get; set; }
    public double Amount { get; set; }
    public int CustomerId { get; set; }
    public int UserId { get; set; }
    public string? Note { get; set; }
    public DateTime? CreatedDate { get; set; }
    public DateTime? ModifiedDate { get; set; }
}
