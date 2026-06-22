namespace CustomerApi.Domain.Entities;

public class ProductAdjustment
{
    public int Id { get; set; }
    public int AdjustmentId { get; set; }
    public int ProductId { get; set; }
    public int? VariantId { get; set; }
    public double Qty { get; set; }
    public string Action { get; set; } = null!;
    public DateTime? CreatedDate { get; set; }
    public DateTime? ModifiedDate { get; set; }
}
