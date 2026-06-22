namespace CustomerApi.Domain.Entities;

public class Quotation
{
    public int Id { get; set; }
    public string ReferenceNo { get; set; } = null!;
    public int UserId { get; set; }
    public int BillerId { get; set; }
    public int? SupplierId { get; set; }
    public int CustomerId { get; set; }
    public int WarehouseId { get; set; }
    public int Item { get; set; }
    public double TotalQty { get; set; }
    public double TotalDiscount { get; set; }
    public double TotalTax { get; set; }
    public double TotalPrice { get; set; }
    public double? OrderTaxRate { get; set; }
    public double? OrderTax { get; set; }
    public double? OrderDiscount { get; set; }
    public double? ShippingCost { get; set; }
    public double GrandTotal { get; set; }
    public int QuotationStatus { get; set; }
    public string? Document { get; set; }
    public string? Note { get; set; }
    public DateTime? CreatedDate { get; set; }
    public DateTime? ModifiedDate { get; set; }
}
