namespace CustomerApi.Domain.Entities;

public class Delivery
{
    public int Id { get; set; }
    public string ReferenceNo { get; set; } = null!;
    public int SaleId { get; set; }
    public int? UserId { get; set; }
    public string Address { get; set; } = null!;
    public string? DeliveredBy { get; set; }
    public string? RecievedBy { get; set; }
    public string? File { get; set; }
    public string? Note { get; set; }
    public string Status { get; set; } = null!;
    public DateTime? CreatedDate { get; set; }
    public DateTime? ModifiedDate { get; set; }
}
