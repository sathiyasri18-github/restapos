namespace CustomerApi.Domain.Entities;

public class ProductBatch
{
    public long Id { get; set; }
    public int ProductId { get; set; }
    public string BatchNo { get; set; } = null!;
    public DateOnly ExpiredDate { get; set; }
    public double Qty { get; set; }
    public DateTime? CreatedDate { get; set; }
    public DateTime? ModifiedDate { get; set; }
}
