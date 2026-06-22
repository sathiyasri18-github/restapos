namespace CustomerApi.Domain.Entities;

public class CashRegister
{
    public int Id { get; set; }
    public double CashInHand { get; set; }
    public int UserId { get; set; }
    public int WarehouseId { get; set; }
    public bool Status { get; set; }
    public DateTime? CreatedDate { get; set; }
    public DateTime? ModifiedDate { get; set; }
}
