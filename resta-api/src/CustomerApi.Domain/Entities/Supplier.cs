namespace CustomerApi.Domain.Entities;

public class Supplier
{
    public int Id { get; set; }
    public string Name { get; set; } = null!;
    public string? Image { get; set; }
    public string CompanyName { get; set; } = null!;
    public string? VatNumber { get; set; }
    public string Email { get; set; } = null!;
    public string PhoneNumber { get; set; } = null!;
    public string Address { get; set; } = null!;
    public string City { get; set; } = null!;
    public string? State { get; set; }
    public string? PostalCode { get; set; }
    public string? Country { get; set; }
    public bool? IsActive { get; set; }
    public DateTime? CreatedDate { get; set; }
    public DateTime? ModifiedDate { get; set; }
}
