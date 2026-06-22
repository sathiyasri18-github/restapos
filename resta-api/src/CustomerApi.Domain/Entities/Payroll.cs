namespace CustomerApi.Domain.Entities;

public class Payroll
{
    public int Id { get; set; }
    public string ReferenceNo { get; set; } = null!;
    public int EmployeeId { get; set; }
    public int AccountId { get; set; }
    public int UserId { get; set; }
    public double Amount { get; set; }
    public string PayingMethod { get; set; } = null!;
    public string? Note { get; set; }
    public DateTime? CreatedDate { get; set; }
    public DateTime? ModifiedDate { get; set; }
}
