namespace CustomerApi.Domain.Entities;

public class Adjustment
{
    public int Id { get; set; }
    public string ReferenceNo { get; set; } = null!;
    public int WarehouseId { get; set; }
    public string? Document { get; set; }
    public double TotalQty { get; set; }
    public int Item { get; set; }
    public string? Note { get; set; }
    public DateTime? CreatedDate { get; set; }
    public DateTime? ModifiedDate { get; set; }
}
