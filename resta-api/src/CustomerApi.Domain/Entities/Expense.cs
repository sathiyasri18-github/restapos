namespace CustomerApi.Domain.Entities;

public class Expense
{
    public int Id { get; set; }
    public string ReferenceNo { get; set; } = null!;
    public int ExpenseCategoryId { get; set; }
    public int WarehouseId { get; set; }
    public int AccountId { get; set; }
    public int UserId { get; set; }
    public int? CashRegisterId { get; set; }
    public double Amount { get; set; }
    public string? Note { get; set; }
    public DateTime? CreatedDate { get; set; }
    public DateTime? ModifiedDate { get; set; }
}
