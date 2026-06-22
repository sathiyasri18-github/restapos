namespace CustomerApi.Domain.Entities;

public class StockCount
{
    public int Id { get; set; }
    public string ReferenceNo { get; set; } = null!;
    public int WarehouseId { get; set; }
    public string? CategoryId { get; set; }
    public string? BrandId { get; set; }
    public int UserId { get; set; }
    public string Type { get; set; } = null!;
    public string? InitialFile { get; set; }
    public string? FinalFile { get; set; }
    public string? Note { get; set; }
    public bool IsAdjusted { get; set; }
    public DateTime? CreatedDate { get; set; }
    public DateTime? ModifiedDate { get; set; }
}
