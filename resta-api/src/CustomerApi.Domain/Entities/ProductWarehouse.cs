namespace CustomerApi.Domain.Entities;

public class ProductWarehouse
{
    public int Id { get; set; }
    public string ProductId { get; set; } = null!;
    public int? ProductBatchId { get; set; }
    public int? VariantId { get; set; }
    public string? ImeiNumber { get; set; }
    public int WarehouseId { get; set; }
    public double Qty { get; set; }
    public double? Price { get; set; }
    public DateTime? CreatedDate { get; set; }
    public DateTime? ModifiedDate { get; set; }
}
