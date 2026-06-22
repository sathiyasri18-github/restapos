using Microsoft.AspNetCore.Identity;

namespace CustomerApi.Domain.Entities;

public class Role : IdentityRole<int>
{
    public string? Description { get; set; }
    public string? GuardName { get; set; }
    public bool IsActive { get; set; }
    public DateTime? CreatedDate { get; set; }
    public DateTime? ModifiedDate { get; set; }
}
