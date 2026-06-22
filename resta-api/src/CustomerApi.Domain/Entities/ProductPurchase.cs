namespace CustomerApi.Domain.Entities;

public class ProductPurchase
{
    public int Id { get; set; }
    public int PurchaseId { get; set; }
    public int ProductId { get; set; }
    public int? ProductBatchId { get; set; }
    public int? VariantId { get; set; }
    public string? ImeiNumber { get; set; }
    public double Qty { get; set; }
    public double Recieved { get; set; }
    public int PurchaseUnitId { get; set; }
    public double NetUnitCost { get; set; }
    public double Discount { get; set; }
    public double TaxRate { get; set; }
    public double Tax { get; set; }
    public double Total { get; set; }
    public DateTime? CreatedDate { get; set; }
    public DateTime? ModifiedDate { get; set; }
}
