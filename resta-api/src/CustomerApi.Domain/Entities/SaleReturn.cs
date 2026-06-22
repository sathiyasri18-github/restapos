namespace CustomerApi.Domain.Entities;

public class SaleReturn
{
    public int Id { get; set; }
    public string ReferenceNo { get; set; } = null!;
    public int UserId { get; set; }
    public int? CashRegisterId { get; set; }
    public int CustomerId { get; set; }
    public int WarehouseId { get; set; }
    public int BillerId { get; set; }
    public int AccountId { get; set; }
    public int Item { get; set; }
    public double TotalQty { get; set; }
    public double TotalDiscount { get; set; }
    public double TotalTax { get; set; }
    public double TotalPrice { get; set; }
    public double? OrderTaxRate { get; set; }
    public double? OrderTax { get; set; }
    public double GrandTotal { get; set; }
    public string? Document { get; set; }
    public string? ReturnNote { get; set; }
    public string? StaffNote { get; set; }
    public DateTime? CreatedDate { get; set; }
    public DateTime? ModifiedDate { get; set; }
}
