using Microsoft.AspNetCore.Identity;

namespace CustomerApi.Domain.Entities;

public class User : IdentityUser<int>
{
    public string? RememberToken { get; set; }
    public string? CompanyName { get; set; }
    public int RoleId { get; set; }
    public int? BillerId { get; set; }
    public int? WarehouseId { get; set; }
    public bool IsActive { get; set; }
    public bool IsDeleted { get; set; }
    public DateTime? CreatedDate { get; set; }
    public DateTime? ModifiedDate { get; set; }

    public Role? Role { get; set; }
}
