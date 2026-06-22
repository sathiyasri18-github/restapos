namespace CustomerApi.Domain.Entities;

public class ProductVariant
{
    public int Id { get; set; }
    public int ProductId { get; set; }
    public int VariantId { get; set; }
    public int Position { get; set; }
    public string ItemCode { get; set; } = null!;
    public double? AdditionalPrice { get; set; }
    public double Qty { get; set; }
    public DateTime? CreatedDate { get; set; }
    public DateTime? ModifiedDate { get; set; }
}
