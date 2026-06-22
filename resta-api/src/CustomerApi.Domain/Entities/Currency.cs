namespace CustomerApi.Domain.Entities;

public class Currency
{
    public long Id { get; set; }
    public string Name { get; set; } = null!;
    public string Code { get; set; } = null!;
    public double ExchangeRate { get; set; }
    public DateTime? CreatedDate { get; set; }
    public DateTime? ModifiedDate { get; set; }
}
