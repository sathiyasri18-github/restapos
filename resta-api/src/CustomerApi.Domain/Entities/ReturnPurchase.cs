namespace CustomerApi.Domain.Entities;

public class ReturnPurchase
{
    public int Id { get; set; }
    public string ReferenceNo { get; set; } = null!;
    public int? SupplierId { get; set; }
    public int WarehouseId { get; set; }
    public int UserId { get; set; }
    public int AccountId { get; set; }
    public int Item { get; set; }
    public double TotalQty { get; set; }
    public double TotalDiscount { get; set; }
    public double TotalTax { get; set; }
    public double TotalCost { get; set; }
    public double? OrderTaxRate { get; set; }
    public double? OrderTax { get; set; }
    public double GrandTotal { get; set; }
    public string? Document { get; set; }
    public string? ReturnNote { get; set; }
    public string? StaffNote { get; set; }
    public DateTime? CreatedDate { get; set; }
    public DateTime? ModifiedDate { get; set; }
}
