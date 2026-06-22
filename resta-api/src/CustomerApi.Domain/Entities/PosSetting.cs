namespace CustomerApi.Domain.Entities;

public class PosSetting
{
    public int Id { get; set; }
    public int CustomerId { get; set; }
    public int WarehouseId { get; set; }
    public int BillerId { get; set; }
    public int ProductNumber { get; set; }
    public bool KeybordActive { get; set; }
    public string? StripePublicKey { get; set; }
    public string StripeSecretKey { get; set; } = null!;
    public DateTime? CreatedDate { get; set; }
    public DateTime? ModifiedDate { get; set; }
}
