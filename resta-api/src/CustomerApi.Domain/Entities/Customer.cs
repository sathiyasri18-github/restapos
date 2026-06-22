namespace CustomerApi.Domain.Entities;

public class Customer
{
    public int Id { get; set; }
    public int CustomerGroupId { get; set; }
    public int? UserId { get; set; }
    public string Name { get; set; } = null!;
    public string? CompanyName { get; set; }
    public string? Email { get; set; }
    public string PhoneNumber { get; set; } = null!;
    public string? TaxNo { get; set; }
    public string Address { get; set; } = null!;
    public string City { get; set; } = null!;
    public string? State { get; set; }
    public string? PostalCode { get; set; }
    public string? Country { get; set; }
    public double? Points { get; set; }
    public double? Deposit { get; set; }
    public double? Expense { get; set; }
    public bool? IsActive { get; set; }
    public DateTime? CreatedDate { get; set; }
    public DateTime? ModifiedDate { get; set; }
}
