namespace CustomerApi.Domain.Entities;

public class ProductReturn
{
    public int Id { get; set; }
    public int ReturnId { get; set; }
    public int ProductId { get; set; }
    public int? ProductBatchId { get; set; }
    public int? VariantId { get; set; }
    public string? ImeiNumber { get; set; }
    public double Qty { get; set; }
    public int SaleUnitId { get; set; }
    public double NetUnitPrice { get; set; }
    public double Discount { get; set; }
    public double TaxRate { get; set; }
    public double Tax { get; set; }
    public double Total { get; set; }
    public DateTime? CreatedDate { get; set; }
    public DateTime? ModifiedDate { get; set; }
}
