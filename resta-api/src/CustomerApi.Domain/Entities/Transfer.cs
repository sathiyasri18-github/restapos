namespace CustomerApi.Domain.Entities;

public class Transfer
{
    public int Id { get; set; }
    public string ReferenceNo { get; set; } = null!;
    public int UserId { get; set; }
    public int Status { get; set; }
    public int FromWarehouseId { get; set; }
    public int ToWarehouseId { get; set; }
    public int Item { get; set; }
    public double TotalQty { get; set; }
    public double TotalTax { get; set; }
    public double TotalCost { get; set; }
    public double? ShippingCost { get; set; }
    public double GrandTotal { get; set; }
    public string? Document { get; set; }
    public string? Note { get; set; }
    public DateTime? CreatedDate { get; set; }
    public DateTime? ModifiedDate { get; set; }
}
